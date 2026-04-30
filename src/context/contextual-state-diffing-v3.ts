import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ContextState {
  messages: Message[];
  knowledgeGraph: Map<string, Set<string>>;
  metadata: Record<string, any>;
}

export interface StructuralDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changed: boolean;
}

export interface SemanticDiff {
  relationship: string;
  oldState: string;
  newState: string;
  driftDetected: boolean;
}

export interface ContextDiffReport {
  structuralDiff: StructuralDiff[];
  semanticDrift: SemanticDiff[];
  temporalChange: boolean;
  summary: string;
}

export class ContextualStateDiffer {
  private previousState: ContextState | null = null;

  constructor() {}

  public setPreviousState(state: ContextState): void {
    this.previousState = state;
  }

  private serializeKnowledgeGraph(graph: Map<string, Set<string>>): Record<string, string[]> {
    const serialized: Record<string, string[]> = {};
    for (const [subject, neighbors] of graph.entries()) {
      serialized[subject] = Array.from(neighbors).sort();
    }
    return serialized;
  }

  private compareKnowledgeGraphs(
    oldGraph: Map<string, Set<string>>,
    newGraph: Map<string, Set<string>>
  ): SemanticDiff[] {
    const semanticDiffs: SemanticDiff[] = [];
    const oldSerialized = this.serializeKnowledgeGraph(oldGraph);
    const newSerialized = this.serializeKnowledgeGraph(newGraph);

    const allSubjects = new Set<string>([...Object.keys(oldSerialized), ...Object.keys(newSerialized)]);

    for (const subject of allSubjects) {
      const oldNeighbors = oldSerialized[subject] || [];
      const newNeighbors = newSerialized[subject] || [];

      const oldSet = new Set(oldNeighbors);
      const newSet = new Set(newNeighbors);

      const added = [...newSet].filter(item => !oldSet.has(item));
      const removed = [...oldSet].filter(item => !newSet.has(item));

      if (added.length > 0 || removed.length > 0) {
        semanticDiffs.push({
          relationship: subject,
          oldState: oldNeighbors.join('; '),
          newState: newNeighbors.join('; '),
          driftDetected: true,
        });
      }
    }
    return semanticDiffs;
  }

  private compareMessages(oldMessages: Message[], newMessages: Message[]): StructuralDiff[] {
    const structuralDiffs: StructuralDiff[] = [];
    if (oldMessages.length !== newMessages.length) {
      structuralDiffs.push({
        field: "messages",
        oldValue: oldMessages.length,
        newValue: newMessages.length,
        changed: true,
      });
    }
    // Simplified comparison: only check the last message for content change
    if (oldMessages.length > 0 && newMessages.length > 0) {
      const lastOld = oldMessages[oldMessages.length - 1];
      const lastNew = newMessages[newMessages.length - 1];

      if (JSON.stringify(lastOld) !== JSON.stringify(lastNew)) {
        structuralDiffs.push({
          field: "messages[last]",
          oldValue: JSON.stringify(lastOld),
          newValue: JSON.stringify(lastNew),
          changed: true,
        });
      }
    }
    return structuralDiffs;
  }

  public diffContext(currentState: ContextState): ContextDiffReport {
    if (!this.previousState) {
      return {
        structuralDiff: [],
        semanticDrift: [],
        temporalChange: false,
        summary: "No previous state available for comparison.",
      };
    }

    const structuralDiffs: StructuralDiff[] = [];
    const semanticDiffs: SemanticDiff[] = [];
    let temporalChange = false;

    // 1. Structural Diffing (Messages & Metadata)
    structuralDiffs.push(...this.compareMessages(
      this.previousState.messages,
      currentState.messages
    ));

    // Metadata comparison (simple deep check)
    const metaOld = this.previousState.metadata;
    const metaNew = currentState.metadata;
    for (const key in metaNew) {
      if (JSON.stringify(metaOld[key]) !== JSON.stringify(metaNew[key])) {
        structuralDiffs.push({
          field: `metadata.${key}`,
          oldValue: metaOld[key],
          newValue: metaNew[key],
          changed: true,
        });
      }
    }

    // 2. Semantic Diffing (Knowledge Graph)
    semanticDiffs.push(...this.compareKnowledgeGraphs(
      this.previousState.knowledgeGraph,
      currentState.knowledgeGraph
    ));

    // 3. Determine Temporal Change
    if (structuralDiffs.length > 0 || semanticDiffs.length > 0) {
      temporalChange = true;
    }

    const summary = `Context updated. Structural changes detected: ${structuralDiffs.filter(d => d.changed).length}. Semantic drifts detected: ${semanticDiffs.filter(d => d.driftDetected).length}.`;

    const report: ContextDiffReport = {
      structuralDiff: structuralDiffs,
      semanticDrift: semanticDiffs,
      temporalChange: temporalChange,
      summary: summary,
    };

    // Update state for next run
    this.previousState = currentState;
    return report;
  }
}
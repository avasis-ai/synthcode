import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface StateSources {
  memory: Record<string, unknown>;
  context: Record<string, unknown>;
  toolState: Record<string, unknown>;
}

interface DiffFinding {
  source: "memory" | "context" | "toolState";
  path: string;
  type: "structural" | "semantic" | "temporal";
  description: string;
  details: unknown;
}

export interface DiffReport {
  findings: DiffFinding[];
  isDifferent: boolean;
}

type DiffStage = (
  currentState: StateSources;
  previousState: StateSources;
): DiffFinding[];

class ContextualStateDiffer {
  private sources: StateSources;
  private previousSources: StateSources;

  constructor(currentState: StateSources, previousState: StateSources) {
    this.sources = currentState;
    this.previousSources = previousState;
  }

  private structuralDiff(current: StateSources, previous: StateSources): DiffFinding[] {
    const findings: DiffFinding[] = [];

    const diffSource = (sourceName: keyof StateSources) => {
      const currentVal = current[sourceName];
      const previousVal = previous[sourceName];

      if (typeof currentVal !== typeof previousVal) {
        findings.push({
          source: sourceName,
          path: `${sourceName}[]`,
          type: "structural",
          description: `Type mismatch detected for ${sourceName}.`,
          details: { current: typeof currentVal, previous: typeof previousVal },
        });
      } else if (typeof currentVal === 'object' && currentVal !== null && typeof previousVal === 'object' && previousVal !== null) {
        const keysCurrent = Object.keys(currentVal) as Array<keyof typeof currentVal>;
        const keysPrevious = Object.keys(previousVal) as Array<keyof typeof previousVal>;

        const addedKeys: Array<keyof typeof currentVal> = keysCurrent.filter(key => !keysPrevious.includes(key));
        const removedKeys: Array<keyof typeof currentVal> = keysPrevious.filter(key => !keysCurrent.includes(key));

        if (addedKeys.length > 0 || removedKeys.length > 0) {
          findings.push({
            source: sourceName,
            path: `${sourceName}[]`,
            type: "structural",
            description: `Key set changed in ${sourceName}. Added: ${addedKeys.join(', ')}. Removed: ${removedKeys.join(', ')}.`,
            details: { added: addedKeys, removed: removedKeys },
          });
        }
        // Deep structural check omitted for brevity but would recurse here
      }
      return findings;
    };

    return [
      ...diffSource("memory")!,
      ...diffSource("context")!,
      ...diffSource("toolState")!,
    ];
  }

  private semanticDiff(current: StateSources, previous: StateSources): DiffFinding[] {
    const findings: DiffFinding[] = [];

    const checkSemantic = (sourceName: keyof StateSources, currentVal: unknown, previousVal: unknown): DiffFinding[] => {
      if (typeof currentVal === 'string' && typeof previousVal === 'string') {
        if (currentVal.toLowerCase() !== previousVal.toLowerCase()) {
          return [{
            source: sourceName,
            path: `${sourceName}['content']`,
            type: "semantic",
            description: `Content value changed semantically.`,
            details: { previous: previousVal, current: currentVal },
          }];
        }
      }
      return [];
    };

    // Example: Check if a specific key in context changed its meaning (e.g., a status flag)
    const contextFindings = checkSemantic("context", current.context["status"] ?? "", previous.context["status"] ?? "");
    findings.push(...contextFindings);

    // Example: Check if memory content significantly changed (simple string comparison)
    const memoryFindings = checkSemantic("memory", current.memory["last_user_input"] ?? "", previous.memory["last_user_input"] ?? "");
    findings.push(...memoryFindings);

    return findings;
  }

  private temporalDiff(current: StateSources, previous: StateSources): DiffFinding[] {
    const findings: DiffFinding[] = [];

    // Temporal check: Detect if the sequence of messages implies a time jump or reversal
    const checkMessageSequence = (currentMsgs: Message[], previousMsgs: Message[]): DiffFinding[] => {
      if (currentMsgs.length !== previousMsgs.length) {
        return [{
          source: "context",
          path: "messages[]",
          type: "temporal",
          description: `Message count mismatch. Added ${currentMsgs.length - previousMsgs.length} or removed ${previousMsgs.length - currentMsgs.length} messages.`,
          details: { currentCount: currentMsgs.length, previousCount: previousMsgs.length },
        }];
      }
      // More complex temporal checks (e.g., checking timestamps if available) would go here
      return [];
    };

    // Assuming context holds the message history for this example
    const currentMessages: Message[] = (current.context as any)?.messages || [];
    const previousMessages: Message[] = (this.previousSources.context as any)?.messages || [];

    const messageFindings = checkMessageSequence(currentMessages, previousMessages);
    findings.push(...messageFindings);

    return findings;
  }

  public executeDiff(): DiffReport {
    const structuralFindings = this.structuralDiff(this.sources, this.previousSources);
    const semanticFindings = this.semanticDiff(this.sources, this.previousSources);
    const temporalFindings = this.temporalDiff(this.sources, this.previousSources);

    const allFindings: DiffFinding[] = [
      ...structuralFindings,
      ...semanticFindings,
      ...temporalFindings,
    ];

    const isDifferent = allFindings.length > 0;

    return {
      findings: allFindings,
      isDifferent: isDifferent,
    };
  }
}

export { ContextualStateDiffer };
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ContentBlock,
  ThinkingBlock,
} from "./types";

interface Triple {
  subject: string;
  predicate: string;
  object: string;
  source: string;
  timestamp: number;
}

interface KnowledgeGraph {
  triples: Set<string>;
  data: Map<string, Set<Triple>>;
}

export class ContextualKnowledgeGraphUpdaterV1 {
  private currentGraph: KnowledgeGraph;

  constructor(initialGraph: KnowledgeGraph) {
    this.currentGraph = initialGraph;
  }

  private generateTripleKey(triple: Triple): string {
    return `${triple.subject}|${triple.predicate}|${triple.object}`;
  }

  private extractTriplesFromMessage(message: Message): Triple[] {
    const triples: Triple[] = [];
    let content = "";

    if ("user" === (message as UserMessage).role) {
      content = (message as UserMessage).content;
    } else if ("assistant" === (message as AssistantMessage).role) {
      const assistantMessage = message as AssistantMessage;
      content = assistantMessage.content.map((block: ContentBlock) => {
        if ("text" === (block as TextBlock).type) {
          return (block as TextBlock).text;
        }
        return "";
      }).join(" ");
    } else if ("tool" === (message as ToolResultMessage).role) {
      content = (message as ToolResultMessage).content;
    }

    // Simple heuristic: Assume "X is Y" or "X has Y" patterns for demonstration
    // In a real system, this would involve NLP/NER extraction.
    const potentialTriples: Triple[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // Very basic Subject-Predicate-Object extraction simulation
      const parts = trimmedSentence.split(/\s+is\s+|\s+has\s+/i);
      if (parts.length >= 3) {
        const subject = parts[0].trim();
        const predicate = parts[1].trim();
        const object = parts.slice(2).join(" ").trim();
        if (subject && predicate && object) {
          potentialTriples.push({
            subject: subject,
            predicate: predicate,
            object: object,
            source: "extracted_from_text",
            timestamp: Date.now(),
          });
        }
      }
    }
    return potentialTriples;
  }

  private resolveConflict(
    existingTriple: Triple,
    newTriple: Triple,
    context: Message
  ): Triple {
    // Conflict Resolution Strategy:
    // 1. Recency: If the new source is more recent, prefer it.
    // 2. Source Authority: If the new source is marked as 'tool' and the existing is 'user', prefer tool.
    // 3. Semantic Similarity: (Skipped for this implementation, assume exact match or overwrite)

    if (newTriple.timestamp > existingTriple.timestamp) {
      return { ...newTriple, source: `Updated by ${context.role}` };
    }

    if (newTriple.source.includes("tool") && !existingTriple.source.includes("tool")) {
      return { ...newTriple, source: `Updated by ${context.role}` };
    }

    // Default: Keep existing if no strong reason to overwrite
    return existingTriple;
  }

  public updateGraph(
    graph: KnowledgeGraph,
    contextPayload: Message[],
    toolResults: ToolResultMessage[]
  ): KnowledgeGraph {
    let workingGraph = {
      triples: new Set(graph.triples),
      data: new Map(graph.data),
    };

    const allMessages: Message[] = [...contextPayload, ...(toolResults.map(
      (res) => ({
        role: "tool",
        tool_use_id: "N/A",
        content: res.content,
      } as ToolResultMessage))
    ) as Message];

    for (const message of allMessages) {
      const newTriples = this.extractTriplesFromMessage(message);

      for (const newTriple of newTriples) {
        let updated = false;
        let bestTriple: Triple | undefined = undefined;

        // Check for existing triples matching subject/predicate/object
        for (const [subject, setTriples] of workingGraph.data.entries()) {
          for (const existingTriple of setTriples) {
            if (
              existingTriple.subject === newTriple.subject &&
              existingTriple.predicate === newTriple.predicate &&
              existingTriple.object === newTriple.object
            ) {
              bestTriple = this.resolveConflict(existingTriple, newTriple, message);
              updated = true;
              break;
            }
          }
          if (updated) break;
        }

        if (bestTriple) {
          const key = this.generateTripleKey(bestTriple);
          if (!workingGraph.triples.has(key)) {
            workingGraph.triples.add(key);
            if (!workingGraph.data.has(bestTriple.subject)) {
              workingGraph.data.set(bestTriple.subject, new Set());
            }
            workingGraph.data.get(bestTriple.subject)!.add(bestTriple);
          } else {
            // Update the stored triple if conflict resolution changed it significantly
            const setTriples = workingGraph.data.get(bestTriple.subject)!;
            setTriples.delete(bestTriple);
            setTriples.add(bestTriple);
          }
        } else {
          // No conflict found, add as new
          const key = this.generateTripleKey(newTriple);
          if (!workingGraph.triples.has(key)) {
            workingGraph.triples.add(key);
            if (!workingGraph.data.has(newTriple.subject)) {
              workingGraph.data.set(newTriple.subject, new Set());
            }
            workingGraph.data.get(newTriple.subject)!.add(newTriple);
          }
        }
      }
    }

    return workingGraph;
  }
}
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface KnowledgeGraphTriple {
  subject: string;
  predicate: string;
  object: string;
}

export interface EnrichedContext {
  currentState: Record<string, any>;
  historySummary: string;
  knowledgeGraphTriples: KnowledgeGraphTriple[];
  toolCallContext: Record<string, any>;
}

export class StructuredToolCallContextEnricher {
  private readonly schemaRules: Map<string, { required: boolean; type: "string" | "number" | "boolean"; defaultValue?: any }>;

  constructor(schemaRules: Map<string, { required: boolean; type: "string" | "number" | "boolean"; defaultValue?: any }> = new Map()) {
    this.schemaRules = schemaRules;
  }

  private _diffState(currentState: Record<string, any>, previousState: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    for (const key in currentState) {
      if (!(key in previousState) || JSON.stringify(currentState[key]) !== JSON.stringify(previousState[key])) {
        diff[key] = currentState[key];
      }
    }
    return diff;
  }

  private _summarizeHistory(messages: Message[]): string {
    let summary = "Conversation history summary: ";
    if (messages.length === 0) {
      return summary + "No history provided.";
    }
    let content = messages.map(msg => {
      if (msg.role === "user") return `User: ${msg.content}`;
      if (msg.role === "assistant") return `Assistant: ${msg.content.map(block => block.type === "text" ? block.text : "").join(" ")}`;
      if (msg.role === "tool") return `Tool Result: ${msg.content}`;
      return "";
    }).join("\n");
    return summary + content.substring(0, Math.min(content.length, 500)) + (content.length > 500 ? "..." : "");
  }

  private _enrichWithKnowledgeGraph(triples: KnowledgeGraphTriple[]): string {
    if (triples.length === 0) {
      return "No relevant knowledge graph triples found.";
    }
    return `Knowledge Graph Context: Found ${triples.length} triples. Examples: (${triples[0].subject}) - ${triples[0].predicate} -> (${triples[0].object}) ...`;
  }

  private _resolveConflicts(enrichedContext: EnrichedContext, toolCallContext: Record<string, any>): Record<string, any> {
    const finalContext: Record<string, any> = { ...toolCallContext };

    for (const [key, rule] of this.schemaRules.entries()) {
      if (!rule.required) continue;

      let value: any = toolCallContext[key];

      if (value === undefined || value === null) {
        if (rule.defaultValue !== undefined) {
          value = rule.defaultValue;
        } else {
          continue;
        }
      } else {
        // Simple type checking/coercion simulation
        if (rule.type === "number" && typeof value !== "number") {
          try {
            value = parseFloat(String(value));
          } catch (e) {
            console.warn(`Could not coerce ${key} to number.`);
            continue;
          }
        }
      }
      finalContext[key] = value;
    }
    return finalContext;
  }

  public enrichContext(
    currentState: Record<string, any>,
    previousState: Record<string, any>,
    history: Message[],
    kgTriples: KnowledgeGraphTriple[],
    rawToolCallContext: Record<string, any>
  ): EnrichedContext {
    const stateDiff = this._diffState(currentState, previousState);
    const historySummary = this._summarizeHistory(history);
    const kgContext = this._enrichWithKnowledgeGraph(kgTriples);

    const enrichedContext: EnrichedContext = {
      currentState: stateDiff,
      historySummary: historySummary,
      knowledgeGraphTriples: kgTriples,
      toolCallContext: rawToolCallContext,
    };

    return enrichedContext;
  }

  public mergeEnrichedContext(
    enrichedContext: EnrichedContext,
    rawToolCallContext: Record<string, any>
  ): Record<string, any> {
    return this._resolveConflicts(enrichedContext, rawToolCallContext);
  }
}
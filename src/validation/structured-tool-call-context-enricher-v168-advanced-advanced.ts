import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface AdvancedContextEnrichment {
  prerequisites: {
    reason: string;
    suggested_steps: {
      step_name: string;
      input: Record<string, unknown>;
    }[];
  };
  potential_side_effects: {
    effect: string;
    mitigation_advice: string;
  }[];
  context_confidence_score: number;
}

export class StructuredToolCallContextEnricher {
  private context: Message[];
  private toolCall: ToolUseBlock;
  private history: Message[];

  constructor(context: Message[], toolCall: ToolUseBlock, history: Message[]) {
    this.context = context;
    this.toolCall = toolCall;
    this.history = history;
  }

  private analyzePrerequisites(): {
    reason: string;
    suggested_steps: {
      step_name: string;
      input: Record<string, unknown>;
    }[];
  } {
    const requiredInputs = this.toolCall.input;
    const missingContext: { [key: string]: string } = {};
    let missingCount = 0;

    // Simplified logic: Check if required inputs are present in the immediate context or history
    for (const key in requiredInputs) {
      const value = requiredInputs[key];
      if (typeof value === 'string' && value.length > 0) {
        // In a real system, this would involve deep semantic search over history
        // For this simulation, we assume if it's a string, it's available unless we detect a clear gap.
        if (!this.history.some(msg => this.isInputPresent(msg, key, value))) {
          missingContext[key] = "Contextual data missing or ambiguous.";
          missingCount++;
        }
      }
    }

    if (missingCount > 0) {
      return {
        reason: `The tool call '${this.toolCall.name}' requires context for ${Object.keys(missingContext).join(', ')}. Reviewing history suggests potential missing steps.`,
        suggested_steps: [
          {
            step_name: "Gather Missing Context",
            input: {
              reason: "The tool call needs more information.",
              context_keys: Object.keys(missingContext),
            },
          },
        ],
      };
    }

    return {
      reason: "Sufficient context appears available based on direct inputs.",
      suggested_steps: [],
    };
  }

  private analyzeSideEffects(): {
    effect: string;
    mitigation_advice: string;
  }[] {
    const effects: { effect: string; mitigation_advice: string }[] = [];
    const toolName = this.toolCall.name;

    if (toolName.includes("delete") || toolName.includes("update")) {
      effects.push({
        effect: `Potential data mutation via tool '${toolName}'.`,
        mitigation_advice: "Confirm the scope of the operation (e.g., ID filtering) before execution to prevent unintended data loss.",
      });
    }

    if (this.history.length > 5 && this.toolCall.input['user_id']) {
        effects.push({
            effect: "High volume of history combined with specific user targeting.",
            mitigation_advice: "Ensure rate limiting or batch processing is applied to prevent system overload.",
        });
    }

    return effects;
  }

  private calculateConfidenceScore(): number {
    let score = 0.7; // Base score
    if (this.history.length > 0) {
      score += 0.1;
    }
    if (this.toolCall.input && Object.keys(this.toolCall.input).length > 0) {
      score += 0.15;
    }
    return Math.min(1.0, score);
  }

  private isInputPresent(message: Message, key: string, expectedValue: unknown): boolean {
    if (message.role === "tool") {
      const toolMsg = message as ToolResultMessage;
      if (key === "tool_use_id" && toolMsg.tool_use_id === String(expectedValue)) return true;
    }
    if (message.role === "user") {
        const userMsg = message as UserMessage;
        if (typeof expectedValue === 'string' && userMsg.content.includes(String(expectedValue))) return true;
    }
    return false;
  }

  public enrichContext(): AdvancedContextEnrichment {
    const prerequisites = this.analyzePrerequisites();
    const sideEffects = this.analyzeSideEffects();
    const confidence = this.calculateConfidenceScore();

    return {
      prerequisites: prerequisites,
      potential_side_effects: sideEffects,
      context_confidence_score: confidence,
    };
  }
}
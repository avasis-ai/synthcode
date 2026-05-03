import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface Intent {
  goal: string;
  constraints: string[];
  expected_tools: string[];
}

export interface Context {
  current_state: Record<string, unknown>;
  last_user_input: string;
}

export interface History {
  messages: Message[];
  tool_calls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
}

export interface DriftReport {
  score: number;
  isDrifting: boolean;
  reasons: string[];
}

export class IntentDriftDetector {
  private readonly driftThreshold: number;

  constructor(driftThreshold: number = 0.6) {
    this.driftThreshold = driftThreshold;
  }

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    // Placeholder for actual semantic similarity calculation (e.g., using embeddings)
    // For this implementation, we use a simple length-based proxy.
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) return 1.0;
    return Math.min(1.0, Math.abs(text1.length - text2.length) / maxLength * 0.5 + 0.5);
  }

  private checkConstraintViolations(history: History, initialIntent: Intent): string[] {
    const violations: string[] = [];

    // 1. Tool Usage Constraint Check
    const usedTools = new Set(history.tool_calls.map(tc => tc.name));
    for (const expectedTool of initialIntent.expected_tools) {
      if (!usedTools.has(expectedTool)) {
        // This is a weak check, as the agent might need to discover tools.
        // We flag if the history is long and expected tools are ignored.
        if (history.messages.length > 3 && !usedTools.has(expectedTool)) {
          violations.push(`Potential missing tool usage: Expected tool '${expectedTool}' has not been called.`);
        }
      }
    }

    // 2. Goal Relevance Check (based on last user input vs. goal)
    const lastInput = history.messages.length > 0 ? (history.messages[history.messages.length - 1] as UserMessage).content : "";
    if (lastInput && initialIntent.goal) {
      const similarity = this.calculateSemanticSimilarity(lastInput, initialIntent.goal);
      if (similarity < 0.5) {
        violations.push(`Low relevance score (${similarity.toFixed(2)}) between last input and stated goal.`);
      }
    }

    return violations;
  }

  private calculateContextDeviation(currentContext: Context, initialIntent: Intent): number {
    // Placeholder: Measures how much the current state deviates from what the intent implies.
    // A simple heuristic: if the context state contains keys not mentioned in the goal, it drifts.
    let deviationScore = 0;
    const goalKeywords = new Set(initialIntent.goal.toLowerCase().match(/\w+/g) || []);
    const contextKeys = Object.keys(currentContext.current_state);

    for (const key of contextKeys) {
      if (!goalKeywords.has(key.toLowerCase()) && key.toLowerCase() !== "user_id") {
        deviationScore += 0.1;
      }
    }
    return Math.min(1.0, deviationScore);
  }

  detectDrift(
    currentContext: Context,
    initialIntent: Intent,
    history: History
  ): DriftReport {
    const constraintViolations = this.checkConstraintViolations(history, initialIntent);
    const contextDeviationScore = this.calculateContextDeviation(currentContext, initialIntent);

    // Simple weighted scoring mechanism:
    // 1. Context deviation is weighted heavily.
    // 2. Constraint violations add a fixed penalty.
    let totalScore = contextDeviationScore * 0.5;
    totalScore += constraintViolations.length * 0.2;

    // Normalize score to [0, 1] range (though the weights might push it slightly over, we clamp it)
    const finalScore = Math.min(1.0, Math.max(0.0, totalScore));

    const isDrifting = finalScore > this.driftThreshold;

    return {
      score: finalScore,
      isDrifting: isDrifting,
      reasons: [...constraintViolations, `Context Deviation Score: ${contextDeviationScore.toFixed(2)}`],
    };
  }
}
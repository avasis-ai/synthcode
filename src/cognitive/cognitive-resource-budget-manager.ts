import { EventEmitter } from "node:events";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export interface CognitiveBudget {
  maxSteps: number;
  maxDepth: number;
  maxComplexityScore: number;
}

export interface CognitiveMetrics {
  stepCount: number;
  reasoningDepth: number;
  complexityScore: number;
}

export class CognitiveResourceBudgetManager extends EventEmitter {
  private budget: CognitiveBudget;
  private metrics: CognitiveMetrics;

  constructor(budget: CognitiveBudget) {
    super();
    this.budget = budget;
    this.metrics = {
      stepCount: 0,
      reasoningDepth: 0,
      complexityScore: 0,
    };
  }

  get currentMetrics(): CognitiveMetrics {
    return { ...this.metrics };
  }

  /**
   * Checks if the current metrics exceed the defined budget limits.
   * @returns boolean indicating if the budget is exceeded.
   */
  isBudgetExceeded(): boolean {
    return (
      this.metrics.stepCount > this.budget.maxSteps ||
      this.metrics.reasoningDepth > this.budget.maxDepth ||
      this.metrics.complexityScore > this.budget.maxComplexityScore
    );
  }

  /**
   * Updates the internal metrics based on the execution step.
   * This method should be called at the start of every significant step.
   * @param stepIncrease The increase in step count (usually 1).
   * @param depthIncrease The increase in reasoning depth (usually 1).
   * @param complexityIncrease The accumulated complexity score increase.
   */
  updateMetrics(
    stepIncrease: number = 1,
    depthIncrease: number = 0,
    complexityIncrease: number = 0
  ): void {
    this.metrics.stepCount += stepIncrease;
    this.metrics.reasoningDepth += depthIncrease;
    this.metrics.complexityScore += complexityIncrease;
  }

  /**
   * Processes a content block to estimate and update complexity score.
   * This simulates the cost of generating or processing specific content types.
   * @param block The content block to analyze.
   * @param complexityWeight A multiplier for the block type.
   */
  processContentBlock(block: ContentBlock, complexityWeight: number = 1): void {
    let scoreIncrease = 0;

    if (block.type === "thinking") {
      scoreIncrease = 0.5 * complexityWeight;
    } else if (block.type === "tool_use") {
      scoreIncrease = 1.5 * complexityWeight;
    } else if (block.type === "text") {
      scoreIncrease = 0.1 * complexityWeight;
    }

    this.updateMetrics(0, 0, scoreIncrease);
  }

  /**
   * Validates the transition before proceeding to the next step.
   * @returns true if the budget allows continuation, false otherwise.
   */
  validateStep(): boolean {
    if (this.isBudgetExceeded()) {
      this.emit("budget_exceeded", {
        metrics: this.currentMetrics,
        budget: this.budget,
      });
      return false;
    }
    return true;
  }
}
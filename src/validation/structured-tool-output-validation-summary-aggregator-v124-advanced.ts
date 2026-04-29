import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export enum ConflictWeight {
  CRITICAL = 10,
  ERROR = 5,
  WARNING = 2,
  INFO = 1,
}

export interface ValidationFailure {
  severity: ConflictWeight;
  source: string;
  message: string;
}

export interface SeverityWeightedSummary {
  totalWeightedScore: number;
  breakdown: Record<ConflictWeight, number>;
  failureCount: number;
}

export class StructuredToolOutputValidationSummaryAggregator {
  private failures: ValidationFailure[] = [];

  private addFailure(failure: ValidationFailure): void {
    this.failures.push(failure);
  }

  public addFailure(failure: ValidationFailure): void {
    this.addFailure(failure);
  }

  private calculateSummary(): SeverityWeightedSummary {
    const breakdown: Record<ConflictWeight, number> = {
      [ConflictWeight.CRITICAL]: 0,
      [ConflictWeight.ERROR]: 0,
      [ConflictWeight.WARNING]: 0,
      [ConflictWeight.INFO]: 0,
    };
    let totalWeightedScore = 0;
    let failureCount = 0;

    for (const failure of this.failures) {
      const weight = failure.severity;
      totalWeightedScore += weight;
      breakdown[weight] = (breakdown[weight] || 0) + 1;
      failureCount++;
    }

    return {
      totalWeightedScore,
      breakdown,
      failureCount,
    };
  }

  public aggregate(messages: Message[]): SeverityWeightedSummary {
    this.failures = [];
    for (const message of messages) {
      if (message.role === "tool" && message.tool_use_id) {
        if (message.is_error) {
          this.addFailure({
            severity: ConflictWeight.CRITICAL,
            source: `ToolResult:${message.tool_use_id}`,
            message: `Tool execution failed: ${message.content}`,
          });
        } else if (message.content.includes("INVALID_SCHEMA")) {
          this.addFailure({
            severity: ConflictWeight.ERROR,
            source: `ToolResult:${message.tool_use_id}`,
            message: "Content validation failed due to invalid schema structure.",
          });
        } else if (message.content.includes("WARNING:")) {
          this.addFailure({
            severity: ConflictWeight.WARNING,
            source: `ToolResult:${message.tool_use_id}`,
            message: "Tool output contained non-critical warnings.",
          });
        } else {
          this.addFailure({
            severity: ConflictWeight.INFO,
            source: `ToolResult:${message.tool_use_id}`,
            message: "Tool output processed successfully.",
          });
        }
      }
    }

    return this.calculateSummary();
  }

  public reset(): void {
    this.failures = [];
  }
}
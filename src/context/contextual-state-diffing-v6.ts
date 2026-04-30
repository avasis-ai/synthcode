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

export type ContextualDiffType =
  | "StructuralChange"
  | "TemporalShift"
  | "ResourceConstraintViolation"
  | "SemanticDrift"
  | "NoChange";

export interface ContextualMetadata {
  timeWindowMs?: number;
  resourceUsageDelta?: {
    cpuUsage: number;
    memoryUsageBytes: number;
  };
  eventSource: string;
}

export interface ContextualStateDiff {
  diffType: ContextualDiffType;
  structuralDiff: Record<string, any>;
  semanticSummary: string;
  metadata: ContextualMetadata;
}

export class ContextualStateDiffingService {
  private readonly initialContext: Message[];

  constructor(initialContext: Message[]) {
    this.initialContext = initialContext;
  }

  private calculateStructuralDiff(previous: Message[], current: Message[]): Record<string, any> {
    const diff: Record<string, any> = {};
    if (previous.length !== current.length) {
      diff.lengthChange = {
        previousLength: previous.length,
        currentLength: current.length,
      };
    }

    for (let i = 0; i < Math.min(previous.length, current.length); i++) {
      const prev = previous[i];
      const curr = current[i];

      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        diff[`item_${i}`] = {
          previous: prev,
          current: curr,
          changed: true,
        };
      }
    }
    return diff;
  }

  private analyzeSemanticChange(previous: Message[], current: Message[]): string {
    const lastPrev = previous[previous.length - 1];
    const lastCurr = current[current.length - 1];

    if (!lastPrev || !lastCurr) {
      return "Context length mismatch or empty context.";
    }

    if (lastPrev.role === "user" && lastCurr.role === "assistant") {
      return "User input followed by a direct assistant response.";
    }
    if (lastPrev.role === "assistant" && lastCurr.role === "tool") {
      return "Assistant output followed by a tool result.";
    }
    return "General context progression detected.";
  }

  private analyzeMetadataContext(metadata: ContextualMetadata): ContextualDiffType {
    if (metadata.resourceUsageDelta && metadata.resourceUsageDelta.cpuUsage > 0.8) {
      return "ResourceConstraintViolation";
    }
    if (metadata.timeWindowMs && metadata.timeWindowMs > 3600000) {
      return "TemporalShift";
    }
    return "StructuralChange";
  }

  public computeDiff(
    previousState: Message[],
    currentState: Message[],
    metadata: ContextualMetadata = {}
  ): ContextualStateDiff {
    const structuralDiff = this.calculateStructuralDiff(previousState, currentState);
    const semanticSummary = this.analyzeSemanticChange(previousState, currentState);
    const diffType = this.analyzeMetadataContext(metadata);

    return {
      diffType: diffType,
      structuralDiff: structuralDiff,
      semanticSummary: semanticSummary,
      metadata: metadata,
    };
  }
}
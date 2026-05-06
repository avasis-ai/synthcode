import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Issue = {
  severity: "error" | "warning";
  message: string;
  context: string;
};

export interface ReadinessReport {
  isReady: boolean;
  issues: Issue[];
}

export class ContextualReadinessValidator {
  private readonly requiredToolInputs: Record<string, string[]>;

  constructor(requiredToolInputs: Record<string, string[]>) {
    this.requiredToolInputs = requiredToolInputs;
  }

  private extractToolInputs(toolCalls: { name: string; input: Record<string, unknown> }[]): Record<string, Record<string, unknown>> {
    return toolCalls.reduce((acc, call) => {
      acc[call.name] = call.input;
      return acc;
    }, {} as Record<string, Record<string, unknown>>);
  }

  private checkRequiredInputs(
    toolCalls: { name: string; input: Record<string, unknown> }[],
    contextHistory: Message[]
  ): Issue[] {
    const issues: Issue[] = [];
    const toolInputs = this.extractToolInputs(toolCalls);

    for (const toolName in this.requiredToolInputs) {
      const requiredFields = this.requiredToolInputs[toolName];
      const toolInput = toolInputs[toolName];

      if (!toolInput) {
        issues.push({
          severity: "error",
          message: `Tool '${toolName}' is required but no inputs were provided.`,
          context: `Tool: ${toolName}`,
        });
        continue;
      }

      for (const field of requiredFields) {
        const value = toolInput[field as keyof typeof toolInput];
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === "")) {
          issues.push({
            severity: "error",
            message: `Tool '${toolName}' requires the field '${field}' which is missing or empty.`,
            context: `Tool: ${toolName}`,
          });
        }
      }
    }
    return issues;
  }

  private checkSemanticCompleteness(
    contextHistory: Message[],
    userMessage: UserMessage,
    toolCalls: { name: string; input: Record<string, unknown> }[]
  ): Issue[] {
    const issues: Issue[] = [];
    const combinedContext = [
      ...contextHistory,
      { role: "user", content: userMessage.content },
    ];

    // Simple semantic check: Check if the user message contradicts the last tool result.
    const lastToolResult = contextHistory.filter(
      (msg) => msg.role === "tool"
    ).pop() as ToolResultMessage | undefined;

    if (lastToolResult && userMessage.content.toLowerCase().includes("ignore") && lastToolResult.content.toLowerCase().includes("success")) {
      issues.push({
        severity: "warning",
        message: "User intent appears to contradict the successful outcome of the last tool execution. Review context.",
        context: `User Message: ${userMessage.content}`,
      });
    }

    // More complex checks would involve NLP/LLM calls, but for structural validation, we keep it simple.
    return issues;
  }

  public validate(
    contextHistory: Message[],
    userMessage: UserMessage,
    toolCalls: { name: string; input: Record<string, unknown> }[]
  ): ReadinessReport {
    const issues: Issue[] = [];

    // 1. Check required tool inputs
    const inputIssues = this.checkRequiredInputs(toolCalls, contextHistory);
    issues.push(...inputIssues);

    // 2. Check semantic completeness and contradictions
    const semanticIssues = this.checkSemanticCompleteness(
      contextHistory,
      userMessage,
      toolCalls
    );
    issues.push(...semanticIssues);

    const isReady = issues.every((issue) => issue.severity !== "error");

    return {
      isReady,
      issues,
    };
  }
}
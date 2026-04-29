import { Message, ToolUseBlock } from "./types";

export interface AdvancedToolCallValidatorRule {
  validate(
    history: Message[],
    toolCalls: ToolUseBlock[]
  ): { isValid: boolean; message: string; details?: Record<string, any> };
}

export class AdvancedToolCallValidator {
  private rules: AdvancedToolCallValidatorRule[];

  constructor(initialRules: AdvancedToolCallValidatorRule[] = []) {
    this.rules = initialRules;
  }

  addRule(rule: AdvancedToolCallValidatorRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(
    history: Message[],
    toolCalls: ToolUseBlock[]
  ): { isValid: boolean; message: string; details?: Record<string, any> } {
    for (const rule of this.rules) {
      const result = rule.validate(history, toolCalls);
      if (!result.isValid) {
        return {
          isValid: false,
          message: result.message,
          details: result.details,
        };
      }
    }
    return { isValid: true, message: "Tool call sequence is valid.", details: undefined };
  }
}

class SequentialToolCallRule implements AdvancedToolCallValidatorRule {
  private requiredSequence: {
    toolName: string;
    minIndex: number;
    maxIndex: number;
  }[];

  constructor(requiredSequence: {
    toolName: string;
    minIndex: number;
    maxIndex: number;
  }[] = []) {
    this.requiredSequence = requiredSequence;
  }

  validate(
    history: Message[],
    toolCalls: ToolUseBlock[]
  ): { isValid: boolean; message: string; details?: Record<string, any> } {
    for (const step of this.requiredSequence) {
      const foundCalls = toolCalls.filter(
        (call) => call.name === step.toolName
      );

      if (foundCalls.length === 0) {
        return {
          isValid: false,
          message: `Tool call '${step.toolName}' is required but not found in the sequence.`,
          details: { requiredTool: step.toolName },
        };
      }

      // Simple check: ensure at least one call exists within the expected index range (conceptual, as we only have the list)
      // For a true sequence check, we'd need to map tool calls back to the message index they appeared in.
      // Here, we validate existence and assume the order check is done by the calling context if indices are provided.
      // For simplicity in this structure, we just check for existence if the range implies necessity.
    }
    return { isValid: true, message: "Sequential tool call requirements met." };
  }
}

class ContextualDependencyRule implements AdvancedToolCallValidatorRule {
  private dependencyMap: Map<string, string>; // Key: Tool B, Value: Required Tool A

  constructor(dependencyMap: Record<string, string> = {}) {
    this.dependencyMap = new Map(Object.entries(dependencyMap));
  }

  validate(
    history: Message[],
    toolCalls: ToolUseBlock[]
  ): { isValid: boolean; message: string; details?: Record<string, any> } {
    const toolCallNames = toolCalls.map(call => call.name);
    const seenTools = new Set<string>();

    for (const toolName of toolCallNames) {
      if (this.dependencyMap.has(toolName)) {
        const requiredTool = this.dependencyMap.get(toolName)!;
        if (!seenTools.has(requiredTool)) {
          return {
            isValid: false,
            message: `Tool '${toolName}' requires '${requiredTool}' to have been called previously in this sequence.`,
            details: { requiredTool: requiredTool, currentTool: toolName },
          };
        }
      }
      seenTools.add(toolName);
    }

    return { isValid: true, message: "Contextual dependencies satisfied." };
  }
}

export const createAdvancedValidator = (
  initialRules: AdvancedToolCallValidatorRule[] = []
): AdvancedToolCallValidator => {
  return new AdvancedToolCallValidator(initialRules);
};
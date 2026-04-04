import { Message, ToolUseBlock } from "./types";

export type SequenceRule = {
  ruleType: "must_run_after" | "must_run_before";
  sourceToolName: string;
  targetToolName: string;
};

export class ToolCallSequenceValidator {
  private rules: SequenceRule[];

  constructor(rules: SequenceRule[] = []) {
    this.rules = rules;
  }

  public validate(plan: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const toolCallSequence: { name: string; index: number }[] = [];
    const toolCallMap = new Map<string, number>();

    // 1. Extract and map all tool calls in order
    plan.forEach((message, index) => {
      if (message.role === "assistant" && message.content.some(block => block.type === "tool_use")) {
        const toolUseBlock = (message.content.find(block => block.type === "tool_use") as ToolUseBlock);
        if (toolUseBlock) {
          const toolName = toolUseBlock.name;
          toolCallSequence.push({ name: toolName, index });
          toolCallMap.set(toolName, index);
        }
      }
    });

    // 2. Check rules against the extracted sequence
    for (const rule of this.rules) {
      const { ruleType, sourceToolName, targetToolName } = rule;

      if (ruleType === "must_run_after") {
        // Source must run before Target
        const sourceIndex = toolCallMap.get(sourceToolName);
        const targetIndex = toolCallMap.get(targetToolName);

        if (sourceIndex !== undefined && targetIndex !== undefined) {
          if (sourceIndex >= targetIndex) {
            errors.push(
              `Sequence Error: Tool '${sourceToolName}' must run before '${targetToolName}', but they appear in the wrong order (Source Index: ${sourceIndex}, Target Index: ${targetIndex}).`
            );
          }
        } else if (sourceIndex === undefined && targetIndex !== undefined) {
             errors.push(`Warning: Rule requires '${sourceToolName}' to run before '${targetToolName}', but '${sourceToolName}' was never called.`);
        }
      } else if (ruleType === "must_run_before") {
        // Source must run after Target
        const sourceIndex = toolCallMap.get(sourceToolName);
        const targetIndex = toolCallMap.get(targetToolName);

        if (sourceIndex !== undefined && targetIndex !== undefined) {
          if (sourceIndex <= targetIndex) {
            errors.push(
              `Sequence Error: Tool '${sourceToolName}' must run after '${targetToolName}', but they appear in the wrong order (Source Index: ${sourceIndex}, Target Index: ${targetIndex}).`
            );
          }
        } else if (sourceIndex === undefined && targetIndex !== undefined) {
             errors.push(`Warning: Rule requires '${sourceToolName}' to run after '${targetToolName}', but '${sourceToolName}' was never called.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}
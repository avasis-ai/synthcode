import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type StructuralRule = {
  dependency: "references";
  sourceStepIndex: number;
  targetStepIndex: number;
  requiredContentKey: string;
};

export interface StructuredValidatorOptions {
  rules: StructuralRule[];
}

export class StructuredThoughtStepValidator {
  private options: StructuredValidatorOptions;

  constructor(options: StructuredValidatorOptions) {
    this.options = options;
  }

  private extractStepContent(step: Message): Record<string, any> {
    let content: Record<string, any> = {
      text: "",
      thinking: "",
      tool_uses: []
    };

    if (step.role === "assistant" && Array.isArray((step as any).content)) {
      const contentBlocks = (step as any).content;
      let textContent = "";
      let thinkingContent = "";
      const toolUses: ToolUseBlock[] = [];

      for (const block of contentBlocks) {
        if (typeof block === 'object' && 'type' in block) {
          switch (block.type) {
            case "text":
              textContent += (block as TextBlock).text;
              break;
            case "thinking":
              thinkingContent += (block as ThinkingBlock).thinking;
              break;
            case "tool_use":
              toolUses.push(block as ToolUseBlock);
              break;
          }
        }
      }
      content.text = textContent;
      content.thinking = thinkingContent;
      content.tool_uses = toolUses;
    } else if (step.role === "tool") {
      content.text = (step as any).content;
    }
    return content;
  }

  public validate(thoughtSteps: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const stepContents: Record<number, Record<string, any>> = [];

    for (let i = 0; i < thoughtSteps.length; i++) {
      stepContents[i] = this.extractStepContent(thoughtSteps[i]);
    }

    for (const rule of this.options.rules) {
      const { sourceStepIndex, targetStepIndex, requiredContentKey } = rule;

      if (sourceStepIndex < 0 || sourceStepIndex >= thoughtSteps.length ||
          targetStepIndex < 0 || targetStepIndex >= thoughtSteps.length) {
        errors.push(`Rule validation failed: Indices out of bounds for step sequence.`);
        continue;
      }

      const sourceContent = stepContents[sourceStepIndex];
      const targetContent = stepContents[targetStepIndex];

      if (!sourceContent || !targetContent) {
        errors.push(`Rule validation failed: Could not extract content for required steps.`);
        continue;
      }

      const sourceValue = sourceContent[requiredContentKey];
      const targetValue = targetContent[requiredContentKey];

      if (sourceValue === undefined || targetValue === undefined) {
        errors.push(`Structural rule violation: Step ${targetStepIndex} requires content key '${requiredContentKey}' which was not found in the source step ${sourceStepIndex}.`);
        continue;
      }

      if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
        if (!targetValue.includes(sourceValue)) {
          errors.push(`Structural rule violation: Step ${targetStepIndex} must reference content from Step ${sourceStepIndex} using key '${requiredContentKey}'. Found: "${targetValue}" does not contain: "${sourceValue}"`);
        }
      } else if (typeof sourceValue === 'object' && sourceValue !== null && typeof targetValue === 'object' && targetValue !== null) {
        // Simple object reference check (e.g., checking if an ID exists)
        if (requiredContentKey === 'tool_uses' && Array.isArray(sourceValue) && Array.isArray(targetValue)) {
            const sourceIds = sourceValue.map((t: ToolUseBlock) => t.id);
            const targetIds = targetValue.map((t: ToolUseBlock) => t.id);
            const missing = targetIds.filter(id => !sourceIds.includes(id));
            if (missing.length > 0) {
                errors.push(`Structural rule violation: Step ${targetStepIndex} tool uses must reference IDs from Step ${sourceStepIndex}. Missing IDs: ${missing.join(', ')}`);
            }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}
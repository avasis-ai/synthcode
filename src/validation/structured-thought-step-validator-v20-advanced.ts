import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface DependencyRule {
  sourceStepIndex: number;
  requiredTargetStepIndex: number;
  dependencyKey: string;
}

export class StructuredThoughtStepValidatorV20Advanced {
  private dependencyRules: DependencyRule[] = [];
  private readonly maxSteps: number;

  constructor(maxSteps: number = 10) {
    this.maxSteps = maxSteps;
  }

  addDependencyRule(rule: DependencyRule): this {
    if (rule.sourceStepIndex < 0 || rule.requiredTargetStepIndex < 0) {
      throw new Error("Step indices must be non-negative.");
    }
    this.dependencyRules.push(rule);
    return this;
  }

  private getStepContent(steps: Message[], index: number): {
    content: string;
    references: Record<string, string>;
  } {
    const step = steps[index];
    let content = "";
    const references: Record<string, string> = {};

    if (step.role === "assistant") {
      const blocks = step.content as ContentBlock[];
      for (const block of blocks) {
        if (block.type === "text") {
          content += (block as TextBlock).text;
        } else if (block.type === "thinking") {
          content += `[Thinking: ${block as ThinkingBlock}].`;
        }
      }
    } else if (step.role === "tool") {
      content = `Tool result for ${step.tool_use_id}: ${step.content}`;
    } else {
      content = step.content;
    }

    // Simplified reference extraction for demonstration
    if (step.role === "assistant") {
      const thinkingBlock = (step.content as ContentBlock[]).find(
        (block) => (block as ThinkingBlock).type === "thinking"
      );
      if (thinkingBlock) {
        references["thinking_output"] = thinkingBlock.thinking;
      }
    }

    return { content, references };
  }

  public validate(steps: Message[]): ValidationResult {
    if (!steps || steps.length === 0) {
      return { isValid: false, errors: ["Input steps sequence cannot be empty."] };
    }

    const errors: string[] = [];
    const stepContents: {
      content: string;
      references: Record<string, string>;
    }[] = [];

    for (let i = 0; i < Math.min(steps.length, this.maxSteps); i++) {
      stepContents.push(this.getStepContent(steps, i));
    }

    // 1. Cross-Step Dependency Validation
    for (const rule of this.dependencyRules) {
      const sourceStep = stepContents[rule.sourceStepIndex];
      const targetStep = stepContents[rule.requiredTargetStepIndex];

      if (!sourceStep || !targetStep) {
        errors.push(`Dependency rule failed: One or both steps (${rule.sourceStepIndex} -> ${rule.requiredTargetStepIndex}) are out of bounds.`);
        continue;
      }

      // Check if the source step actually contains the required dependency key
      if (!(rule.dependencyKey in sourceStep.references)) {
        errors.push(
          `Dependency failure at Step ${rule.sourceStepIndex}: Missing required key '${rule.dependencyKey}' for dependency check.`
        );
        continue;
      }

      // Check if the target step's content validates against the source's reference
      const requiredValue = sourceStep.references[rule.dependencyKey];
      // Simplified check: just ensuring the target step has *some* content
      if (!targetStep.content.includes("validation_success")) {
        errors.push(
          `Dependency failure: Step ${rule.sourceStepIndex} depends on Step ${rule.requiredTargetStepIndex} via key '${rule.dependencyKey}', but Step ${rule.requiredTargetStepIndex} content does not confirm success.`
        );
      }
    }

    // 2. Intra-Step Consistency Check (Example: Thinking block must precede Tool Use)
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];

      if (currentStep.role === "assistant" && nextStep.role === "tool") {
        const contentBlocks = (currentStep.content as ContentBlock[]);
        const hasThinking = contentBlocks.some(
          (block) => (block as ThinkingBlock).type === "thinking"
        );
        if (!hasThinking) {
          errors.push(
            `Consistency warning: Tool use in Step ${i+1} should ideally follow a thinking block in Step ${i}.`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}
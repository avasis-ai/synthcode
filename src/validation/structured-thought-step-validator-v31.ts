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

export interface StepValidationRule {
  stepType: "reasoning" | "observation" | "action";
  requiredPrecedingStepType: "observation" | "action" | "any";
  dependencyKey: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: {
    stepIndex: number;
    stepType: string;
    message: string;
    details?: Record<string, string>;
  }[];
}

export class StructuredThoughtStepValidatorV31 {
  private rules: StepValidationRule[];

  constructor(rules: StepValidationRule[]) {
    this.rules = rules;
  }

  private getStepTypeFromMessage(message: Message): "reasoning" | "observation" | "action" | null {
    if (message.role === "assistant") {
      // Simplified logic: Assume thinking blocks map to reasoning, and tool results map to observation/action context
      const contentBlocks = message.content;
      if (contentBlocks.some(block => block.type === "thinking")) {
        return "reasoning";
      }
      if (message.role === "tool") {
        return "observation";
      }
    }
    return null;
  }

  private validateStep(
    stepIndex: number,
    message: Message,
    context: {
      observedIds: Set<string>;
      actionIds: Set<string>;
    },
  ): {
    isValid: boolean;
    errors: {
      stepIndex: number;
      stepType: string;
      message: string;
      details?: Record<string, string>;
    }[];
  } {
    const stepType = this.getStepTypeFromMessage(message);
    const errors: {
      stepIndex: number;
      stepType: string;
      message: string;
      details?: Record<string, string>;
    }[] = [];

    if (!stepType) {
      return { isValid: false, errors: [{ stepIndex, stepType: "unknown", message: "Could not determine structured step type from message content." }] };
    }

    const relevantRules = this.rules.filter(rule => rule.stepType === stepType);

    for (const rule of relevantRules) {
      // 1. Check Preceding Step Dependency
      if (rule.requiredPrecedingStepType !== "any") {
        let requiredContext: "observation" | "action" | null = null;
        if (rule.requiredPrecedingStepType === "observation") {
          requiredContext = "observation";
        } else if (rule.requiredPrecedingStepType === "action") {
          requiredContext = "action";
        }

        if (requiredContext && !context.observedIds.has(rule.dependencyKey) && !context.actionIds.has(rule.dependencyKey)) {
          errors.push({
            stepIndex,
            stepType: stepType,
            message: `Step requires a preceding ${requiredContext} with ID '${rule.dependencyKey}', but none was found in context.`,
          });
        }
      }

      // 2. Check for specific content requirements (Placeholder for complex content validation)
      if (stepType === "reasoning" && rule.dependencyKey && !message.content) {
        errors.push({
          stepIndex,
          stepType: stepType,
          message: `Reasoning step must reference a preceding step ID using dependency key '${rule.dependencyKey}'.`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  public validateSequence(
    sequence: Message[],
  ): ValidationReport {
    const errors: {
      stepIndex: number;
      stepType: string;
      message: string;
      details?: Record<string, string>;
    }[] = [];
    const context: {
      observedIds: Set<string>;
      actionIds: Set<string>;
    } = {
      observedIds: new Set<string>(),
      actionIds: new Set<string>(),
    };

    for (let i = 0; i < sequence.length; i++) {
      const message = sequence[i];
      const result = this.validateStep(i, message, context);
      errors.push(...result.errors);

      // Update context based on the current step (Post-validation context update)
      const stepType = this.getStepTypeFromMessage(message);
      if (stepType === "observation") {
        // Simulate finding an observation ID
        context.observedIds.add(`obs_${i}_${Math.random().toString(36).substring(2, 9)}`);
      } else if (stepType === "action") {
        // Simulate finding an action ID
        context.actionIds.add(`act_${i}_${Math.random().toString(36).substring(2, 9)}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}
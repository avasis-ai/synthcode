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

interface ValidationContext {
  globalState: Record<string, any>;
  resourceMetrics: Record<string, number>;
  previousSteps: Message[];
}

interface Validator {
  validate(
    step: Message,
    context: ValidationContext
  ): { isValid: boolean; errors: string[]; enrichedContext: ValidationContext };
}

class StructuredThoughtStepValidatorV29AdvancedAdvanced implements Validator {
  validate(
    step: Message,
    context: ValidationContext
  ): { isValid: boolean; errors: string[]; enrichedContext: ValidationContext } {
    let errors: string[] = [];
    let enrichedContext: ValidationContext = {
      ...context,
      globalState: { ...context.globalState, ...this.enrichGlobalState(context) },
      resourceMetrics: { ...context.resourceMetrics, ...this.enrichResourceMetrics(context) },
    };

    if (step.role === "user") {
      const userStep = step as UserMessage;
      const validationResult = this.validateUserMessage(userStep, context);
      errors = [...errors, ...validationResult.errors];
      enrichedContext = {
        ...enrichedContext,
        previousSteps: [...context.previousSteps, step],
      };
    } else if (step.role === "assistant") {
      const assistantStep = step as AssistantMessage;
      const validationResult = this.validateAssistantMessage(assistantStep, context);
      errors = [...errors, ...validationResult.errors];
      enrichedContext = {
        ...enrichedContext,
        previousSteps: [...context.previousSteps, step],
      };
    } else if (step.role === "tool") {
      const toolStep = step as ToolResultMessage;
      const validationResult = this.validateToolResultMessage(toolStep, context);
      errors = [...errors, ...validationResult.errors];
      enrichedContext = {
        ...enrichedContext,
        previousSteps: [...context.previousSteps, step],
      };
    } else {
      errors.push("Unknown message role encountered.");
    }

    const overallIsValid = errors.length === 0;

    // Cross-step dependency check
    const dependencyCheck = this.validateCrossStepDependencies(step, context);
    if (dependencyCheck.length > 0) {
      errors = [...errors, ...dependencyCheck];
    }

    return {
      isValid: overallIsValid && dependencyCheck.length === 0,
      errors: errors,
      enrichedContext: enrichedContext,
    };
  }

  private validateUserMessage(
    step: UserMessage,
    context: ValidationContext
  ): { errors: string[]; enrichedContext: ValidationContext } {
    let errors: string[] = [];
    if (!step.content || typeof step.content !== "string" || step.content.trim().length === 0) {
      errors.push("User message content cannot be empty.");
    }
    return { errors, enrichedContext: context };
  }

  private validateAssistantMessage(
    step: AssistantMessage,
    context: ValidationContext
  ): { errors: string[]; enrichedContext: ValidationContext } {
    let errors: string[] = [];
    let hasContent = false;
    for (const block of step.content) {
      if (block.type === "text" && typeof block.text !== "string") {
        errors.push("Text block requires a string content.");
      } else if (block.type === "tool_use" && !block.id) {
        errors.push("ToolUseBlock requires an ID.");
      }
      hasContent = true;
    }
    if (!hasContent) {
      errors.push("Assistant message must contain at least one content block.");
    }
    return { errors, enrichedContext: context };
  }

  private validateToolResultMessage(
    step: ToolResultMessage,
    context: ValidationContext
  ): { errors: string[]; enrichedContext: ValidationContext } {
    let errors: string[] = [];
    if (!step.tool_use_id) {
      errors.push("ToolResultMessage requires a tool_use_id.");
    }
    if (step.is_error && typeof step.content !== "string") {
      errors.push("Error tool result content must be a string.");
    }
    return { errors, enrichedContext: context };
  }

  private enrichGlobalState(context: ValidationContext): Record<string, any> {
    const state: Record<string, any> = { ...context.globalState };
    if (context.previousSteps.length > 0) {
      state["last_user_intent"] = (context.previousSteps[context.previousSteps.length - 1] as UserMessage).content.substring(0, 50);
    }
    return state;
  }

  private enrichResourceMetrics(context: ValidationContext): Record<string, number> {
    const metrics: Record<string, number> = { ...context.resourceMetrics };
    metrics["step_count"] = context.previousSteps.length + 1;
    return metrics;
  }

  private validateCrossStepDependencies(
    step: Message,
    context: ValidationContext
  ): string[] {
    let errors: string[] = [];
    if (step.role === "assistant") {
      const assistantStep = step as AssistantMessage;
      const toolUses = (assistantStep.content as ContentBlock[]).filter(
        (block): block is ToolUseBlock => block.type === "tool_use"
      );

      if (toolUses.length > 0) {
        const requiredToolIds = toolUses.map(block => block.id);
        const availableToolIds = context.globalState["available_tools"] as string[] || [];

        for (const toolId of requiredToolIds) {
          if (!availableToolIds.includes(toolId)) {
            errors.push(`Cross-step dependency failure: Tool ID ${toolId} used in assistant step is not globally available.`);
          }
        }
      }
    }
    return errors;
  }
}

export const structuredThoughtStepValidatorV29AdvancedAdvanced = new StructuredThoughtStepValidatorV29AdvancedAdvanced();
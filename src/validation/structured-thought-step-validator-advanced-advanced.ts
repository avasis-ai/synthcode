import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ThoughtStepType = "query" | "reasoning" | "plan" | "reflection";

interface ThoughtStep {
  type: ThoughtStepType;
  content: any; // Simplified for this advanced validator context
}

type ValidatorFunction = (
  steps: ThoughtStep[],
  currentStep: ThoughtStep,
  context: Map<string, any>
) => { isValid: boolean; errors: string[] };

export class StructuredThoughtStepValidatorAdvancedAdvanced {
  private ruleRegistry: Map<ThoughtStepType, ValidatorFunction> = new Map();
  private readonly initialContext: Map<string, any> = new Map();

  constructor() {}

  registerRule(stepType: ThoughtStepType, validator: ValidatorFunction): this {
    this.ruleRegistry.set(stepType, validator);
    return this;
  }

  private buildContext(steps: ThoughtStep[]): Map<string, any> {
    const context = new Map<string, any>();
    // Simulate context building from initial steps (e.g., goals, initial query)
    context.set("initial_query_id", "q123");
    context.set("goal_ids", ["g1", "g2"]);
    return context;
  }

  private validateStep(
    steps: ThoughtStep[],
    currentIndex: number,
    currentStep: ThoughtStep,
    context: Map<string, any>
  ): { isValid: boolean; errors: string[]; newContext: Map<string, any> } {
    const validator = this.ruleRegistry.get(currentStep.type);

    if (!validator) {
      return { isValid: false, errors: [`No validator registered for step type: ${currentStep.type}`], newContext: context };
    }

    const { isValid: stepValid, errors: stepErrors } = validator(steps, currentStep, context);

    let newContext = new Map(context);

    if (currentStep.type === "plan") {
      // Example context update: store the plan's main action ID
      const planContent = currentStep.content as { action_id: string };
      if (planContent && planContent.action_id) {
        newContext.set("last_plan_action_id", planContent.action_id);
      }
    }

    return {
      isValid: stepValid,
      errors: [...stepErrors],
      newContext: newContext,
    };
  }

  validateSequence(steps: ThoughtStep[]): { isValid: boolean; errors: string[]; finalContext: Map<string, any> } {
    let context = this.buildContext(steps);
    let allErrors: string[] = [];
    let currentContext = context;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const validationResult = this.validateStep(steps, i, step, currentContext);

      if (!validationResult.isValid) {
        allErrors.push(...validationResult.errors);
      }
      
      // Update context for the next iteration regardless of current step's validity
      currentContext = validationResult.newContext;
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      finalContext: currentContext,
    };
  }
}

export const createValidator = (): StructuredThoughtStepValidatorAdvancedAdvanced => {
  const validator = new StructuredThoughtStepValidatorAdvancedAdvanced();

  // 1. Rule for 'query' step: Must contain a valid question structure.
  validator.registerRule("query", (steps, currentStep, context) => {
    const content = currentStep.content as string;
    if (!content.toLowerCase().includes("what") && !content.toLowerCase().includes("how")) {
      return { isValid: false, errors: ["Query step must start with 'What' or 'How' to define a clear question."], newContext: context };
    }
    return { isValid: true, errors: [], newContext: context };
  });

  // 2. Rule for 'reasoning' step: Must follow a 'query' step and reference context.
  validator.registerRule("reasoning", (steps, currentStep, context) => {
    if (steps.length === 0 || steps[steps.indexOf(currentStep) - 1].type !== "query") {
      return { isValid: false, errors: ["Reasoning step must immediately follow a 'query' step."], newContext: context };
    }
    if (!context.has("initial_query_id")) {
      return { isValid: false, errors: ["Cannot reason without an initial query context."], newContext: context };
    }
    return { isValid: true, errors: [], newContext: context };
  });

  // 3. Rule for 'plan' step: Must reference a valid goal ID from context.
  validator.registerRule("plan", (steps, currentStep, context) => {
    const planContent = currentStep.content as { references_goal_id: string };
    const validGoals = context.get("goal_ids") as string[] || [];

    if (!planContent || !planContent.references_goal_id) {
      return { isValid: false, errors: ["Plan step must explicitly reference a goal ID."], newContext: context };
    }

    if (!validGoals.includes(planContent.references_goal_id)) {
      return { isValid: false, errors: [`Plan references unknown goal ID: ${planContent.references_goal_id}. Valid goals: ${validGoals.join(', ')}`], newContext: context };
    }
    return { isValid: true, errors: [], newContext: context };
  });

  // 4. Rule for 'reflection' step: Optional, but should summarize previous steps.
  validator.registerRule("reflection", (steps, currentStep, context) => {
    if (steps.length < 2) {
      return { isValid: false, errors: ["Reflection requires at least one preceding step."], newContext: context };
    }
    // Simple check: ensure the reflection content is not empty
    if (!currentStep.content || typeof currentStep.content.toString() === 'string' && currentStep.content.length < 10) {
        return { isValid: false, errors: ["Reflection must provide substantial summary content."], newContext: context };
    }
    return { isValid: true, errors: [], newContext: context };
  });

  return validator;
};
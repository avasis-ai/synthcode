import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type ExecutionContext = {
  messages: Message[];
  contextData: Record<string, unknown>;
};

export type StepResult = {
  success: boolean;
  result: unknown;
  nextStepKey?: string;
};

export interface FlowStep {
  id: string;
  execute: (context: ExecutionContext) => Promise<{ result: unknown; contextUpdate: Partial<Record<string, unknown>>; success: boolean }>;
  condition?: (context: ExecutionContext, result: unknown) => boolean;
  onSuccess?: {
    condition: (context: ExecutionContext, result: unknown) => boolean;
    nextStepKey: string;
  };
  onFailure?: {
    condition: (context: ExecutionContext, result: unknown) => boolean;
    nextStepKey: string;
  };
  onConditionMet?: {
    condition: (context: ExecutionContext, result: unknown) => boolean;
    nextStepKey: string;
  };
}

export class FlowGuard {
  private steps: Map<string, FlowStep>;

  constructor(steps: FlowStep[]) {
    this.steps = new Map(steps.map(step => [step.id, step]));
  }

  private async executeStep(
    step: FlowStep,
    context: ExecutionContext
  ): Promise<StepResult> {
    const executionResult = await step.execute(context);

    let nextStepKey: string | undefined = undefined;
    let finalSuccess = executionResult.success;

    if (step.onSuccess) {
      if (step.onSuccess.condition(context, executionResult.result)) {
        nextStepKey = step.onSuccess.nextStepKey;
        finalSuccess = true;
      }
    }

    if (step.onFailure) {
      if (step.onFailure.condition(context, executionResult.result)) {
        nextStepKey = step.onFailure.nextStepKey;
        finalSuccess = false;
      }
    }

    if (step.onConditionMet) {
      if (step.onConditionMet.condition(context, executionResult.result)) {
        nextStepKey = step.onConditionMet.nextStepKey;
        finalSuccess = true;
      }
    }

    return {
      success: finalSuccess,
      result: executionResult.result,
      nextStepKey: nextStepKey,
    };
  }

  public async executeFlow(
    initialContext: ExecutionContext,
    startStepId: string
  ): Promise<{ finalContext: ExecutionContext; finalResult: unknown }> {
    let currentContext: ExecutionContext = {
      messages: [...initialContext.messages],
      contextData: { ...initialContext.contextData },
    };
    let currentStepId: string | undefined = startStepId;
    let lastResult: unknown = undefined;

    while (currentStepId) {
      const step = this.steps.get(currentStepId);
      if (!step) {
        throw new Error(`FlowGuard: Step ID ${currentStepId} not found.`);
      }

      const stepResult = await this.executeStep(step, currentContext);

      // Update context data based on the current step's execution result
      if (stepResult.result !== undefined) {
        currentContext.contextData = {
          ...currentContext.contextData,
          ...((step as any).execute(currentContext).then(r => r.contextUpdate) || {}),
          lastStepResult: stepResult.result,
        };
      }

      lastResult = stepResult.result;
      currentStepId = stepResult.nextStepKey;

      if (!currentStepId) {
        break;
      }
    }

    return {
      finalContext: currentContext,
      finalResult: lastResult,
    };
  }
}
import { Message, ToolResultMessage } from "./types";

export interface FlowStep {
  execute: (context: { history: Message[]; contextData: Record<string, unknown> }) => Promise<{ result: any; success: boolean; contextUpdate: Record<string, unknown> }>;
  condition?: (context: { history: Message[]; contextData: Record<string, unknown> }) => boolean;
  onFailure?: (context: { history: Message[]; contextData: Record<string, unknown> }, error: any) => Promise<{ result: any; success: boolean; contextUpdate: Record<string, unknown> }>;
}

export class FlowController {
  private steps: FlowStep[];

  constructor(steps: FlowStep[]) {
    this.steps = steps;
  }

  private async executeStep(
    step: FlowStep,
    context: { history: Message[]; contextData: Record<string, unknown> }
  ): Promise<{ result: any; success: boolean; contextUpdate: Record<string, unknown> }> {
    if (step.condition && !step.condition(context)) {
      return { result: null, success: false, contextUpdate: {} };
    }

    try {
      const executionResult = await step.execute(context);
      return {
        result: executionResult.result,
        success: executionResult.success,
        contextUpdate: executionResult.contextUpdate,
      };
    } catch (error) {
      console.error("Error during step execution:", error);
      return { result: null, success: false, contextUpdate: {} };
    }
  }

  private async handleFailure(
    context: { history: Message[]; contextData: Record<string, unknown> },
    step: FlowStep,
    error: any
  ): Promise<{ result: any; success: boolean; contextUpdate: Record<string, unknown> }> {
    if (step.onFailure) {
      return step.onFailure(context, error);
    }
    return { result: null, success: false, contextUpdate: {} };
  }

  public async executeFlow(
    initialContext: { history: Message[]; contextData: Record<string, unknown> }
  ): Promise<{ finalResult: any; finalContext: Record<string, unknown> }> {
    let currentContext = { ...initialContext };
    let lastStepResult: { result: any; success: boolean; contextUpdate: Record<string, unknown> } = { result: null, success: true, contextUpdate: {} };

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      let stepResult: { result: any; success: boolean; contextUpdate: Record<string, unknown> };

      try {
        stepResult = await this.executeStep(step, currentContext);
      } catch (error) {
        stepResult = await this.handleFailure(currentContext, step, error);
      }

      if (!stepResult.success) {
        if (step.onFailure) {
          const fallbackResult = await this.handleFailure(currentContext, step, new Error("Step failed"));
          stepResult = fallbackResult;
        } else {
          return { finalResult: null, finalContext: { ...currentContext.contextData, ...stepResult.contextUpdate } };
        }
      }

      currentContext = {
        history: [...currentContext.history],
        contextData: { ...currentContext.contextData, ...stepResult.contextUpdate },
      };
      lastStepResult = stepResult;
    }

    return {
      finalResult: lastStepResult.result,
      finalContext: currentContext.contextData,
    };
  }
}

export { FlowController };
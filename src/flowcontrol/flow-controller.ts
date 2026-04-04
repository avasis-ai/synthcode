import { Message, ToolResultMessage } from "./types";

export interface FlowStep {
  toolName: string;
  toolInput: Record<string, unknown>;
  condition: (output: ToolResultMessage) => boolean;
  onSuccess: FlowStep[] | ((output: ToolResultMessage) => FlowStep[] | null);
  onFailure: FlowStep[] | ((output: ToolResultMessage) => FlowStep[] | null);
}

export interface FlowContext {
  currentState: Message;
  history: Message[];
  toolResults: Map<string, ToolResultMessage>;
}

export class FlowController {
  private initialSteps: FlowStep[];

  constructor(initialSteps: FlowStep[]) {
    this.initialSteps = initialSteps;
  }

  private async executeTool(toolName: string, toolInput: Record<string, unknown>): Promise<ToolResultMessage> {
    // Mock tool execution for demonstration. In a real scenario, this would call an actual tool executor.
    console.log(`Executing tool: ${toolName} with input:`, toolInput);
    await new Promise(resolve => setTimeout(resolve, 50));

    if (toolName === "fail_tool") {
      return { role: "tool", tool_use_id: "mock-id", content: "Operation failed.", is_error: true };
    }

    return { role: "tool", tool_use_id: "mock-id", content: `Result from ${toolName}`, is_error: false };
  }

  private async processStep(
    step: FlowStep,
    context: FlowContext
  ): Promise<{ nextContext: FlowContext; shouldContinue: boolean }> {
    const toolResult = await this.executeTool(step.toolName, step.toolInput);

    const newHistory = [...context.history, { role: "tool", tool_use_id: "mock-id", content: toolResult.content, is_error: toolResult.is_error }];
    const newToolResults = new Map(context.toolResults);
    newToolResults.set(step.toolName, toolResult);

    const nextContext: FlowContext = {
      currentState: { role: "tool", tool_use_id: "mock-id", content: toolResult.content, is_error: toolResult.is_error },
      history: newHistory,
      toolResults: newToolResults,
    };

    let nextSteps: FlowStep[] | null = null;

    if (step.condition(toolResult)) {
      const onSuccessHandler = typeof step.onSuccess === 'function' ? step.onSuccess(toolResult) : step.onSuccess;
      nextSteps = Array.isArray(onSuccessHandler) ? onSuccessHandler as FlowStep[] : (onSuccessHandler as FlowStep[] | null);
    } else {
      const onFailureHandler = typeof step.onFailure === 'function' ? step.onFailure(toolResult) : step.onFailure;
      nextSteps = Array.isArray(onFailureHandler) ? onFailureHandler as FlowStep[] : (onFailureHandler as FlowStep[] | null);
    }

    if (!nextSteps || nextSteps.length === 0) {
      return { nextContext, shouldContinue: false };
    }

    return { nextContext, shouldContinue: true, nextSteps };
  }

  public async executeFlow(initialContext: FlowContext): Promise<{ finalContext: FlowContext; finished: boolean }> {
    let currentContext: FlowContext = initialContext;
    let currentSteps: FlowStep[] | null = this.initialSteps;

    while (currentSteps && currentSteps.length > 0) {
      const step = currentSteps[0];
      const remainingSteps = currentSteps.slice(1);

      const { nextContext, shouldContinue, nextSteps } = await this.processStep(step, currentContext);

      currentContext = nextContext;

      if (!shouldContinue) {
        return { finalContext: currentContext, finished: true };
      }

      if (nextSteps) {
        currentSteps = nextSteps;
      } else {
        currentSteps = null;
      }
    }

    return { finalContext: currentContext, finished: true };
  }
}
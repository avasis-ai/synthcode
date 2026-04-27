import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type FlowState = Record<string, any>;

interface ConditionalStep {
  condition: (state: FlowState, context: Record<string, unknown>) => boolean;
  ifTrue: FlowStep[];
  ifFalse: FlowStep[];
}

interface StateUpdateStep {
  update: (currentState: FlowState, context: Record<string, unknown>) => Partial<FlowState>;
}

type FlowStep =
  | { toolCalls: { toolName: string; input: Record<string, unknown> }[] }
  | ConditionalStep
  | StateUpdateStep
  | { nextSteps: FlowStep[] };

export class FlowController {
  private steps: FlowStep[];

  constructor(steps: FlowStep[]) {
    this.steps = steps;
  }

  private async executeToolCalls(
    toolCalls: { toolName: string; input: Record<string, unknown> }[],
    context: Record<string, unknown>
  ): Promise<Message[]> {
    const results: Message[] = [];
    for (const call of toolCalls) {
      // Mock tool execution for demonstration
      console.log(`Executing tool: ${call.toolName} with input:`, call.input);
      await new Promise(resolve => setTimeout(resolve, 10));
      results.push({
        role: "tool",
        tool_use_id: `mock-id-${Math.random()}`,
        content: `Result from ${call.toolName}`,
      } as ToolResultMessage);
    }
    return results;
  }

  private async executeStep(
    step: FlowStep,
    currentState: FlowState,
    context: Record<string, unknown>
  ): Promise<{ newState: FlowState; outputMessages: Message[] }> {
    let newState = { ...currentState };
    let outputMessages: Message[] = [];

    if (Array.isArray(step)) {
      // This handles the case where a step is an array of steps (e.g., sequential execution)
      let currentSteps = step;
      while (currentSteps.length > 0) {
        const nextStep = currentSteps.shift()!;
        const result = await this.executeStep(nextStep, newState, context);
        newState = result.newState;
        outputMessages.push(...result.outputMessages);
      }
      return { newState, outputMessages };
    }

    if (typeof step === 'object' && step !== null) {
      if ('toolCalls' in step) {
        const toolCalls = step.toolCalls as { toolName: string; input: Record<string, unknown> }[];
        const toolResults = await this.executeToolCalls(toolCalls, context);
        outputMessages.push(...toolResults);
        return { newState, outputMessages };
      }

      if ('update' in step) {
        const updateStep = step as StateUpdateStep;
        const updates = updateStep.update(currentState, context);
        newState = { ...currentState, ...updates };
        return { newState, outputMessages };
      }

      if ('condition' in step) {
        const conditionalStep = step as ConditionalStep;
        const conditionMet = conditionalStep.condition(currentState, context);
        let nextStepsToExecute: FlowStep[] = [];

        if (conditionMet) {
          nextStepsToExecute = conditionalStep.ifTrue;
        } else {
          nextStepsToExecute = conditionalStep.ifFalse;
        }

        const result = await this.executeStep(nextStepsToExecute, newState, context);
        return { newState: result.newState, outputMessages: [...outputMessages, ...result.outputMessages] };
      }

      if ('nextSteps' in step) {
        const nextStepContainer = step as { nextSteps: FlowStep[] };
        const result = await this.executeStep(nextStepContainer.nextSteps, newState, context);
        return { newState: result.newState, outputMessages: [...outputMessages, ...result.outputMessages] };
      }
    }

    throw new Error("Invalid FlowStep structure encountered.");
  }

  public async execute(
    initialState: FlowState,
    initialContext: Record<string, unknown>
  ): Promise<{ finalState: FlowState; outputMessages: Message[] }> {
    let currentState = initialState;
    let allOutputMessages: Message[] = [];

    for (const step of this.steps) {
      const result = await this.executeStep(step, currentState, initialContext);
      currentState = result.newState;
      allOutputMessages.push(...result.outputMessages);
    }

    return { finalState: currentState, outputMessages: allOutputMessages };
  }
}
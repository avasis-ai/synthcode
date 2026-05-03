import { Message, ContentBlock, TextBlock, ThinkingBlock } from "./types";

export type ThoughtStepType = "PLAN" | "EXECUTE" | "REFLECT" | "REFINE";

export interface ThoughtStep {
  type: ThoughtStepType;
  input: string;
  action: (context: ThoughtContext) => Promise<{ output: string; success: boolean }>;
}

export interface ThoughtContext {
  initialInput: string;
  history: Message[];
  stepOutputs: Record<ThoughtStepType, { output: string; success: boolean }>;
  currentStep: ThoughtStepType;
}

export interface ChainResult {
  finalOutput: string;
  history: ThoughtContext;
}

export class StructuredThoughtChainer {
  private context: ThoughtContext;

  constructor(initialInput: string, history: Message[]) {
    this.context = {
      initialInput: initialInput,
      history: history,
      stepOutputs: {} as Record<ThoughtStepType, { output: string; success: boolean }>,
      currentStep: "PLAN",
    };
  }

  private updateContext(stepType: ThoughtStepType, output: string, success: boolean): void {
    this.context.stepOutputs[stepType] = { output, success };
  }

  public async executeChain(steps: ThoughtStep[]): Promise<ChainResult> {
    let currentContext = this.context;
    let lastResult: string = "";

    for (const step of steps) {
      if (step.type !== currentContext.currentStep) {
        throw new Error(`Attempted to execute step ${step.type} out of sequence. Expected ${currentContext.currentStep}.`);
      }

      try {
        const result = await step.action(currentContext);
        lastResult = result.output;
        this.updateContext(step.type, result.output, result.success);

        if (!result.success) {
          console.warn(`Thought chain step ${step.type} failed. Halting or attempting fallback.`);
          // In a real system, this would trigger a specific error handling step.
          break;
        }
      } catch (error) {
        console.error(`Error during ${step.type} step:`, error);
        this.updateContext(step.type, `Error executing step: ${error instanceof Error ? error.message : String(error)}`, false);
        break;
      }
    }

    return {
      finalOutput: lastResult,
      history: this.context,
    };
  }
}

export { StructuredThoughtChainer };
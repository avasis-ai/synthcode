import { Message, ToolResultMessage } from "./types";

interface ToolDefinition {
  name: string;
  execute: (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

interface FlowStep {
  tool: ToolDefinition;
  inputMapping: Record<string, { source: "context" | "previous_output"; mapFrom: string }>;
  onFailure?: {
    maxRetries: number;
    fallbackTool?: ToolDefinition;
    fallbackInputMapping?: Record<string, { source: "context" | "previous_output"; mapFrom: string }>;
  };
}

export class FlowController {
  private steps: FlowStep[];

  constructor(steps: FlowStep[]) {
    this.steps = steps;
  }

  private mapInput(mapping: Record<string, { source: "context" | "previous_output"; mapFrom: string }>, context: Record<string, unknown>, previousOutput: Record<string, unknown>): Record<string, unknown> {
    const input: Record<string, unknown> = {};
    for (const [key, mappingDef] of Object.entries(mapping)) {
      let sourceValue: unknown = undefined;
      if (mappingDef.source === "context") {
        sourceValue = context[mappingDef.mapFrom];
      } else if (mappingDef.source === "previous_output") {
        sourceValue = previousOutput[mappingDef.mapFrom];
      }
      input[key] = sourceValue;
    }
    return input;
  }

  public async execute(initialContext: Record<string, unknown>): Promise<{ finalContext: Record<string, unknown>; finalOutput: Record<string, unknown> }> {
    let currentContext = { ...initialContext };
    let previousOutput: Record<string, unknown> = {};

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      let attempt = 0;
      let stepSucceeded = false;
      let stepResult: Record<string, unknown> | null = null;

      while (attempt <= (step.onFailure?.maxRetries || 0)) {
        try {
          const input = this.mapInput(step.inputMapping, currentContext, previousOutput);
          
          stepResult = await step.tool.execute(input, currentContext);
          
          previousOutput = stepResult;
          stepSucceeded = true;
          break;
        } catch (error) {
          if (attempt < (step.onFailure?.maxRetries || 0)) {
            console.warn(`Step ${i} failed. Retrying... Attempt ${attempt + 1}/${step.onFailure?.maxRetries + 1}`);
            attempt++;
            continue;
          } else {
            if (step.onFailure?.fallbackTool) {
              console.warn(`Step ${i} failed permanently. Attempting fallback tool.`);
              const fallbackInput = this.mapInput(step.onFailure.fallbackInputMapping!, currentContext, previousOutput);
              stepResult = await step.onFailure.fallbackTool.execute(fallbackInput, currentContext);
              previousOutput = stepResult;
              stepSucceeded = true;
              break;
            } else {
              throw new Error(`Step ${i} failed after ${attempt + 1} attempts and no fallback defined. Error: ${(error as Error).message}`);
            }
          }
        }
      }

      if (!stepSucceeded) {
        throw new Error(`Flow execution failed at step ${i}.`);
      }
      
      // Update context with the successful output of the step
      currentContext = { ...currentContext, ...previousOutput };
    }

    return { finalContext: currentContext, finalOutput: previousOutput };
  }
}
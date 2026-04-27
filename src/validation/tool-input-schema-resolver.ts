import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Schema {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array";
    required?: boolean;
    description?: string;
    enum?: string[];
    properties?: {
      [key: string]: Schema;
    };
    items?: Schema;
  };
}

export interface InputStep {
  source: "context" | "previous_output" | "initial_context";
  transform: (sourceData: unknown, context: Record<string, unknown>) => Promise<unknown>;
}

export interface Resolver {
  resolve(
    toolSchema: Schema,
    inputSteps: InputStep[],
    initialContext: Record<string, unknown>
  ): Promise<{ resolvedInput: Record<string, unknown>; finalSchema: Schema }>;
}

class ToolInputSchemaResolver implements Resolver {
  resolve(
    toolSchema: Schema,
    inputSteps: InputStep[],
    initialContext: Record<string, unknown>
  ): Promise<{ resolvedInput: Record<string, unknown>; finalSchema: Schema }> {
    const resolvedInputs: Record<string, unknown> = {};
    let currentContext: Record<string, unknown> = { ...initialContext };

    const executeStep = async (step: InputStep, stepIndex: number): Promise<void> => {
      let sourceData: unknown;

      if (step.source === "context") {
        sourceData = currentContext;
      } else if (step.source === "previous_output") {
        // In a real scenario, this would pull from the result of the previous step's transformation
        sourceData = resolvedInputs;
      } else if (step.source === "initial_context") {
        sourceData = initialContext;
      } else {
        throw new Error(`Unknown source specified: ${step.source}`);
      }

      const transformedData = await step.transform(sourceData, currentContext);
      
      // Simple heuristic: assume the transformation result populates the next required field
      // For simplicity, we'll store the result under a key derived from the step index or a known name.
      // In a real system, the step would define the target key.
      const targetKey = `step_${stepIndex}_output`;
      resolvedInputs[targetKey] = transformedData;
      currentContext[targetKey] = transformedData;
    };

    const runSteps = async () => {
      for (let i = 0; i < inputSteps.length; i++) {
        await executeStep(inputSteps[i], i);
      }
    };

    return new Promise(async (resolve, reject) => {
      try {
        await runSteps();

        // Validation step (Simplified: assumes the final schema structure matches the resolved inputs)
        // A full implementation would recursively validate resolvedInputs against toolSchema.
        const finalSchema = toolSchema;
        
        // For this implementation, we return the accumulated resolved inputs and the original schema.
        resolve({
          resolvedInput: resolvedInputs,
          finalSchema: finalSchema,
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const createToolInputSchemaResolver = (): Resolver => {
  return new ToolInputSchemaResolver();
};
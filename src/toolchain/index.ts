import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolInputMap {
  [key: string]: (context: Record<string, any>) => unknown;
}

export interface ToolChainStep {
  toolName: string;
  inputMap: ToolInputMap;
  options?: Record<string, any>;
}

export interface ToolChainContext {
  history: Message[];
  state: Record<string, any>;
}

export class ToolChainExecutor {
  private steps: ToolChainStep[];

  constructor(steps: ToolChainStep[]) {
    this.steps = steps;
  }

  public async execute(initialContext: ToolChainContext): Promise<Record<string, any>> {
    let context: ToolChainContext = {
      history: [...initialContext.history],
      state: { ...initialContext.state },
    };

    for (const step of this.steps) {
      const inputs = this.mapInputs(step.inputMap, context);
      const result = await this.executeTool(step.toolName, inputs, step.options, context);

      context.history.push({
        role: "tool",
        tool_use_id: step.toolName + "_result",
        content: JSON.stringify(result),
      } as ToolResultMessage);
      context.state[step.toolName] = result;
    }

    return context.state;
  }

  private mapInputs(inputMap: ToolInputMap, context: ToolChainContext): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    for (const key in inputMap) {
      if (Object.prototype.hasOwnProperty.call(inputMap, key)) {
        const mapper = inputMap[key];
        inputs[key] = mapper(context.state);
      }
    }
    return inputs;
  }

  private async executeTool(
    toolName: string,
    inputs: Record<string, unknown>,
    options: Record<string, any> | undefined,
    context: ToolChainContext
  ): Promise<any> {
    console.log(`Executing tool: ${toolName} with inputs:`, inputs);
    // Mock execution logic: In a real scenario, this would call an actual tool service.
    await new Promise(resolve => setTimeout(resolve, 10));
    return { status: "success", result: `Processed ${JSON.stringify(inputs)} for ${toolName}` };
  }

  public static validateChain(steps: ToolChainStep[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let context: ToolChainContext = { history: [], state: {} };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const requiredInputs = Object.keys(step.inputMap);

      // Basic validation: Check if all required inputs can be mapped from the current state
      for (const inputKey of requiredInputs) {
        // This is a simplified check. A full check would require knowing the expected output type of previous steps.
        // For now, we just ensure the mapper function exists.
        if (typeof step.inputMap[inputKey] !== 'function') {
          errors.push(`Step ${i} (${step.toolName}): Input map for '${inputKey}' is not a function.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export { ToolChainExecutor };
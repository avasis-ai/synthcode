import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ToolInput = Record<string, unknown>;

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (input: ToolInput) => Promise<any>;
}

interface ToolChainStep {
  toolName: string;
  inputMapper: (state: any) => Partial<ToolInput>;
  condition: (state: any) => boolean;
}

export class ToolChainExecutor {
  private toolDefinitions: Map<string, ToolDefinition>;

  constructor(toolDefinitions: ToolDefinition[]) {
    this.toolDefinitions = new Map(
      toolDefinitions.map((tool) => [tool.name, tool])
    );
  }

  private getTool(toolName: string): ToolDefinition | undefined {
    return this.toolDefinitions.get(toolName);
  }

  public async executeChain(
    steps: ToolChainStep[],
    initialState: Record<string, any>
  ): Promise<{ finalState: Record<string, any>; results: any[] }> {
    let currentState: Record<string, any> = {
      ...initialState,
      history: [...(initialState.history || [])],
    };
    const results: any[] = [];

    for (const step of steps) {
      if (!step.condition(currentState)) {
        continue;
      }

      const tool = this.getTool(step.toolName);
      if (!tool) {
        throw new Error(`Tool not found for step: ${step.toolName}`);
      }

      const input = step.inputMapper(currentState);
      
      try {
        const toolResult = await tool.execute(input);
        
        results.push({
          step: step,
          input: input,
          output: toolResult,
        });

        currentState = {
          ...currentState,
          lastToolOutput: toolResult,
          history: [...currentState.history, {
            toolName: step.toolName,
            input: input,
            output: toolResult,
          }],
        };
      } catch (error) {
        throw new Error(
          `Tool execution failed for ${step.toolName}: ${(error as Error).message}`
        );
      }
    }

    return { finalState: currentState, results };
  }
}
import { Message, ToolUseBlock, ContentBlock, ToolResultMessage } from "./types";

export interface Dependency {
  sourceToolName: string;
  outputKey: string;
  requiredByToolName: string;
}

export interface ToolCallPlan {
  toolName: string;
  input: Record<string, unknown>;
  dependencies: Dependency[];
}

export class ToolDependencyGraph {
  private toolCallPlan: ToolCallPlan[];
  private dependencies: Dependency[];

  constructor(toolCallPlan: ToolCallPlan[]) {
    this.toolCallPlan = toolCallPlan;
    this.dependencies = toolCallPlan.flatMap(plan => plan.dependencies);
  }

  /**
   * Validates the entire sequence of planned tool calls to ensure all dependencies are met.
   * @returns true if the graph is valid, false otherwise.
   */
  public validate(): boolean {
    const executedOutputs: Map<string, Set<string>> = new Map();

    for (let i = 0; i < this.toolCallPlan.length; i++) {
      const currentPlan = this.toolCallPlan[i];
      const requiredDependencies = currentPlan.dependencies;

      for (const dep of requiredDependencies) {
        const { sourceToolName, outputKey, requiredByToolName } = dep;

        if (requiredByToolName !== currentPlan.toolName) {
          continue; // Should not happen if dependencies are correctly structured, but safe guard.
        }

        if (!executedOutputs.has(sourceToolName)) {
          console.error(`Validation Error: Dependency source tool "${sourceToolName}" has not been executed before "${currentPlan.toolName}".`);
          return false;
        }

        const sourceOutputs = executedOutputs.get(sourceToolName)!;
        if (!sourceOutputs.has(outputKey)) {
          console.error(`Validation Error: Tool "${currentPlan.toolName}" requires output "${outputKey}" from tool "${sourceToolName}", but it was not provided by any preceding call.`);
          return false;
        }
      }

      // Simulate execution: Record outputs from the current tool call for subsequent checks
      const currentToolName = currentPlan.toolName;
      if (!executedOutputs.has(currentToolName)) {
        executedOutputs.set(currentToolName, new Set<string>());
      }

      // In a real scenario, we would process the actual tool result here.
      // For validation purposes, we assume the tool *will* produce outputs based on its plan.
      // Since the dependency structure implies the output key exists, we mark it as available.
      // A more robust system would map the plan's inputs/outputs explicitly.
      // Here, we just ensure the tool name is registered as having run.
      executedOutputs.get(currentToolName)!.add("success");
    }

    return true;
  }

  /**
   * Executes the tool calls sequentially, respecting dependencies.
   * This is a simplified execution model for demonstration.
   * @param initialContext A map of initial context variables.
   * @returns A map of final tool outputs.
   */
  public async execute(initialContext: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    if (!this.validate()) {
      throw new Error("Tool execution failed: Dependency graph validation failed.");
    }

    let context: Record<string, unknown> = { ...initialContext };
    const finalOutputs: Record<string, unknown> = {};

    for (const plan of this.toolCallPlan) {
      console.log(`Executing tool: ${plan.toolName}`);

      // 1. Gather inputs from context and dependencies
      const inputs: Record<string, unknown> = {
        ...context,
        ...plan.input,
      };

      // 2. Simulate execution (In a real agent, this calls the actual tool executor)
      // For this structure, we just simulate success and capture a dummy output.
      const result: Record<string, unknown> = {
        success: true,
        output_data: `Result from ${plan.toolName} with inputs: ${JSON.stringify(inputs)}`,
      };

      // 3. Update context and final outputs
      finalOutputs[plan.toolName] = result;
      Object.keys(result).forEach(key => {
        context[key] = result[key];
      });
    }

    return finalOutputs;
  }
}
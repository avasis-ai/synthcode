import {
  AgentContext,
  ResourceContext,
  ToolCallStep,
  SimulationReport,
  HypotheticalContext,
  ToolResult,
} from "./types";

export class HypotheticalExecutor {
  private readonly initialAgentContext: AgentContext;
  private readonly initialResourceContext: ResourceContext;

  constructor(
    agentContext: AgentContext,
    resourceContext: ResourceContext,
  ) {
    this.initialAgentContext = agentContext;
    this.initialResourceContext = resourceContext;
  }

  private createHypotheticalContext(): HypotheticalContext {
    return new HypotheticalContext(
      this.initialAgentContext,
      this.initialResourceContext,
    );
  }

  public executePlan(
    planSteps: ToolCallStep[],
    mockToolResults: Record<string, ToolResult>,
  ): SimulationReport {
    const hypotheticalContext = this.createHypotheticalContext();
    let currentContext = hypotheticalContext.getContext();
    let currentResource = hypotheticalContext.getResource();
    const predictedFailures: string[] = [];
    const predictedSteps: ToolCallStep[] = [];

    for (const step of planSteps) {
      const toolId = step.toolCallId;
      const mockResult = mockToolResults[toolId];

      if (!mockResult) {
        predictedFailures.push(
          `Simulation failed: No mock result provided for tool ID ${toolId}.`,
        );
        break;
      }

      try {
        // 1. Simulate Tool Execution
        const predictedToolResult = this.simulateToolExecution(
          step,
          mockResult,
          currentContext,
          currentResource,
        );

        // 2. Update Context and Resources
        const updatedContext = this.updateAgentContext(
          currentContext,
          predictedToolResult,
        );
        const updatedResource = this.updateResourceContext(
          currentResource,
          predictedToolResult,
        );

        // 3. Advance State
        currentContext = updatedContext;
        currentResource = updatedResource;
        predictedSteps.push(step);
      } catch (e) {
        predictedFailures.push(
          `Simulation failed at step ${step.toolCallId}: ${(e as Error).message}`,
        );
        break;
      }
    }

    return {
      predictedFinalAgentContext: currentContext,
      predictedFinalResourceContext: currentResource,
      predictedStepsTaken: predictedSteps,
      predictedFailures: predictedFailures,
    };
  }

  private simulateToolExecution(
    step: ToolCallStep,
    mockResult: ToolResult,
    context: AgentContext,
    resource: ResourceContext,
  ): ToolResult {
    if (mockResult.is_error) {
      return mockResult;
    }
    return mockResult;
  }

  private updateAgentContext(
    currentContext: AgentContext,
    toolResult: ToolResult,
  ): AgentContext {
    return {
      ...currentContext,
      messages: [
        ...currentContext.messages,
        {
          role: "tool",
          tool_use_id: toolResult.tool_use_id,
          content: toolResult.content,
          is_error: toolResult.is_error,
        },
      ],
    };
  }

  private updateResourceContext(
    currentResource: ResourceContext,
    toolResult: ToolResult,
  ): ResourceContext {
    // Simple simulation: assume successful tool calls consume resources
    if (!toolResult.is_error) {
      return {
        ...currentResource,
        usage: {
          ...currentResource.usage,
          tokens: currentResource.usage.tokens + 10,
          time_ms: currentResource.usage.time_ms + 50,
        },
      };
    }
    return currentResource;
  }
}
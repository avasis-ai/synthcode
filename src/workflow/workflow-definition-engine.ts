import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type StepResult = {
  success: boolean;
  output: any;
  nextStepId: string | null;
};

export interface WorkflowNode {
  id: string;
  type: "start" | "step" | "end";
  description: string;
  inputs: Record<string, unknown>;
  // For 'step' type, this defines the action or logic to execute
  action?: (context: Record<string, any>, inputs: Record<string, unknown>) => Promise<any>;
  // For 'step' type, this defines the next node(s) based on execution
  transitions?: Record<string, string[]>;
}

export interface WorkflowDefinition {
  startNodeId: string;
  nodes: Record<string, WorkflowNode>;
  // Defines parallel paths or explicit edges
  edges?: Record<string, string[]>;
}

export interface WorkflowState {
  workflowId: string;
  definition: WorkflowDefinition;
  currentNodeId: string | null;
  context: Record<string, any>;
  history: Message[];
  status: "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED";
  executionLog: string[];
}

export class WorkflowExecutor {
  private state: WorkflowState;

  constructor(definition: WorkflowDefinition, initialContext: Record<string, any>) {
    this.state = {
      workflowId: crypto.randomUUID(),
      definition: definition,
      currentNodeId: definition.startNodeId,
      context: initialContext,
      history: [],
      status: "RUNNING",
      executionLog: [],
    };
  }

  public getState(): WorkflowState {
    return this.state;
  }

  public pauseWorkflow(): void {
    if (this.state.status === "RUNNING") {
      this.state.status = "PAUSED";
      this.state.executionLog.push(`Workflow ${this.state.workflowId} paused externally.`);
    }
  }

  public resumeWorkflow(): void {
    if (this.state.status === "PAUSED") {
      this.state.status = "RUNNING";
      this.state.executionLog.push(`Workflow ${this.state.workflowId} resumed.`);
    }
  }

  private async executeNode(nodeId: string): Promise<StepResult> {
    const node = this.state.definition.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found.`);
    }

    this.state.executionLog.push(`Executing node: ${nodeId}`);

    if (node.type === "end") {
      return { success: true, output: null, nextStepId: null };
    }

    if (node.type === "step") {
      const action = node.action;
      if (!action) {
        throw new Error(`Step node ${nodeId} requires an action.`);
      }

      try {
        const output = await action(this.state.context, node.inputs);
        this.state.context = { ...this.state.context, ...output };
        this.state.executionLog.push(`Node ${nodeId} completed successfully.`);

        // Determine next steps based on transitions
        const transitions = node.transitions;
        if (transitions && Object.keys(transitions).length > 0) {
          // Simple transition logic: assume the first defined transition path is taken
          const transitionKey = Object.keys(transitions)[0];
          const nextIds = transitions[transitionKey];
          return { success: true, output: output, nextStepId: nextIds[0] || null };
        }
        return { success: true, output: output, nextStepId: null };

      } catch (error) {
        this.state.executionLog.push(`Node ${nodeId} failed: ${error instanceof Error ? error.message : String(error)}`);
        return { success: false, output: null, nextStepId: null };
      }
    }

    throw new Error(`Unsupported node type: ${node.type}`);
  }

  public async executeStep(): Promise<StepResult> {
    if (this.state.status !== "RUNNING") {
      throw new Error(`Cannot execute step. Workflow status is ${this.state.status}.`);
    }

    const currentId = this.state.currentNodeId;
    if (!currentId) {
      throw new Error("No current node defined.");
    }

    const result = await this.executeNode(currentId);

    if (result.success && result.nextStepId) {
      this.state.currentNodeId = result.nextStepId;
    } else if (result.success && !result.nextStepId) {
      this.state.status = "COMPLETED";
      this.state.currentNodeId = null;
    } else {
      this.state.status = "FAILED";
      this.state.currentNodeId = null;
    }

    return result;
  }
}
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Context {
  [key: string]: any;
}

export interface ToolStep {
  toolName: string;
  input: Record<string, unknown>;
  // A unique identifier for this step's execution instance
  stepId: string;
}

export interface GraphNode {
  type: "tool_call" | "user_input" | "assistant_response";
  source: string; // e.g., toolName or "user"
  id: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

export interface DependencyEdge {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: "input_uses" | "output_provides" | "sequential";
  provenance: {
    sourceStepId: string;
    stateVariable: string;
  };
}

export interface DependencyGraph {
  nodes: Record<string, GraphNode>;
  edges: DependencyEdge[];
}

export class StatefulDependencyGraphBuilder {
  private initialContext: Context;
  private steps: {
    step: ToolStep;
    stateUpdate: Partial<Context>;
  }[] = [];
  private graphNodes: Record<string, GraphNode> = {};
  private dependencyEdges: DependencyEdge[] = [];
  private currentContext: Context;

  constructor(initialContext: Context) {
    this.initialContext = initialContext;
    this.currentContext = { ...initialContext };
  }

  addStep(step: ToolStep, stateUpdate: Partial<Context>): void {
    this.steps.push({ step, stateUpdate });
  }

  private recordNode(step: ToolStep, inputs: Record<string, unknown>, outputs: Record<string, unknown>): string {
    const nodeId = `step_${step.stepId}`;
    this.graphNodes[nodeId] = {
      type: "tool_call",
      source: step.toolName,
      id: nodeId,
      inputs: inputs,
      outputs: outputs,
    };
    return nodeId;
  }

  private recordDependency(fromNodeId: string, toNodeId: string, dependencyType: "input_uses" | "output_provides" | "sequential", provenance: { sourceStepId: string; stateVariable: string }): void {
    this.dependencyEdges.push({
      fromNodeId,
      toNodeId,
      dependencyType,
      provenance,
    });
  }

  build(): DependencyGraph {
    this.graphNodes = {};
    this.dependencyEdges = [];
    this.currentContext = { ...this.initialContext };

    let lastToolNodeId: string | null = null;

    for (let i = 0; i < this.steps.length; i++) {
      const { step, stateUpdate } = this.steps[i];
      const stepId = step.stepId;

      // 1. Determine Inputs (Dependencies)
      // For simplicity, we assume inputs are derived from the current context state
      // or explicitly provided in the step definition if the context is insufficient.
      const inputs: Record<string, unknown> = { ...step.input };
      const inputDependencies: Record<string, { nodeId: string; variable: string }> = {};

      // In a real system, we would trace which keys in step.input map to context keys.
      // Here, we simulate dependency tracking by assuming any key present in the context
      // that matches a step input key is a dependency.
      for (const key in step.input) {
        if (this.currentContext.hasOwnProperty(key) && typeof (this.currentContext[key]) !== 'undefined') {
          // Simulate finding the source node ID for the dependency
          // This is highly simplified; a real system needs explicit mapping.
          const sourceNodeId = `context_var_${key}`;
          inputDependencies[key] = { nodeId: sourceNodeId, variable: key };
        }
      }

      // 2. Record Node
      const currentNodeId = this.recordNode(step, inputs, {} /* Outputs are derived from stateUpdate */);

      // 3. Record Dependencies (Edges)
      // A. Input Dependencies (What did this step use?)
      for (const key in inputDependencies) {
        const { nodeId: sourceNodeId, variable: stateVariable } = inputDependencies[key];
        this.recordDependency(sourceNodeId, currentNodeId, "input_uses", { sourceStepId: stepId, stateVariable });
      }

      // B. Sequential Dependency (What was the previous step?)
      if (lastToolNodeId) {
        this.recordDependency(lastToolNodeId, currentNodeId, "sequential", { sourceStepId: stepId, stateVariable: "sequence" });
      }

      // 4. Update State (Outputs/Context)
      // The stateUpdate represents the outputs of this step.
      const outputs: Record<string, unknown> = {};
      for (const key in stateUpdate) {
        outputs[key] = stateUpdate[key];
        this.currentContext[key] = stateUpdate[key];
      }

      // Update the node's output record (overwriting the placeholder)
      this.graphNodes[currentNodeId] = {
        ...this.graphNodes[currentNodeId],
        outputs: outputs,
      };

      lastToolNodeId = currentNodeId;
    }

    return {
      nodes: this.graphNodes,
      edges: this.dependencyEdges,
    };
  }
}
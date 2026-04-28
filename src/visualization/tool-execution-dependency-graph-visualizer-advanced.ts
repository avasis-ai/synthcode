import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

export interface TemporalConstraint {
  startTimeMs: number;
  durationMs: number;
}

export interface AdvancedNode {
  id: string;
  label: string;
  type: "tool_execution" | "user_input" | "system_process";
  metadata: {
    startTime?: number;
    endTime?: number;
    resources?: ResourceConstraint[];
  };
}

export interface AdvancedEdge {
  sourceId: string;
  targetId: string;
  relationship: "calls" | "depends_on" | "follows";
  metadata: {
    temporal?: TemporalConstraint;
    resourceFlow?: ResourceConstraint[];
  };
}

export interface AdvancedGraphPayload {
  nodes: AdvancedNode[];
  edges: AdvancedEdge[];
}

export class ToolExecutionDependencyGraphVisualizerAdvanced {
  private payload: AdvancedGraphPayload;

  constructor(payload: AdvancedGraphPayload) {
    this.payload = payload;
  }

  public visualize(): void {
    console.log("--- Advanced Tool Execution Dependency Graph Visualization ---");
    this.visualizeNodes();
    this.visualizeEdges();
    console.log("Visualization complete. Rendering logic applied for temporal and resource layers.");
  }

  private visualizeNodes(): void {
    console.log("\n[Nodes Visualization]");
    for (const node of this.payload.nodes) {
      console.log(`  Node ID: ${node.id} (${node.type})`);
      console.log(`    Label: ${node.label}`);
      if (node.metadata.startTime && node.metadata.endTime) {
        console.log(`    Time Span: ${node.metadata.startTime}ms to ${node.metadata.endTime}ms`);
      }
      if (node.metadata.resources && node.metadata.resources.length > 0) {
        console.log("    Resources Used:");
        node.metadata.resources.forEach(r => {
          console.log(`      - ${r.resourceName}: ${r.requiredAmount} ${r.unit}`);
        });
      }
    }
  }

  private visualizeEdges(): void {
    console.log("\n[Edges Visualization]");
    for (const edge of this.payload.edges) {
      console.log(`  Edge: ${edge.sourceId} --(${edge.relationship})--> ${edge.targetId}`);
      if (edge.metadata.temporal) {
        console.log(`    Temporal Constraint: Starts at ${edge.metadata.temporal.startTimeMs}ms, lasts ${edge.metadata.temporal.durationMs}ms.`);
      }
      if (edge.metadata.resourceFlow && edge.metadata.resourceFlow.length > 0) {
        console.log("    Resource Flow:");
        edge.metadata.resourceFlow.forEach(r => {
          console.log(`      - ${r.resourceName}: ${r.requiredAmount} ${r.unit}`);
        });
      }
    }
  }

  public static createFromMessages(messages: Array<any>): AdvancedGraphPayload {
    const nodes: AdvancedNode[] = [];
    const edges: AdvancedEdge[] = [];

    let nodeIdCounter = 0;

    const createNode = (id: string, label: string, type: "tool_execution" | "user_input" | "system_process", metadata: Partial<AdvancedNode['metadata']> = {}): AdvancedNode => ({
      id: id,
      label: label,
      type: type,
      metadata: metadata,
    });

    const processMessage = (message: any, index: number): { node: AdvancedNode, edges: AdvancedEdge[] }[] => {
      const results: { node: AdvancedNode, edges: AdvancedEdge[] }[] = [];
      let currentNode: AdvancedNode | null = null;

      if (message.role === "user") {
        const userNode = createNode(`user_${index}`, `User Input`, "user_input", { startTime: Date.now() - 1000, endTime: Date.now() });
        nodes.push(userNode);
        currentNode = userNode;
        results.push({ node: userNode, edges: [] });
      } else if (message.role === "tool") {
        const toolMessage = message as ToolResultMessage;
        const toolNode = createNode(`tool_${toolMessage.tool_use_id}`, `Tool Result: ${toolMessage.tool_use_id}`, "tool_execution", { startTime: Date.now() - 500, endTime: Date.now() });
        nodes.push(toolNode);
        currentNode = toolNode;
        results.push({ node: toolNode, edges: [] });
      } else if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        let lastToolNodeId: string | undefined = undefined;

        for (let i = 0; i < assistantMessage.content.length; i++) {
          const block = assistantMessage.content[i];
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            const toolUseNode = createNode(`tool_use_${toolUseBlock.id}`, `${toolUseBlock.name} Call`, "tool_execution", { startTime: Date.now(), endTime: Date.now() + 100 });
            nodes.push(toolUseNode);
            if (currentNode) {
              edges.push({
                sourceId: currentNode.id,
                targetId: toolUseNode.id,
                relationship: "calls",
                metadata: { temporal: { startTimeMs: Date.now(), durationMs: 100 } }
              });
            }
            lastToolNodeId = toolUseNode.id;
            currentNode = toolUseNode;
          }
        }
        // Simplified thinking/text block handling for demonstration
        const thinkingNode = createNode(`think_${index}`, "Thinking Process", "system_process", { startTime: Date.now() - 200, endTime: Date.now() });
        nodes.push(thinkingNode);
        if (currentNode) {
            edges.push({
                sourceId: currentNode.id,
                targetId: thinkingNode.id,
                relationship: "follows",
                metadata: { temporal: { startTimeMs: Date.now(), durationMs: 200 } }
            });
        }
        currentNode = thinkingNode;
        results.push({ node: thinkingNode, edges: [] });
      }
      return results;
    };

    let lastNode: AdvancedNode | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const results = processMessage(message, i);
      results.forEach(({ node, edges: currentEdges }) => {
        // Connect current node to the previous significant node if applicable
        if (lastNode && node.id !== lastNode.id) {
          edges.push({
            sourceId: lastNode.id,
            targetId: node.id,
            relationship: "follows",
            metadata: { temporal: { startTimeMs: 0, durationMs: 100 } }
          });
        }
        lastNode = node;
      });
    }

    return { nodes, edges };
  }
}
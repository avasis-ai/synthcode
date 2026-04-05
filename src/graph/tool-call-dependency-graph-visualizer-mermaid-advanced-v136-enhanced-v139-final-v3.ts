import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Outcome = "SUCCESS" | "FAILURE" | "SKIPPED";

interface GraphNode {
  id: string;
  description: string;
  outcome: Outcome;
  dependencies: string[];
}

class ToolCallDependencyGraphVisualizer {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: { from: string; to: string }[] = [];

  constructor() {}

  private getNodeStyle(outcome: Outcome): string {
    switch (outcome) {
      case "SUCCESS":
        return "style fill:#d4edda,stroke:#c3e6cb,stroke-width:2px";
      case "FAILURE":
        return "style fill:#f8d7da,stroke:#f5c6cb,stroke-width:2px";
      case "SKIPPED":
        return "style fill:#fff3cd,stroke:#ffeeba,stroke-width:2px";
      default:
        return "";
    }
  }

  private getEdgeStyle(outcome: Outcome): string {
    switch (outcome) {
      case "SUCCESS":
        return "stroke:#28a745,stroke-dasharray:0";
      case "FAILURE":
        return "stroke:#dc3545,stroke-dasharray:5,5";
      case "SKIPPED":
        return "stroke:#ffc107,stroke-dasharray:3,3";
      default:
        return "";
    }
  }

  private createNodeId(prefix: string, index: number): string {
    return `${prefix}-${index}`;
  }

  private processMessageForNodes(messages: Message[]): void {
    this.nodes.clear();
    this.edges = [];

    let nodeCounter = 0;

    messages.forEach((message, index) => {
      let nodeId: string;
      let description: string;
      let outcome: Outcome = "SUCCESS";

      if (message.role === "user") {
        nodeId = this.createNodeId("user", index);
        description = `User Input: ${message.content.substring(0, 50)}...`;
      } else if (message.role === "assistant") {
        nodeId = this.createNodeId("assistant", index);
        description = `Assistant Response: ${message.content.length > 0 ? "Content Generated" : "Empty"}`;
      } else if (message.role === "tool") {
        const toolMsg = message as ToolResultMessage;
        nodeId = this.createNodeId("tool", index);
        description = `Tool Result (${toolMsg.tool_use_id}): ${toolMsg.content.substring(0, 50)}...`;
        outcome = toolMsg.is_error ? "FAILURE" : "SUCCESS";
      } else {
        return;
      }

      const node: GraphNode = {
        id: nodeId,
        description: description,
        outcome: outcome,
        dependencies: [],
      };
      this.nodes.set(nodeId, node);
      nodeCounter++;
    });
  }

  private processToolUsesForDependencies(messages: Message[]): void {
    let nodeCounter = 0;
    const toolUseMap = new Map<string, ToolUseBlock>();

    // 1. Collect all tool uses from assistant messages
    messages.forEach((message, index) => {
      if (message.role === "assistant" && (message as AssistantMessage).content.length > 0) {
        const content = message as AssistantMessage;
        content.forEach((block, blockIndex) => {
          if (block.type === "tool_use") {
            const toolUse: ToolUseBlock = block as ToolUseBlock;
            const toolUseId = toolUse.id;
            if (!toolUseMap.has(toolUseId)) {
              toolUseMap.set(toolUseId, toolUse);
            }
          }
        });
      }
    });

    // 2. Link dependencies
    messages.forEach((message, index) => {
      const currentMessageRole = message.role;
      const currentNodeId = this.createNodeId(currentMessageRole === "user" ? "user" : currentMessageRole === "assistant" ? "assistant" : "tool", index);
      const currentNode = this.nodes.get(currentNodeId);

      if (!currentNode) return;

      if (currentMessageRole === "assistant") {
        const content = message as AssistantMessage;
        content.forEach((block, blockIndex) => {
          if (block.type === "tool_use") {
            const toolUse: ToolUseBlock = block as ToolUseBlock;
            const toolUseId = toolUse.id;
            const toolNodeId = this.createNodeId(`tool_use_${toolUseId}`, 0);
            const toolNode: GraphNode = {
              id: toolNodeId,
              description: `Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`,
              outcome: "SUCCESS",
              dependencies: [],
            };
            this.nodes.set(toolNodeId, toolNode);

            // Link: Assistant -> Tool Use
            this.edges.push({ from: currentNodeId, to: toolNodeId });
            
            // Link: Tool Use -> (Implicitly waits for tool result)
            // We don't add a dependency edge here, as the tool result message handles the flow.
          }
        });
      } else if (currentMessageRole === "tool") {
        // Tool result links back to the tool use that initiated it (if we tracked it, but for simplicity, we link to the previous assistant step)
        // In a real scenario, we'd need a better way to map tool result to tool use ID.
        // For this structure, we just ensure the tool result node exists and is linked sequentially.
      }
    });
  }

  public visualize(messages: Message[]): string {
    this.nodes.clear();
    this.edges = [];

    this.processMessageForNodes(messages);
    this.processToolUsesForDependencies(messages);

    let mermaidGraph = "graph TD;\n";
    let nodeDeclarations: string[] = [];
    let edgeDeclarations: string[] = [];

    // 1. Declare Nodes and Styles
    this.nodes.forEach((node, id) => {
      const style = this.getNodeStyle(node.outcome);
      nodeDeclarations.push(`${id}["${node.description}"]${style}`);
    });

    // 2. Declare Edges and Styles
    this.edges.forEach((edge, index) => {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);

      let edgeStyle = "";
      if (fromNode) {
        // Determine edge style based on the *target* node's outcome, or the edge's implied flow.
        // For simplicity, we use the target node's outcome for edge styling.
        const targetOutcome = toNode ? toNode.outcome : "SUCCESS";
        edgeStyle = this.getEdgeStyle(targetOutcome);
      }

      edgeDeclarations.push(`${edge.from} -- "${edge.from.includes("tool_use") ? "Calls" : "Follows"} (${toNode?.outcome || "N/A"})" --> ${edge.to}${edgeStyle}`);
    });

    // 3. Assemble Final Mermaid String
    mermaidGraph += nodeDeclarations.join('\n') + "\n";
    mermaidGraph += edgeDeclarations.join('\n');

    return mermaidGraph;
  }
}

export { ToolCallDependencyGraphVisualizer };
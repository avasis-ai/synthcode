import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface ToolCallDependencyGraphConfig {
  messages: Message[];
  enableConditionalEdges?: boolean;
}

export interface ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(config: ToolCallDependencyGraphConfig): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV136Enhanced implements ToolCallDependencyGraphVisualizer {
  generateMermaidGraph(config: ToolCallDependencyGraphConfig): string {
    const { messages, enableConditionalEdges = true } = config;

    if (!messages || messages.length === 0) {
      return "graph TD; A[No messages provided]";
    }

    let mermaidGraph = "graph TD;\n";
    const nodes: Map<string, string> = new Map();
    const edges: { from: string; to: string; condition?: string }[] = [];

    const getNodeLabel = (message: Message, index: number): string => {
      const nodeId = `M${index}`;
      let label = "";

      if (message.role === "user") {
        label = `User Input ${index}`;
      } else if (message.role === "assistant") {
        const toolUses = (message as any).content?.filter((block: ContentBlock) => block.type === "tool_use") as ToolUseBlock[];
        if (toolUses.length > 0) {
          const toolNames = toolUses.map(t => t.name).join(", ");
          label = `Assistant (Tools: ${toolNames})`;
        } else {
          label = `Assistant Response ${index}`;
        }
      } else if (message.role === "tool") {
        label = `Tool Result (${message.tool_use_id})`;
      }

      nodes.set(nodeId, `${nodeId["${label}"](${label})}`);
      return nodeId;
    };

    messages.forEach((message, index) => {
      const nodeId = getNodeLabel(message, index);
    });

    // Simple dependency edges (sequential flow)
    for (let i = 0; i < messages.length - 1; i++) {
      const fromNode = `M${i}`;
      const toNode = `M${i + 1}`;
      edges.push({ from: fromNode, to: toNode });
    }

    // Conditional/Tool Call Edges (Simplified logic for demonstration)
    // In a real scenario, this would parse structured tool call metadata.
    if (messages.length > 1 && messages[0].role === "user" && messages[1].role === "assistant") {
      const userNodeId = "M0";
      const assistantNodeId = "M1";

      // Simulate a conditional branch from Assistant to Tool Result
      if (messages[2] && messages[2].role === "tool") {
        edges.push({
          from: assistantNodeId,
          to: "M2",
          condition: "Success Path"
        });
      }
    }

    // Build Mermaid Graph Definition
    let nodeDefinitions = Array.from(nodes.values()).join('\n');
    mermaidGraph += nodeDefinitions + "\n";

    // Build Edges
    let edgeDefinitions = "";
    edges.forEach((edge, index) => {
      let edgeStr = `${edge.from} --> ${edge.to}`;
      if (edge.condition) {
        // Use linkStyle or custom label for condition visualization
        edgeStr = `${edge.from} -- "${edge.condition}" --> ${edge.to}`;
      }
      edgeDefinitions += `${edgeStr};\n`;
    });

    mermaidGraph += edgeDefinitions;

    if (enableConditionalEdges) {
      mermaidGraph += "\n%% Style for Conditional Edges (Conceptual LinkStyle)\n";
      mermaidGraph += "linkStyle 10 stroke-width:2px,stroke:red,fill:none;\n";
    }

    return mermaidGraph;
  }
}
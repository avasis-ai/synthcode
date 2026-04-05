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

interface DependencyGraphConfig {
  messages: Message[];
  mermaidGraphType: "graph TD";
}

interface ToolCallDependencyGraphVisualizer {
  generateMermaid(config: DependencyGraphConfig): string;
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV122 implements ToolCallDependencyGraphVisualizer {
  generateMermaid(config: DependencyGraphConfig): string {
    let mermaidCode = `graph TD\n`;
    mermaidCode += `%% Advanced Tool Call Dependency Graph Visualization v1.2.2\n`;
    mermaidCode += `%% Nodes represent messages or tool calls.\n`;
    mermaidCode += `%% Edges represent flow or dependency.\n\n`;

    const nodes: Map<string, string> = new Map();
    const edges: string[] = [];

    const getNodeId = (message: Message, index: number): string => {
      const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
      return `${prefix}-${index}`;
    };

    const addNode = (id: string, label: string, style: string = "") => {
      nodes.set(id, `    ${id}["${label}"]${style}`);
    };

    const addEdge = (fromId: string, toId: string, label: string = "") => {
      edges.push(`${fromId} -->|${label}| ${toId}`);
    };

    // 1. Process Messages to create nodes and initial flow
    let lastNodeId: string | null = null;
    for (let i = 0; i < config.messages.length; i++) {
      const message = config.messages[i];
      const nodeId = getNodeId(message, i);

      if (message.role === "user") {
        addNode(nodeId, `User Input: "${message.content.substring(0, 30)}..."`, "style fill:#ccf,stroke:#333");
      } else if (message.role === "assistant") {
        let contentLabel = "Assistant Response";
        if (message.content.length > 0) {
          contentLabel = `Response: "${message.content.substring(0, 30)}..."`;
        }
        addNode(nodeId, contentLabel, "style fill:#cfc,stroke:#333");
      } else if (message.role === "tool") {
        const toolResult = message as ToolResultMessage;
        let label = `Tool Result: ${toolResult.tool_use_id}`;
        if (toolResult.is_error) {
          label += " (ERROR)";
        }
        addNode(nodeId, label, "style fill:#fcc,stroke:#c00");
      }

      if (lastNodeId) {
        addEdge(lastNodeId, nodeId, "Continues To");
      }
      lastNodeId = nodeId;
    }

    // 2. Advanced Logic: Extract Tool Calls and Dependencies (Simulated)
    // This section simulates finding tool calls within assistant messages
    let toolCallIndex = 0;
    for (let i = 1; i < config.messages.length - 1; i++) {
      const message = config.messages[i];
      if (message.role === "assistant" && message.content.length > 0) {
        // Simplified check: Assume the first tool use block found is the primary dependency trigger
        const toolUseBlock = message.content.find(block => block.type === "tool_use") as ToolUseBlock;
        if (toolUseBlock) {
          const toolCallId = `T${toolCallIndex++}`;
          const toolCallNodeId = `${toolCallId}-call`;
          
          addNode(toolCallNodeId, `Call: ${toolUseBlock.name}`, "style fill:#ff9,stroke:#aa0");
          
          // Link Assistant -> Tool Call
          const assistantNodeId = getNodeId(message, i);
          addEdge(assistantNodeId, toolCallNodeId, "Requires Tool");

          // Simulate the dependency flow: Tool Call -> Tool Execution Result
          const toolResultNodeId = `${toolCallId}-result`;
          addNode(toolResultNodeId, `Result for ${toolUseBlock.name}`, "style fill:#ddd,stroke:#666");
          addEdge(toolCallNodeId, toolResultNodeId, "Executes");
        }
      }
    }

    // 3. Assemble Mermaid Code
    let nodeDeclarations = Array.from(nodes.values()).join('\n');
    let edgeDeclarations = edges.join('\n');

    mermaidCode += `${nodeDeclarations}\n`;
    mermaidCode += `${edgeDeclarations}\n`;

    return mermaidCode;
  }
}

export const createToolCallDependencyGraphVisualizerAdvancedV122 = (): ToolCallDependencyGraphVisualizer => {
  return new ToolCallDependencyGraphVisualizerMermaidAdvancedV122();
};
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

interface AdvancedGraphConfig {
  defaultGraphType?: "graph TD" | "graph LR";
  style?: {
    node: Record<string, string>;
    edge: Record<string, string>;
  };
  toolCallNodes?: Record<string, {
    label: string;
    style?: string;
  }>;
  dependencyEdges?: Record<string, {
    source: string;
    target: string;
    label?: string;
    style?: string;
  }>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV4 {
  private config: AdvancedGraphConfig;

  constructor(config: AdvancedGraphConfig = {}) {
    this.config = {
      defaultGraphType: "graph TD",
      style: {
        node: {},
        edge: {},
      },
      toolCallNodes: {},
      dependencyEdges: {},
      ...config,
    };
  }

  private getNodeStyle(nodeId: string, role: "user" | "assistant" | "tool"): string {
    const baseStyle = this.config.style?.node?.[role] || "";
    if (role === "user") return `fill:#ccf,stroke:#333,stroke-width:2px,${baseStyle}`;
    if (role === "assistant") return `fill:#cff,stroke:#333,stroke-width:2px,${baseStyle}`;
    if (role === "tool") return `fill:#ffc,stroke:#333,stroke-width:2px,${baseStyle}`;
    return "";
  }

  private getToolCallNodeStyle(toolId: string): string {
    const customStyle = this.config.toolCallNodes?.[toolId]?.style;
    return customStyle || `fill:#eee,stroke:#666,stroke-width:1px`;
  }

  private processMessageToNodes(messages: Message[]): {
    nodes: Record<string, string>;
    edges: { source: string; target: string; label?: string; style?: string }[];
  } {
    const nodes: Record<string, string> = {};
    const edges: { source: string; target: string; label?: string; style?: string }[] = [];
    let nodeIdCounter = 1;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let currentId: string;

      if (message.role === "user") {
        currentId = `user${i}`;
        nodes[currentId] = `User Input: ${message.content.substring(0, 30)}...`;
      } else if (message.role === "assistant") {
        currentId = `assistant${i}`;
        nodes[currentId] = `Assistant Response: ${message.content.length} blocks`;
        const toolUses: ToolUseBlock[] = (message.content as any[]).filter(
          (block: any) => block.type === "tool_use"
        ) as ToolUseBlock[];

        if (toolUses.length > 0) {
          toolUses.forEach((toolUse, index) => {
            const toolId = `toolUse_${i}_${index}`;
            nodes[toolId] = `Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`;
            // Link assistant to tool use
            edges.push({
              source: `assistant${i}`,
              target: toolId,
              label: "Calls",
              style: "stroke:blue,stroke-width:2px",
            });
          });
        }
      } else if (message.role === "tool") {
        const toolId = `toolResult_${message.tool_use_id}`;
        nodes[toolId] = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
        // Link previous tool use/assistant to tool result
        const previousAssistantId = `assistant${i - 1}`;
        if (previousAssistantId && nodes[previousAssistantId]) {
          edges.push({
            source: previousAssistantId,
            target: toolId,
            label: "Receives Result",
            style: "stroke:green,stroke-width:2px",
          });
        }
      }
    }

    return { nodes, edges };
  }

  public generateMermaidGraph(messages: Message[]): string {
    const { nodes: messageNodes, edges: messageEdges } = this.processMessageToNodes(messages);

    const finalNodes: Record<string, string> = { ...messageNodes };
    const finalEdges: { source: string; target: string; label?: string; style?: string }[] = [...messageEdges];

    // Merge advanced tool call nodes and edges
    Object.entries(this.config.toolCallNodes || {}).forEach(([toolId, { label, style }]) => {
      finalNodes[toolId] = label;
    });

    Object.entries(this.config.dependencyEdges || {}).forEach(([key, { source, target, label, style }]) => {
      finalEdges.push({ source, target, label, style });
    });

    // 1. Graph Definition
    let mermaid = `${this.config.defaultGraphType} Graph`;

    // 2. Styling (CSS/Class definitions)
    let styleDefinitions = `classDef userStyle fill:#ccf,stroke:#333,stroke-width:2px;`;
    styleDefinitions += `classDef assistantStyle fill:#cff,stroke:#333,stroke-width:2px;`;
    styleDefinitions += `classDef toolStyle fill:#ffc,stroke:#333,stroke-width:2px;`;

    // 3. Node Definitions (ID[Label])
    let nodeDefinitions = "";
    Object.keys(finalNodes).forEach((id) => {
      let label = finalNodes[id];
      let styleClass = "";

      if (id.startsWith("user")) {
        styleClass = "userStyle";
      } else if (id.startsWith("assistant")) {
        styleClass = "assistantStyle";
      } else if (id.startsWith("toolResult")) {
        styleClass = "toolStyle";
      } else if (this.config.toolCallNodes?.[id]) {
        styleClass = "toolCallStyle";
      }

      nodeDefinitions += `${id}["${label}"]:::${styleClass};\n`;
    });

    // 4. Edge Definitions (Source -- Label --> Target)
    let edgeDefinitions = "";
    finalEdges.forEach((edge) => {
      edgeDefinitions += `${edge.source} -- "${edge.label || ''}" --> ${edge.target}`;
      if (edge.style) {
        edgeDefinitions += ` ${edge.style}`;
      }
      edgeDefinitions += ";\n";
    });

    // 5. Assembly
    mermaid += `\n%% --- Node Definitions ---\n`;
    mermaid += `${nodeDefinitions.trim()}\n`;

    mermaid += `\n%% --- Edge Definitions ---\n`;
    mermaid += `${edgeDefinitions.trim()}\n`;

    mermaid += `\n%% --- Styling Hooks (Advanced) ---\n`;
    mermaid += `${styleDefinitions}\n`;

    return mermaid;
  }
}
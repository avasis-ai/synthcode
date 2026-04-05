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

export interface GraphConfig {
  graphType: "graph TD" | "graph LR";
  nodes: Record<string, {
    label: string;
    style?: Record<string, string>;
    class?: string;
  }>;
  edges: {
    from: string;
    to: string;
    label?: string;
    style?: Record<string, string>;
  }[];
  layoutOptions?: {
    rankDir: "LR" | "TB";
    subgraphGrouping: string[];
  };
}

export interface ToolCallDependencyGraphVisualizer {
  generateMermaidCode(
    messages: Message[],
    config?: Partial<GraphConfig>
  ): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV112 implements ToolCallDependencyGraphVisualizer {
  generateMermaidCode(
    messages: Message[],
    config?: Partial<GraphConfig>
  ): string {
    const defaultConfig: GraphConfig = {
      graphType: "graph TD",
      nodes: {},
      edges: [],
    };

    const finalConfig: GraphConfig = {
      ...defaultConfig,
      ...(config as Partial<GraphConfig>),
    };

    let mermaidCode = `${finalConfig.graphType}\n`;

    // 1. Define Nodes
    const nodeDefinitions: Record<string, string> = {};
    const nodeStyles: Record<string, string> = {};

    const processMessage = (message: Message, index: number): {
      nodeId: string;
      label: string;
      style?: Record<string, string>;
    } => {
      let nodeId: string;
      let label: string;
      let style: Record<string, string> = {};

      if (message.role === "user") {
        nodeId = `U${index}`;
        label = `User Input: ${message.content.substring(0, 30)}...`;
        style = { fill: "#E6E6FA", color: "#333" };
      } else if (message.role === "assistant") {
        nodeId = `A${index}`;
        let contentSummary = message.content.map(block => {
          if (block.type === "text") return block.text.substring(0, 20) + "...";
          if (block.type === "tool_use") return `Tool Call: ${block.name}`;
          if (block.type === "thinking") return `Thinking: ${block.thinking.substring(0, 20)}...`;
          return "";
        }).join(" | ");
        label = `Assistant Response\n(${contentSummary})`;
        style = { fill: "#ADD8E6", color: "#333" };
      } else if (message.role === "tool") {
        nodeId = `T${index}`;
        const isError = (message as ToolResultMessage).is_error ?? false;
        const resultLabel = isError ? `ERROR: ${message.content.substring(0, 20)}...` : `Result: ${message.content.substring(0, 20)}...`;
        label = `Tool Result (${message.tool_use_id})\n${resultLabel}`;
        style = { fill: isError ? "#FFB6C1" : "#90EE90", color: "#333" };
      } else {
        nodeId = `Unknown${index}`;
        label = `Unknown Message Type`;
      }

      return { nodeId, label, style };
    };

    const processedNodes = messages.map((msg, index) => processMessage(msg, index));

    // Merge processed nodes with config nodes
    const allNodes: Record<string, { label: string; style?: Record<string, string>; class?: string }> = {
      ...finalConfig.nodes,
    };

    processedNodes.forEach((pNode, index) => {
      const nodeId = pNode.nodeId;
      if (!allNodes[nodeId]) {
        allNodes[nodeId] = {
          label: pNode.label,
          style: pNode.style,
          class: undefined,
        };
      } else {
        // Merge dynamic label/style if config node exists but is less detailed
        allNodes[nodeId] = {
          label: pNode.label,
          style: pNode.style || allNodes[nodeId].style,
          class: allNodes[nodeId].class,
        };
      }
    });

    // 2. Build Node Declarations
    Object.entries(allNodes).forEach(([id, node]) => {
      let nodeDef = `${id}["${node.label.replace(/"/g, "'")}"]`;
      if (node.style) {
        const styleString = Object.entries(node.style)
          .map(([key, value]) => `${key}:${value}`)
          .join("; ");
        nodeDef += ` style="${styleString}"`;
      }
      if (node.class) {
        nodeDef += ` class="${node.class}"`;
      }
      nodeDefinitions[id] = nodeDef;
    });

    // 3. Build Edge Declarations
    const edgeDeclarations: string[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i];
      const nextMsg = messages[i + 1];

      const currentId = processMessage(currentMsg, i).nodeId;
      const nextId = processMessage(nextMsg, i + 1).nodeId;

      let edgeLabel = "";
      let edgeStyle: Record<string, string> | undefined = undefined;

      if (currentMsg.role === "user" && nextMsg.role === "assistant") {
        edgeLabel = "Initiates Tool Use";
        edgeStyle = { stroke: "blue", stroke-width: "2px" };
      } else if (currentMsg.role === "assistant" && nextMsg.role === "tool") {
        edgeLabel = "Calls Tool";
        edgeStyle = { stroke: "orange", stroke-width: "2px" };
      } else if (currentMsg.role === "tool" && nextMsg.role === "assistant") {
        edgeLabel = "Processes Result";
        edgeStyle = { stroke: "green", stroke-width: "2px" };
      } else {
        edgeLabel = "Continues";
      }

      const edgeDef = `${currentId} -->|${edgeLabel}| ${nextId}`;
      if (edgeStyle) {
        const styleString = Object.entries(edgeStyle)
          .map(([key, value]) => `${key}:${value}`)
          .join("; ");
        const styledEdgeDef = `${edgeDef} style="${styleString}"`;
        edgeDeclarations.push(styledEdgeDef);
      } else {
        edgeDeclarations.push(edgeDef);
      }
    }

    // 4. Assemble Final Code
    let finalCode = "";
    finalCode += "%% Mermaid Tool Call Dependency Graph\n";
    finalCode += `graph ${finalConfig.graphType}\n`;

    // Add node definitions
    Object.values(nodeDefinitions).forEach(def => {
      finalCode += `${def};\n`;
    });

    // Add edge definitions
    edgeDeclarations.forEach(def => {
      finalCode += `${def};\n`;
    });

    // Add layout directives if provided
    if (finalConfig.layoutOptions) {
      finalCode += `%% Layout Directives\n`;
      if (finalConfig.layoutOptions.rankDir) {
        finalCode += `rank-direction ${finalConfig.layoutOptions.rankDir};\n`;
      }
    }

    return finalCode.trim();
  }
}
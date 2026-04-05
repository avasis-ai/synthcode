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

export interface AdvancedGraphOptions extends GraphOptions {
  nodeStyles?: Record<string, {
    style: string;
    class?: string;
  }>;
  edgeStyles?: Record<string, {
    style: string;
    class?: string;
  }>;
  defaultLayout?: "LR" | "TD";
}

export interface GraphOptions {
  title: string;
  direction?: "LR" | "TD";
  defaultLayout?: "LR" | "TD";
}

type NodeId = string;

export function generateToolCallDependencyGraphMermaid(
  messages: Message[],
  options: AdvancedGraphOptions = {}
): string {
  const {
    title,
    direction: graphDirection = "TD",
    defaultLayout = "TD",
    nodeStyles = {},
    edgeStyles = {},
  } = options;

  const graphTitle = title || "Tool Call Dependency Graph";
  const graph = new Map<NodeId, {
    node: string;
    elements: {
      id: NodeId;
      type: "user" | "assistant" | "tool";
      content: string;
      block: ContentBlock | null;
    }[];
  }>();

  const processMessage = (message: Message, role: "user" | "assistant" | "tool") => {
    if (!graph.has(role)) {
      graph.set(role, { node: `${role}Node`, elements: [] });
    }
    const nodeData = graph.get(role)!;

    if (role === "user") {
      const userMsg = message as UserMessage;
      nodeData.elements.push({
        id: `user_${Date.now()}_${Math.random()}`,
        type: "user",
        content: userMsg.content,
        block: null,
      });
    } else if (role === "assistant") {
      const assistantMsg = message as AssistantMessage;
      let content = "";
      let block: ContentBlock | null = null;
      if (assistantMsg.content.length > 0) {
        content = assistantMsg.content.map(block => {
          if (block.type === "text") return (block as TextBlock).text;
          if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            return `Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`;
          }
          if (block.type === "thinking") {
            return `Thinking: ${block.thinking}`;
          }
          return "";
        }).join("\n");
        block = assistantMsg.content.length > 0 ? assistantMsg.content[0] : null;
      }
      nodeData.elements.push({
        id: `assistant_${Date.now()}_${Math.random()}`,
        type: "assistant",
        content: content,
        block: block,
      });
    } else if (role === "tool") {
      const toolMsg = message as ToolResultMessage;
      nodeData.elements.push({
        id: `tool_${Date.now()}_${Math.random()}`,
        type: "tool",
        content: toolMsg.content,
        block: null,
      });
    }
  };

  messages.forEach((msg, index) => {
    let role: "user" | "assistant" | "tool";
    if ("user" === (msg as any).role) {
      role = "user";
    } else if ("assistant" === (msg as any).role) {
      role = "assistant";
    } else if ("tool" === (msg as any).role) {
      role = "tool";
    } else {
      return;
    }
    processMessage(msg, role);
  });

  let mermaidGraph = `graph ${graphDirection} ${graphTitle} {\n`;
  let nodeDefinitions: string[] = [];
  let edgeDefinitions: string[] = [];

  const getStyle = (type: "user" | "assistant" | "tool", elementId: string) => {
    const styleKey = `${type}-${elementId}`;
    if (nodeStyles[styleKey]) {
      return nodeStyles[styleKey].style;
    }
    return "";
  };

  const getNodeDefinition = (role: "user" | "assistant" | "tool", elements: { id: NodeId; type: "user" | "assistant" | "tool"; content: string; block: ContentBlock | null }[]) => {
    const nodeIds = elements.map(e => e.id);
    const nodeLabels = elements.map(e => {
      let label = e.content.substring(0, 50) + (e.content.length > 50 ? "..." : "");
      if (e.type === "tool") {
        label = `Tool Result: ${e.content.substring(0, 30)}...`;
      }
      return `${e.id}["${label}"]`;
    }).join("\n");

    const nodeStyle = elements.map(e => {
      const style = getStyle(e.type, e.id);
      return `${e.id}${style ? ` style="${style}"` : ""}`;
    }).join(", ");

    return `  ${nodeIds.join(", ")} { ${nodeStyle} }`;
  };

  graph.forEach((data, role) => {
    const roleType = role as "user" | "assistant" | "tool";
    nodeDefinitions.push(getNodeDefinition(roleType, data.elements));
  });

  mermaidGraph += nodeDefinitions.join("\n") + "\n";

  // Simple dependency edge generation (User -> Assistant -> Tool)
  let lastNodeId: NodeId | null = null;
  let currentRole: "user" | "assistant" | "tool" | null = null;

  for (const [role, data] of graph.entries()) {
    const roleType = role as "user" | "assistant" | "tool";
    data.elements.forEach((element, index) => {
      const nodeId = element.id;
      const elementRole = element.type;

      if (index > 0) {
        // Connect sequential elements within the same role group (if applicable)
        const prevElement = data.elements[index - 1];
        edgeDefinitions.push(`${prevElement.id} --> ${nodeId}`);
      }

      if (lastNodeId && lastNodeId !== nodeId) {
        // Connect the last element of the previous role to the first element of the current role
        edgeDefinitions.push(`${lastNodeId} --> ${nodeId}`);
      }

      lastNodeId = nodeId;
      currentRole = elementRole;
    });
  }

  mermaidGraph += "\n";
  mermaidGraph += edgeDefinitions.join("\n") + "\n";

  // Apply global styling if necessary (placeholder for advanced layout)
  if (options.defaultLayout) {
    mermaidGraph += `\n%% Graph Layout Hint: ${options.defaultLayout} (Mermaid handles this via direction)\n`;
  }

  return mermaidGraph.trim();
}
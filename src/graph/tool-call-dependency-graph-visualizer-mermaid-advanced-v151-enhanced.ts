import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export enum FlowEdgeType {
  SEQUENTIAL = "-->",
  CONDITIONAL = "---{if}-->",
  ASYNC_MESSAGE = "~~~>+",
  STATE_TRANSITION = "===>",
}

export interface ToolCallDependencyGraph {
  nodes: string[];
  edges: {
    source: string;
    target: string;
    type: FlowEdgeType;
    label?: string;
    details?: Record<string, unknown>;
  }[];
}

export class ToolCallDependencyGraphVisualizer {
  private graph: ToolCallDependencyGraph = {
    nodes: [],
    edges: [],
  };

  private messageToNodeId(message: Message): string {
    if ("user" === (message as UserMessage).role) {
      return `User:${message.content.substring(0, 10).replace(/\s/g, '_')}`;
    }
    if ("assistant" === (message as AssistantMessage).role) {
      return `Assistant:${message.content.length}`;
    }
    if ("tool" === (message as ToolResultMessage).role) {
      return `Tool:${(message as ToolResultMessage).tool_use_id}`;
    }
    return "Unknown";
  }

  private extractToolCallId(message: Message): string | null {
    if ("assistant" === (message as AssistantMessage).role) {
      const toolUseBlock = (message as AssistantMessage).content.find(
        (block) => (block as ToolUseBlock).type === "tool_use"
      );
      if (toolUseBlock) {
        return toolUseBlock.id;
      }
    }
    return null;
  }

  private buildGraph(messages: Message[]): ToolCallDependencyGraph {
    const nodes: Set<string> = new Set();
    const edges: {
      source: string;
      target: string;
      type: FlowEdgeType;
      label?: string;
      details?: Record<string, unknown>;
    }[] = [];

    for (let i = 0; i < messages.length; i++) {
      const currentMessage = messages[i];
      const sourceNodeId = this.messageToNodeId(currentMessage);
      nodes.add(sourceNodeId);

      if (i > 0) {
        const previousMessage = messages[i - 1];
        const previousNodeId = this.messageToNodeId(previousMessage);

        let edgeType: FlowEdgeType = FlowEdgeType.SEQUENTIAL;
        let edgeLabel: string | undefined = undefined;

        if (currentMessage.role === "tool" && previousMessage.role === "assistant") {
          edgeType = FlowEdgeType.ASYNC_MESSAGE;
          edgeLabel = "Tool Result Received";
        } else if (currentMessage.role === "user" && previousMessage.role === "assistant") {
          edgeType = FlowEdgeType.CONDITIONAL;
          edgeLabel = "User Follow-up";
        } else if (currentMessage.role === "tool" && previousMessage.role === "tool") {
          edgeType = FlowEdgeType.STATE_TRANSITION;
          edgeLabel = "State Update";
        }

        edges.push({
          source: previousNodeId,
          target: sourceNodeId,
          type: edgeType,
          label: edgeLabel,
        });
      }
    }

    return {
      nodes: Array.from(nodes),
      edges: edges,
    };
  }

  public visualizeMermaid(messages: Message[]): string {
    const graph = this.buildGraph(messages);

    let mermaidCode = "graph TD;\n";

    // Define Nodes (Simplified for Mermaid structure)
    graph.nodes.forEach((nodeId) => {
      mermaidCode += `    ${nodeId}["${nodeId.replace(/[:\s]/g, '')}"]\n`;
    });

    // Define Edges with advanced styling
    graph.edges.forEach((edge, index) => {
      let style = "";
      let linkSyntax = "";

      switch (edge.type) {
        case FlowEdgeType.SEQUENTIAL:
          style = "-->";
          linkSyntax = `${edge.source} --> ${edge.target}`;
          break;
        case FlowEdgeType.CONDITIONAL:
          style = "---{if}-->";
          linkSyntax = `${edge.source} -- ${edge.label || "Condition"} --> ${edge.target}`;
          break;
        case FlowEdgeType.ASYNC_MESSAGE:
          style = "~~~>+";
          linkSyntax = `${edge.source} ${style} ${edge.target} [${edge.label || "Async Flow"}]`;
          break;
        case FlowEdgeType.STATE_TRANSITION:
          style = "===>";
          linkSyntax = `${edge.source} ${style} ${edge.target} [${edge.label || "State Change"}]`;
          break;
      }

      // Mermaid syntax requires careful handling of labels and styles
      if (edge.label) {
        if (edge.type === FlowEdgeType.CONDITIONAL) {
          mermaidCode += `    ${linkSyntax.replace(/--/g, '')} --> ${edge.target} [${edge.label}];\n`;
        } else if (edge.type === FlowEdgeType.ASYNC_MESSAGE) {
          mermaidCode += `    ${linkSyntax}\n`;
        } else if (edge.type === FlowEdgeType.STATE_TRANSITION) {
          mermaidCode += `    ${linkSyntax}\n`;
        } else {
          mermaidCode += `    ${linkSyntax}\n`;
        }
      } else {
        mermaidCode += `    ${linkSyntax}\n`;
      }
    });

    return mermaidCode;
  }
}
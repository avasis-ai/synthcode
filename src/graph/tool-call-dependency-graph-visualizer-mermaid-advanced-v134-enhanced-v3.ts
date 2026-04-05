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

interface StyleConfig {
  nodeClasses?: Record<string, string>;
  edgeStyles?: Record<string, string>;
  defaultNodeClass?: string;
  defaultEdgeStyle?: string;
}

interface AdvancedGraphConfig extends StyleConfig {
  graphTitle?: string;
  mermaidDirectives?: string[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3 {
  private config: AdvancedGraphConfig;

  constructor(config: AdvancedGraphConfig = {}) {
    this.config = {
      nodeClasses: {},
      edgeStyles: {},
      defaultNodeClass: "defaultNode",
      defaultEdgeStyle: "defaultEdge",
      graphTitle: undefined,
      mermaidDirectives: [],
    };
    Object.assign(this.config, config);
  }

  private getNodeLabel(message: Message): string {
    if ("user" === (message as UserMessage).role) {
      return "User Input";
    }
    if ("assistant" === (message as AssistantMessage).role) {
      return "Assistant Response";
    }
    if ("tool" === (message as ToolResultMessage).role) {
      return `Tool Result (${(message as ToolResultMessage).tool_use_id.substring(0, 4)}...)`;
    }
    return "Unknown";
  }

  private getToolCallNodeId(message: AssistantMessage): string {
    const toolUseBlock = (message as AssistantMessage).content.find(
      (block) => (block as ToolUseBlock).type === "tool_use"
    );
    if (toolUseBlock) {
      return `tool_${toolUseBlock.id}`;
    }
    return "unknown_tool";
  }

  private generateNodeSyntax(
    message: Message,
    nodeId: string,
    isToolCall: boolean,
  ): string {
    const baseClass = this.config.nodeClasses[
      message.role || "default"
    ] || this.config.defaultNodeClass || "";
    const specificClass = isToolCall ? "toolCallNode" : "";

    return `  ${nodeId}[\"${this.getNodeLabel(message)}\" ${baseClass} ${specificClass}]`;
  }

  private generateEdgeSyntax(
    fromMessage: Message,
    toMessage: Message,
    fromId: string,
    toId: string,
    isToolCall: boolean,
  ): string {
    const edgeStyle = this.config.edgeStyles[
      isToolCall ? "tool_call_edge" : "default_edge"
    ] || this.config.defaultEdgeStyle || "";

    return `  ${fromId} -->|${isToolCall ? "Calls" : "Follows"}| ${toId} ${edgeStyle}`;
  }

  public visualize(
    messages: Message[],
    toolCallDependencies: {
      fromMessage: Message;
      toMessage: Message;
      toolUseId: string;
    }[] | null,
  ): string {
    let mermaid = ["graph TD"];

    if (this.config.graphTitle) {
      mermaid.push(`%% Title: ${this.config.graphTitle}`);
    }

    const nodeIds: Record<string, string> = {};
    const nodes: string[] = [];

    // 1. Process Messages for Nodes
    messages.forEach((message, index) => {
      const nodeId = `msg_${index}`;
      nodeIds[nodeId] = message.role || "unknown";
      nodes.push(this.generateNodeSyntax(message, nodeId, false));
    });

    // 2. Process Tool Calls for Specific Nodes
    const toolCallNodes: string[] = [];
    const toolCallIdMap: Record<string, string> = {};

    if (toolCallDependencies && toolCallDependencies.length > 0) {
      toolCallDependencies.forEach((dep, index) => {
        const toolNodeId = `tool_${dep.toolUseId}`;
        toolCallIdMap[dep.toolUseId] = toolNodeId;
        toolCallNodes.push(
          this.generateNodeSyntax(
            { role: "tool", content: "Tool Call Placeholder" } as Message,
            toolNodeId,
            true,
          )
        );
      });
    }

    // Combine all nodes
    const allNodes = [...nodes, ...toolCallNodes];
    mermaid.push(...allNodes);

    // 3. Process Edges (Dependencies)
    if (toolCallDependencies && toolCallDependencies.length > 0) {
      const edges: string[] = [];
      toolCallDependencies.forEach((dep, index) => {
        const fromMsg = dep.fromMessage;
        const toMsg = dep.toMessage;
        const toolNodeId = `tool_${dep.toolUseId}`;

        // Edge from Source Message -> Tool Call Node
        edges.push(
          this.generateEdgeSyntax(
            fromMsg,
            { role: "tool", content: "Tool Call Placeholder" } as Message,
            `msg_${messages.indexOf(fromMsg)}`,
            toolNodeId,
            true,
          )
        );

        // Edge from Tool Call Node -> Target Message (if applicable)
        if (toMsg) {
          edges.push(
            this.generateEdgeSyntax(
              { role: "tool", content: "Tool Result Placeholder" } as Message,
              toMsg,
              toolNodeId,
              `msg_${messages.indexOf(toMsg)}`,
              false,
            )
          );
        }
      });
      mermaid.push(...edges);
    }

    // 4. Inject Custom Directives
    if (this.config.mermaidDirectives && this.config.mermaidDirectives.length > 0) {
      mermaid.push(...this.config.mermaidDirectives);
    }

    return mermaid.join("\n");
  }

  public injectCustomDirective(directive: string): void {
    this.config.mermaidDirectives = [...(this.config.mermaidDirectives || []), directive];
  }

  public withStyle(style: Partial<StyleConfig>): ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3 {
    const newConfig: AdvancedGraphConfig = {
      nodeClasses: { ...this.config.nodeClasses, ...(style.nodeClasses || {}) },
      edgeStyles: { ...this.config.edgeStyles, ...(style.edgeStyles || {}) },
      defaultNodeClass: style.defaultNodeClass || this.config.defaultNodeClass,
      defaultEdgeStyle: style.defaultEdgeStyle || this.config.defaultEdgeStyle,
      graphTitle: style.graphTitle || this.config.graphTitle,
      mermaidDirectives: [...(this.config.mermaidDirectives || []), ...(style.mermaidDirectives || [])],
    };
    return new ToolCallDependencyGraphVisualizerMermaidAdvancedV134EnhancedV3(newConfig);
  }
}
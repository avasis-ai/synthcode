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

export interface AdvancedGraphOptions {
  /**
   * Global styling directives to apply to the Mermaid graph container.
   * E.g., "classDef default fill:#f9f,stroke:#333,stroke-width:2px;"
   */
  globalDirectives?: string;
  /**
   * Custom styling for specific node types.
   * Key: Node ID/Type, Value: CSS class definition string.
   * E.g., { "user_node": "classDef user fill:#ccf,stroke:#333;" }
   */
  nodeStyleOverrides?: Record<string, string>;
  /**
   * Custom styling for specific edge types.
   * E.g., { "tool_call_edge": "classDef toolCall stroke-dasharray: 5 5;" }
   */
  edgeStyleOverrides?: Record<string, string>;
}

export class ToolCallDependencyGraphVisualizer {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      globalDirectives: "",
      nodeStyleOverrides: {},
      edgeStyleOverrides: {},
      ...options,
    };
  }

  private generateNodeId(message: Message, index: number): string {
    const role = message.role === "user" ? "user" : (message.role === "assistant" ? "assistant" : "tool");
    const uniqueId = `${role}_msg_${index}`;
    return uniqueId;
  }

  private generateNodeContent(message: Message): string {
    if (message.role === "user") {
      return message.content.text;
    }
    if (message.role === "assistant") {
      const blocks = message.content;
      let content = "";
      for (const block of blocks) {
        if (block.type === "text") {
          content += block.text;
        } else if (block.type === "tool_use") {
          content += `\n[Tool Call: ${block.name}(${JSON.stringify(block.input)})]`;
        } else if (block.type === "thinking") {
          content += `\n[Thinking: ${block.thinking}]`;
        }
      }
      return content;
    }
    if (message.role === "tool") {
      return `Tool Result (${message.tool_use_id}): ${message.content}`;
    }
    return "";
  }

  private buildMermaidGraph(messages: Message[]): { graph: string; classDef: string } {
    let graphBuilder = "graph TD\n";
    let classDefBuilder = "";
    const nodeMap: Map<string, string> = new Map(); // Map<NodeID, NodeLabel>
    const nodeStyleMap: Map<string, string> = new Map(); // Map<NodeID, ClassName>

    // 1. Process Nodes and Collect Directives
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const nodeId = this.generateNodeId(message, i);
      const content = this.generateNodeContent(message);

      let nodeLabel = `ID${i}["${content.replace(/["']/g, "'")}"]`;
      let nodeClass = "";

      if (message.role === "user") {
        nodeClass = "user_node";
      } else if (message.role === "assistant") {
        nodeClass = "assistant_node";
      } else if (message.role === "tool") {
        nodeClass = "tool_result_node";
      }

      nodeMap.set(nodeId, nodeLabel);
      nodeStyleMap.set(nodeId, nodeClass);
    }

    // 2. Process Edges (Dependencies)
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const sourceId = this.generateNodeId(message, i);

      if (message.role === "assistant") {
        const contentBlocks = (message as AssistantMessage).content;
        const toolUses = contentBlocks.filter((block): block is ToolUseBlock =>
          block.type === "tool_use"
        );

        if (toolUses.length > 0) {
          toolUses.forEach((toolUse, toolIndex) => {
            const targetId = `tool_call_${toolUse.id}`;
            const targetNodeLabel = `${targetId}["Tool: ${toolUse.name} (Input: ${JSON.stringify(toolUse.input)})"]`;
            
            // Define the tool call node explicitly
            nodeMap.set(targetId, targetNodeLabel);
            nodeStyleMap.set(targetId, "tool_call_node");

            // Edge from Assistant -> Tool Call
            graphBuilder += `${sourceId} -- Calls --> ${targetId};\n`;
          });
        }
      }
      
      // Simple sequential flow edge (if not already covered by tool calls)
      if (i < messages.length - 1) {
        const nextMessage = messages[i + 1];
        const nextId = this.generateNodeId(nextMessage, i + 1);
        
        // Only draw a simple sequential edge if the next message isn't a direct result of a tool call 
        // that was already linked above, or if the flow is generally linear.
        if (message.role !== "assistant" || (message.role === "assistant" && !((message as AssistantMessage).content?.some((block): block is ToolUseBlock => block.type === "tool_use")))) {
             graphBuilder += `${sourceId} --> ${nextId};\n`;
        }
      }
    }

    // 3. Assemble Final Graph String
    let finalGraph = "";
    
    // Add all defined nodes
    nodeMap.forEach((label, id) => {
        finalGraph += `${id} ${label}\n`;
    });

    // Add all defined edges (already in graphBuilder)
    finalGraph += graphBuilder;

    // 4. Collect and Apply Styling Directives
    let styleDirectives = "";
    
    // A. Global Directives
    if (this.options.globalDirectives) {
      styleDirectives += `%% Global Directives: ${this.options.globalDirectives}\n`;
    }

    // B. Node Overrides
    Object.entries(this.options.nodeStyleOverrides).forEach(([key, value]) => {
      styleDirectives += `class ${key} ${value}\n`;
    });

    // C. Edge Overrides
    Object.entries(this.options.edgeStyleOverrides).forEach(([key, value]) => {
      styleDirectives += `classDef ${key} ${value}\n`;
    });

    return { graph: finalGraph, classDef: styleDirectives };
  }

  /**
   * Generates the Mermaid graph definition string for visualizing tool call dependencies.
   * @param messages Array of conversation messages.
   * @returns {string} The complete Mermaid graph definition string.
   */
  public visualize(messages: Message[]): string {
    if (!messages || messages.length === 0) {
      return "graph TD\nA[No messages provided]";
    }

    const { graph, classDef } = this.buildMermaidGraph(messages);

    return `%% Mermaid Graph Definition (Advanced V2)\n${classDef}\n${graph}`;
  }
}
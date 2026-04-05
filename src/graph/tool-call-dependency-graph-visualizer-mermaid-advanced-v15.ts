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

interface FlowControlMetadata {
  type: "if/else" | "parallel" | "switch";
  inputs: Record<string, string>;
  branches: Record<string, { condition: string; next_node_id: string }>;
  default_next_node_id?: string;
}

interface NodeDefinition {
  id: string;
  message: Message | { flow_control: FlowControlMetadata };
  dependencies: string[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV15 {
  private nodes: Map<string, NodeDefinition> = new Map();

  constructor() {}

  addNode(id: string, message: Message | { flow_control: FlowControlMetadata }, dependencies: string[] = []): void {
    this.nodes.set(id, { id, message, dependencies });
  }

  private getNodeDefinition(id: string): NodeDefinition | undefined {
    return this.nodes.get(id);
  }

  private generateNodeMermaid(node: NodeDefinition): string {
    const { id, message, dependencies } = node;
    let content = "";

    if ("flow_control" in message) {
      const flow = message.flow_control as FlowControlMetadata;
      content = `
        subgraph ${id} [Flow Control: ${flow.type}]
          direction LR
          ${Object.keys(flow.branches).map(key => {
            const branch = flow.branches[key];
            return `  ${key} -->|Condition: ${branch.condition}| ${branch.next_node_id}`;
          }).join('\n')}
          ${flow.default_next_node_id ? `  default -->|Default| ${flow.default_next_node_id}` : ''}
        end
      `;
    } else {
      if ("role" in message) {
        const msg = message as Message;
        if (msg.role === "user") {
          content = `User Input: "${msg.content.substring(0, 30)}..."`;
        } else if (msg.role === "assistant") {
          const contentBlocks = message as AssistantMessage;
          const textContent = contentBlocks.content.map(block => {
            if (block.type === "text") return `Text: "${block.text.substring(0, 30)}..."`;
            if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
            if (block.type === "thinking") return `Thinking: "${block.thinking.substring(0, 30)}..."`;
            return "";
          }).join('\n');
          content = `Assistant Response:\n${textContent}`;
        } else if (msg.role === "tool") {
          const toolMsg = message as ToolResultMessage;
          const errorStatus = toolMsg.is_error ? " (ERROR)" : "";
          content = `Tool Result (${toolMsg.tool_use_id}): ${toolMsg.content}${errorStatus}`;
        }
      }
    }

    return `A[${id}]\n    --> ${content.replace(/\n/g, '\\n')}`;
  }

  private generateDependenciesMermaid(node: NodeDefinition): string {
    const { id, dependencies } = node;
    if (dependencies.length === 0) return "";

    const dependencyLinks = dependencies.map(depId => {
      return `${depId} --> ${id}: Depends on ${depId}`;
    }).join('\n');

    return `\n${dependencyLinks}`;
  }

  public generateMermaidGraph(): string {
    let mermaidCode = "graph TD\n";
    let nodeMermaid = "";
    let dependencyMermaid = "";

    this.nodes.forEach(node => {
      nodeMermaid += this.generateNodeMermaid(node);
      dependencyMermaid += this.generateDependenciesMermaid(node);
    });

    // Combine all parts, ensuring flow control subgraphs are correctly placed
    mermaidCode += "\n%% --- Node Definitions ---\n";
    mermaidCode += nodeMermaid.trim() + "\n";
    mermaidCode += "\n%% --- Dependencies ---\n";
    mermaidCode += dependencyMermaid.trim();

    return mermaidCode;
  }

  public serializeAdvancedGraph(): string {
    let mermaidCode = "graph TD\n";

    this.nodes.forEach(node => {
      const { id, message, dependencies } = node;

      if ("flow_control" in message) {
        const flow = message.flow_control as FlowControlMetadata;
        mermaidCode += `\nsubgraph ${id} [Flow Control: ${flow.type}]\n`;
        mermaidCode += `    direction LR\n`;
        Object.keys(flow.branches).forEach(key => {
          const branch = flow.branches[key];
          mermaidCode += `    ${key} -->|Condition: ${branch.condition}| ${branch.next_node_id}\n`;
        });
        if (flow.default_next_node_id) {
          mermaidCode += `    default -->|Default| ${flow.default_next_node_id}\n`;
        }
        mermaidCode += "end\n";
      } else {
        mermaidCode += `A[${id}]: ${this.generateNodeContent(message)}\n`;
      }

      // Add standard dependencies after the node definition
      if (dependencies.length > 0) {
        const dependencyLinks = dependencies.map(depId => {
          return `${depId} --> ${id}: Depends on ${depId}`;
        }).join('\n');
        mermaidCode += dependencyLinks + "\n";
      }
    });

    return mermaidCode;
  }

  private generateNodeContent(message: Message): string {
    if ("role" in message) {
      const msg = message as Message;
      if (msg.role === "user") {
        return `User Input: "${msg.content.substring(0, 30)}..."`;
      } else if (msg.role === "assistant") {
        const contentBlocks = message as AssistantMessage;
        const textContent = contentBlocks.content.map(block => {
          if (block.type === "text") return `Text: "${block.text.substring(0, 30)}..."`;
          if (block.type === "tool_use") return `Tool Call: ${block.name}(${JSON.stringify(block.input)})`;
          if (block.type === "thinking") return `Thinking: "${block.thinking.substring(0, 30)}..."`;
          return "";
        }).join('\n');
        return `Assistant Response:\n${textContent}`;
      } else if (msg.role === "tool") {
        const toolMsg = message as ToolResultMessage;
        const errorStatus = toolMsg.is_error ? " (ERROR)" : "";
        return `Tool Result (${toolMsg.tool_use_id}): ${toolMsg.content}${errorStatus}`;
      }
    }
    return "Unknown Content";
  }
}
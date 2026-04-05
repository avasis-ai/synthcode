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
  loopMetadata?: {
    sourceNodeId: string;
    targetNodeId: string;
    label: string;
  }[];
  conditionalMetadata?: {
    sourceNodeId: string;
    condition: string;
    targetNodeId: string;
  }[];
}

interface Node {
  id: string;
  type: "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, any>;
}

interface Edge {
  from: string;
  to: string;
  label: string;
  type: "default" | "loop" | "conditional";
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV38 {
  private options: AdvancedGraphOptions;

  constructor(options: AdvancedGraphOptions = {}) {
    this.options = {
      loopMetadata: [],
      conditionalMetadata: [],
      ...options,
    };
  }

  private extractNodes(messages: Message[]): Node[] {
    const nodes: Node[] = [];
    let nodeIdCounter = 1;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let content: string = "";
      let nodeType: "user" | "assistant" | "tool";

      if ("user" === (message as UserMessage).role) {
        nodeType = "user";
        content = (message as UserMessage).content;
      } else if ("assistant" === (message as AssistantMessage).role) {
        nodeType = "assistant";
        content = this.extractAssistantContent(message as AssistantMessage);
      } else if ("tool" === (message as ToolResultMessage).role) {
        nodeType = "tool";
        content = `Tool Result: ${message as ToolResultMessage).content}`;
      } else {
        continue;
      }

      const nodeId = `node${nodeIdCounter++}`;
      nodes.push({
        id: nodeId,
        type: nodeType,
        content: content,
        metadata: { index: i },
      });
    }
    return nodes;
  }

  private extractAssistantContent(message: AssistantMessage): string {
    const blocks: ContentBlock[] = message.content;
    let textContent = "";
    let toolUseContent = "";

    for (const block of blocks) {
      if ("text" === (block as TextBlock).type) {
        textContent += (block as TextBlock).text + "\n";
      } else if ("tool_use" === (block as ToolUseBlock).type) {
        toolUseContent += `Tool Use: ${block as ToolUseBlock).name} with input: ${JSON.stringify((block as ToolUseBlock).input)}\n`;
      } else if ("thinking" === (block as ThinkingBlock).type) {
        textContent += `[Thinking]: ${block as ThinkingBlock).thinking}\n`;
      }
    }
    return `${textContent}${toolUseContent}`;
  }

  private extractEdges(messages: Message[]): Edge[] {
    const edges: Edge[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const fromId = `node${i + 1}`;
      const toId = `node${i + 2}`;
      edges.push({
        from: fromId,
        to: toId,
        label: "->",
        type: "default",
      });
    }
    return edges;
  }

  private processAdvancedEdges(nodes: Node[], edges: Edge[]): Edge[] {
    const advancedEdges: Edge[] = [];

    // 1. Process Loop Edges
    if (this.options.loopMetadata) {
      this.options.loopMetadata.forEach((meta) => {
        advancedEdges.push({
          from: meta.sourceNodeId,
          to: meta.targetNodeId,
          label: meta.label,
          type: "loop",
        });
      });
    }

    // 2. Process Conditional Edges
    if (this.options.conditionalMetadata) {
      this.options.conditionalMetadata.forEach((meta) => {
        advancedEdges.push({
          from: meta.sourceNodeId,
          to: meta.targetNodeId,
          label: `[${meta.condition}]`,
          type: "conditional",
        });
      });
    }

    return advancedEdges;
  }

  public generateMermaidDiagram(messages: Message[]): string {
    const nodes = this.extractNodes(messages);
    const defaultEdges = this.extractEdges(messages);
    const advancedEdges = this.processAdvancedEdges(nodes, defaultEdges);

    const allEdges: Edge[] = [...defaultEdges, ...advancedEdges];

    const graphDefinition: string = `graph TD\n`;

    // Define Nodes
    const nodeDefinitions: string[] = nodes.map((node) => {
      const contentPreview = node.content.substring(0, 50).replace(/[\r\n]/g, ' ').trim() + (node.content.length > 50 ? "..." : "");
      return `${node.id}["${contentPreview}"]`;
    });
    
    const nodeBlock = nodeDefinitions.join('\n');
    
    // Define Edges
    const edgeDefinitions: string[] = allEdges.map((edge) => {
      let label = edge.label;
      let edgeSyntax = `${edge.from} --> ${edge.to}`;

      if (edge.type === "loop") {
        edgeSyntax = `${edge.from} -- "${label}" --> ${edge.to}`;
      } else if (edge.type === "conditional") {
        edgeSyntax = `${edge.from} -- "${label}" --> ${edge.to}`;
      } else {
        edgeSyntax = `${edge.from} --> ${edge.to}`;
      }
      return edgeSyntax;
    });

    const edgeBlock = edgeDefinitions.join('\n');

    return `${graphDefinition}${nodeBlock}\n${edgeBlock}`;
  }
}
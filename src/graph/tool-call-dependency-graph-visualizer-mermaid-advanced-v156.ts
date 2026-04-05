import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface SubgraphDefinition {
  id: string;
  title: string;
  nodes: string[];
  edges: { from: string; to: string }[];
}

export interface AdvancedVisualizerOptions {
  subgraphs?: SubgraphDefinition[];
  nodeStyles?: Record<string, { shape: string; style: string }>;
  edgeStyles?: Record<string, { style: string }>;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV156 {
  private options: AdvancedVisualizerOptions;

  constructor(options: AdvancedVisualizerOptions = {}) {
    this.options = {
      subgraphs: [],
      nodeStyles: {},
      edgeStyles: {},
      ...options,
    };
  }

  private generateNodeId(message: Message, index: number): string {
    const prefix = message.role === "user" ? "U" : message.role === "assistant" ? "A" : "T";
    return `${prefix}-${message.role}-${index}`;
  }

  private processMessageToNodes(messages: Message[]): { nodes: Record<string, string>; edges: { from: string; to: string }[] } {
    const nodes: Record<string, string> = {};
    const edges: { from: string; to: string }[] = [];

    messages.forEach((message, index) => {
      const nodeId = this.generateNodeId(message, index);
      let nodeContent = `Message ${index} (${message.role}): ${message.content.length > 0 ? 'Content present' : 'No content'}`;
      
      if (message.role === "assistant" && message.content.length > 0) {
        const contentBlocks = message.content as ContentBlock[];
        if (contentBlocks.some((block) => block.type === "tool_use")) {
          nodeContent = `Assistant turn with tool calls.`;
        } else if (contentBlocks.some((block) => block.type === "thinking")) {
          nodeContent = `Assistant turn with thinking process.`;
        }
      }

      nodes[nodeId] = nodeContent;
    });

    // Simple edge generation: connect sequential messages
    for (let i = 0; i < messages.length - 1; i++) {
      edges.push({
        from: this.generateNodeId(messages[i], i),
        to: this.generateNodeId(messages[i + 1], i + 1),
      });
    }

    return { nodes, edges };
  }

  private generateSubgraphMermaid(subgraphs: SubgraphDefinition[]): string {
    let subgraphMermaid = "";
    subgraphs.forEach(subgraph => {
      subgraphMermaid += `subgraph ${subgraph.id} [${subgraph.title}]\n`;
      subgraph.nodes.forEach(nodeId => {
        subgraphMermaid += `    ${nodeId}\n`;
      });
      subgraph.edges.forEach(edge => {
        subgraphMermaid += `    ${edge.from} --> ${edge.to};\n`;
      });
      subgraphMermaid += `end\n`;
    });
    return subgraphMermaid;
  }

  public generateMermaidGraph(messages: Message[]): string {
    const { nodes: messageNodes, edges: messageEdges } = this.processMessageToNodes(messages);
    let mermaid = "graph TD\n";

    // 1. Subgraph Grouping
    if (this.options.subgraphs && this.options.subgraphs.length > 0) {
      mermaid += this.generateSubgraphMermaid(this.options.subgraphs);
    }

    // 2. Node Definitions (Using message nodes as primary content)
    let nodeDefinitions = "";
    for (const nodeId in messageNodes) {
      const content = messageNodes[nodeId];
      const style = this.options.nodeStyles?.[nodeId] || { shape: "rectangle", style: "fill:#ccc,stroke:#333" };
      nodeDefinitions += `    ${nodeId}["${content}"]:::${nodeId}Style\n`;
    }
    mermaid += nodeDefinitions;

    // 3. Edge Definitions
    let edgeDefinitions = "";
    messageEdges.forEach(edge => {
      const style = this.options.edgeStyles?.[`${edge.from}-${edge.to}`] || { style: "stroke:#666,stroke-width:2px" };
      edgeDefinitions += `    ${edge.from} -->|${style.style}| ${edge.to};\n`;
    });
    mermaid += edgeDefinitions;

    // 4. Styling (CSS/Class definitions)
    let styleDefinitions = "classDef default fill:#eee,stroke:#333,stroke-width:2px;\n";
    
    // Apply custom node styles
    for (const nodeId in this.options.nodeStyles) {
      const style = this.options.nodeStyles[nodeId];
      styleDefinitions += `classDef ${nodeId}Style ${style.style} shape:${style.shape};\n`;
    }

    // Apply custom edge styles (Note: Mermaid styling for edges is complex; we simulate via class/link text for simplicity here)
    // For advanced edge styling, we rely on the link text or direct CSS if the renderer supports it.
    
    mermaid += "\n%% Styling Definitions\n" + styleDefinitions;

    return mermaid;
  }
}
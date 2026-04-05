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

type GraphNode = {
  id: string;
  type: "user" | "assistant" | "tool";
  message: Message;
  contentBlocks: ContentBlock[];
};

type DependencyGraph = {
  nodes: GraphNode[];
  edges: { source: string; target: string; condition?: string }[];
};

type FlowControlNode = {
  id: string;
  type: "flowcontrol";
  description: string;
  branches: {
    condition: string;
    targetId: string;
  }[];
};

interface AdvancedGraphData {
  nodes: GraphNode[];
  flowControlNodes: FlowControlNode[];
  edges: { source: string; target: string; condition?: string }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private readonly graphData: AdvancedGraphData;

  constructor(graphData: AdvancedGraphData) {
    this.graphData = graphData;
  }

  private buildMermaidGraph(mermaidCode: string, flowControl: boolean): string {
    let graph = `graph TD\n`;

    if (flowControl) {
      graph += "%% Flow Control Graph\n";
      graph += "subgraph Flow Control\n";
      this.graphData.flowControlNodes.forEach(fcNode => {
        graph += `${fcNode.id}["${fcNode.description} (Flow Control)"]\n`;
      });
      graph += "end\n";
    }

    this.graphData.nodes.forEach(node => {
      let nodeShape = "rectangle";
      let nodeLabel = "";

      if (node.type === "user") {
        nodeShape = "user";
        nodeLabel = `User: ${this.extractText(node.message as UserMessage)}`;
      } else if (node.type === "assistant") {
        nodeShape = "assistant";
        nodeLabel = `Assistant: ${this.extractText(node.message as AssistantMessage)}`;
      } else if (node.type === "tool") {
        nodeShape = "tool";
        nodeLabel = `Tool Result (${node.message as ToolResultMessage).tool_use_id})`;
      }

      graph += `${node.id}["${nodeLabel}"]\n`;
    });

    this.graphData.edges.forEach(edge => {
      let edgeSyntax = `${edge.source} --> ${edge.target}`;
      if (edge.condition) {
        edgeSyntax = `${edge.source} -- "${edge.condition}" --> ${edge.target}`;
      }
      graph += `${edgeSyntax}\n`;
    });

    if (flowControl) {
      graph += "\n%% Flow Connections\n";
      this.graphData.flowControlNodes.forEach(fcNode => {
        fcNode.branches.forEach(branch => {
          let branchSyntax = `${fcNode.id} -- "${branch.condition}" --> ${branch.targetId}`;
          graph += `${branchSyntax}\n`;
        });
      });
    }

    return graph;
  }

  private extractText(message: Message): string {
    if ("user" in message) {
      return (message as UserMessage).content;
    }
    if ("assistant" in message) {
      return this.contentBlocksToString(message as AssistantMessage);
    }
    if ("tool" in message) {
      return `Tool Result: ${message as ToolResultMessage).content}`;
    }
    return "";
  }

  private contentBlocksToString(contentBlocks: ContentBlock[]): string {
    let text = "";
    for (const block of contentBlocks) {
      if (block.type === "text") {
        text += block.text + "\n";
      } else if (block.type === "tool_use") {
        text += `\n[Tool Use: ${block.name} with input: ${JSON.stringify(block.input)}]\n`;
      } else if (block.type === "thinking") {
        text += `\n--- Thinking ---\n${block.thinking}\n--- End Thinking ---\n`;
      }
    }
    return text.trim();
  }

  /**
   * Generates the Mermaid graph definition for the dependency visualization.
   * @param flowControl Whether to render advanced flow control logic.
   * @returns The Mermaid graph definition string.
   */
  public visualize(flowControl: boolean = false): string {
    return this.buildMermaidGraph(this.graphData, flowControl);
  }
}
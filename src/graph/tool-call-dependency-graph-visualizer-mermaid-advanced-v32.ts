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

interface GraphNode {
  id: string;
  type: "user" | "assistant" | "tool";
  content: any;
  dependencies: {
    fromId: string;
    toId: string;
    relationship: "call" | "fallback" | "conditional";
    condition?: string;
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV32 {
  private graph: GraphNode[];

  constructor(graph: GraphNode[]) {
    this.graph = graph;
  }

  private getNodeDefinition(node: GraphNode): string {
    let contentString: string;
    switch (node.type) {
      case "user":
        contentString = `User Input: ${JSON.stringify(node.content)}`;
        break;
      case "assistant":
        contentString = `Assistant Response: ${JSON.stringify(node.content)}`;
        break;
      case "tool":
        contentString = `Tool Result: ${JSON.stringify(node.content)}`;
        break;
      default:
        contentString = `Unknown Node: ${JSON.stringify(node.content)}`;
    }
    return `${node.id}["${contentString}"]`;
  }

  private getEdgeDefinition(node: GraphNode, dependency: GraphNode["dependencies"][number]): string {
    const startNodeId = node.id;
    const endNodeId = dependency.toId;
    const relationship = dependency.relationship;
    const condition = dependency.condition;

    let edgeSyntax = `${startNodeId} --> ${endNodeId}`;

    if (relationship === "fallback") {
      edgeSyntax = `${startNodeId} -- "Fallback" --> ${endNodeId}`;
    } else if (relationship === "conditional") {
      edgeSyntax = `${startNodeId} -- "${condition}" --> ${endNodeId}`;
    } else if (relationship === "call") {
      edgeSyntax = `${startNodeId} --> ${endNodeId}`;
    }

    return edgeSyntax;
  }

  public renderMermaidGraph(): string {
    let graphDefinition = "graph TD\n";
    let nodeDefinitions: string[] = [];
    let edgeDefinitions: string[] = [];

    const nodeMap = new Map<string, GraphNode>();
    this.graph.forEach(node => nodeMap.set(node.id, node));

    // 1. Define Nodes
    this.graph.forEach(node => {
      nodeDefinitions.push(this.getNodeDefinition(node));
    });

    // 2. Define Edges
    this.graph.forEach(node => {
      node.dependencies.forEach(dependency => {
        edgeDefinitions.push(this.getEdgeDefinition(node, dependency));
      });
    });

    // 3. Assemble Graph
    graphDefinition += nodeDefinitions.join("\n    ") + "\n";
    graphDefinition += "\n    " + edgeDefinitions.join("\n    ");

    return graphDefinition;
  }
}
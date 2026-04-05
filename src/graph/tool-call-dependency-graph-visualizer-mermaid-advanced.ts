import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedToolCallNode {
  message: Message;
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
    mermaidSubgraphId: string;
    mermaidTitle: string;
  }[];
  mermaidSwimlane?: string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvanced {
  private nodes: AdvancedToolCallNode[];

  constructor(nodes: AdvancedToolCallNode[]) {
    this.nodes = nodes;
  }

  private generateSubgraphSyntax(node: AdvancedToolCallNode): string {
    if (!node.toolCalls || node.toolCalls.length === 0) {
      return "";
    }

    const subgraphId = `subgraph_${node.message.role}_${node.message.content.substring(0, 5)}`;
    let subgraphContent = `\n  ${subgraphId} {\n`;

    node.toolCalls.forEach((toolCall, index) => {
      const nodeLabel = `${toolCall.name} (${toolCall.id})`;
      const mermaidNodeId = `T${toolCall.id.replace(/[^a-zA-Z0-9]/g, '')}`;

      subgraphContent += `    ${mermaidNodeId}["${nodeLabel}"]\n`;
      subgraphContent += `    direction LR\n`;
      subgraphContent += `    ${mermaidNodeId} -- Input --> Input(${toolCall.id})\n`;
      subgraphContent += `    ${mermaidNodeId} -- Output --> Output(${toolCall.id})\n`;
    });

    subgraphContent += `  }\n`;
    return subgraphContent;
  }

  private generateFlowSyntax(currentNode: AdvancedToolCallNode, nextNode: AdvancedToolCallNode): string {
    const sourceId = `Node_${currentNode.message.role}_${currentNode.message.content.substring(0, 5)}`;
    const targetId = `Node_${nextNode.message.role}_${nextNode.message.content.substring(0, 5)}`;

    let flowSyntax = "";

    if (currentNode.toolCalls && currentNode.toolCalls.length > 0) {
      const lastToolCallId = currentNode.toolCalls[currentNode.toolCalls.length - 1].id;
      const sourceToolNode = `T${lastToolCallId.replace(/[^a-zA-Z0-9]/g, '')}`;
      flowSyntax += `    ${sourceToolNode} --> |Result| ${targetId};\n`;
    } else {
      flowSyntax += `    ${sourceId} --> |Direct| ${targetId};\n`;
    }

    return flowSyntax;
  }

  public generateMermaidDiagram(): string {
    let mermaid = "graph TD\n";
    let swimlaneDeclarations: Map<string, string[]> = new Map();
    let nodeDefinitions: string[] = [];
    let flowConnections: string[] = [];

    // 1. Process Nodes and Subgraphs
    this.nodes.forEach((node, index) => {
      const role = node.message.role;
      const nodeBaseId = `Node_${role}_${index}`;
      const nodeLabel = `${role.toUpperCase()}: ${node.message.content.substring(0, 20)}...`;

      nodeDefinitions.push(`  ${nodeBaseId}["${nodeLabel}"]`);

      if (node.toolCalls && node.toolCalls.length > 0) {
        const subgraphSyntax = this.generateSubgraphSyntax(node);
        mermaid += `${subgraphSyntax}`;
        
        // Track swimlane assignment if provided
        if (node.mermaidSwimlane) {
            if (!swimlaneDeclarations.has(node.mermaidSwimlane)) {
                swimlaneDeclarations.set(node.mermaidSwimlane, []);
            }
            swimlaneDeclarations.get(node.mermaidSwimlane)!.push(nodeBaseId);
        }
      } else {
        nodeDefinitions.push(`  ${nodeBaseId}["${nodeLabel}"]`);
      }
    });

    // 2. Process Flows
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const currentNode = this.nodes[i];
      const nextNode = this.nodes[i + 1];
      flowConnections.push(this.generateFlowSyntax(currentNode, nextNode));
    }

    // 3. Assemble Final Diagram
    mermaid += "\n%% --- Node Definitions ---\n";
    mermaid += nodeDefinitions.join("\n");

    mermaid += "\n%% --- Flow Connections ---\n";
    mermaid += flowConnections.join("\n");

    // 4. Add Swimlanes (if any)
    if (swimlaneDeclarations.size > 0) {
        mermaid += "\n%% --- Swimlanes ---\n";
        mermaid += "subgraph Flow Control\n";
        swimlaneDeclarations.forEach((nodeIds, laneName) => {
            mermaid += `  ${laneName}::${nodeIds.join(", ")}\n`;
        });
        mermaid += "end\n";
    }

    return mermaid;
  }
}
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

interface DependencyGraphContext {
  messages: Message[];
  graphNodes: {
    id: string;
    type: "start" | "tool_call" | "conditional" | "loop" | "end";
    description: string;
    inputs?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
    next?: {
      condition: string;
      nodeId: string;
    } | {
      type: "default";
      nodeId: string;
    };
    branches?: {
      condition: string;
      nodeId: string;
    }[];
    loopBody?: {
      entryNodeId: string;
      exitNodeId: string;
    };
}

export class ToolCallDependencyGraphVisualizer {
  private context: DependencyGraphContext;

  constructor(context: DependencyGraphContext) {
    this.context = context;
  }

  private generateNodeDefinition(nodeId: string, nodeType: "start" | "tool_call" | "conditional" | "loop" | "end", description: string): string {
    let definition = `    ${nodeId}["${description}"]\n`;

    if (nodeType === "tool_call") {
      const toolUse = this.context.graphNodes.find(n => n.id === nodeId)?.inputs as ToolUseBlock | undefined;
      if (toolUse) {
        definition += `    style ${nodeId} fill:#f9f,stroke:#333,stroke-width:2px\n`;
      }
    } else if (nodeType === "conditional") {
      definition += `    style ${nodeId} fill:#ccf,stroke:#333,stroke-width:2px\n`;
    } else if (nodeType === "loop") {
      definition += `    style ${nodeId} fill:#ffc,stroke:#333,stroke-width:2px\n`;
    } else if (nodeType === "start") {
      definition += `    style ${nodeId} fill:#cfc,stroke:#333,stroke-width:2px\n`;
    } else if (nodeType === "end") {
      definition += `    style ${nodeId} fill:#fcc,stroke:#333,stroke-width:2px\n`;
    }
    return definition;
  }

  private generateConnection(fromId: string, toId: string, label: string = ""): string {
    let connection = `    ${fromId} -->${label.trim() ? `:${label.trim()}` : ''} ${toId}\n`;
    return connection;
  }

  private generateConditionalConnections(nodeId: string, branches: { condition: string; nodeId: string }[]): string {
    let connections = "";
    for (const branch of branches) {
      connections += this.generateConnection(nodeId, branch.nodeId, branch.condition);
    }
    return connections;
  }

  private generateLoopConnections(nodeId: string, loopBody: { entryNodeId: string; exitNodeId: string }): string {
    let connections = "";
    // Entry point connection
    connections += this.generateConnection(nodeId, loopBody.entryNodeId, "Enter Loop");
    // Loop back connection (simplified: assume exit connects back to entry for visualization)
    connections += this.generateConnection(loopBody.exitNodeId, loopBody.entryNodeId, "Loop Back");
    return connections;
  }

  public generateMermaidGraph(): string {
    let mermaid = "graph TD\n";
    let nodeDefinitions: string[] = [];
    let connectionStrings: string[] = [];

    const nodesMap = new Map<string, DependencyGraphContext['graphNodes']>();
    this.context.graphNodes.forEach(node => nodesMap.set(node.id, node));

    // 1. Generate Node Definitions and Styles
    this.context.graphNodes.forEach(node => {
      const type = node.type;
      const definition = this.generateNodeDefinition(node.id, type, node.description);
      nodeDefinitions.push(definition);
    });

    // 2. Generate Connections
    this.context.graphNodes.forEach(node => {
      const nodeId = node.id;
      let connections = "";

      if (node.type === "conditional" && node.branches) {
        connections += this.generateConditionalConnections(nodeId, node.branches);
      } else if (node.type === "loop" && node.loopBody) {
        connections += this.generateLoopConnections(nodeId, node.loopBody);
      } else if (node.next) {
        const next = node.next;
        let label = "";
        if (next.condition) {
          label = next.condition;
        } else if (next.type === "default") {
          label = "Default Path";
        }
        connections += this.generateConnection(nodeId, next.nodeId, label);
      }

      if (connections) {
        connectionStrings.push(connections);
      }
    });

    // 3. Assemble Final Graph
    mermaid += nodeDefinitions.join("") + "\n";
    mermaid += connectionStrings.join("") + "\n";

    return mermaid;
  }
}
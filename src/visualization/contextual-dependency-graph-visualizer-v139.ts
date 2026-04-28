import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalConstraint {
  start_time: number;
  end_time: number;
  description: string;
}

export interface ResourceConstraint {
  resource_name: string;
  required_amount: number;
  unit: string;
}

export interface ContextualDependency {
  sourceId: string;
  targetId: string;
  dependencyType: "standard" | "temporal" | "resource";
  metadata: {
    temporal?: TemporalConstraint;
    resource?: ResourceConstraint;
    description: string;
  };
}

export interface ContextualGraphPayload {
  messages: Array<ContentBlock>;
  dependencies: ContextualDependency[];
}

export class ContextualDependencyGraphVisualizer {
  private payload: ContextualGraphPayload;

  constructor(payload: ContextualGraphPayload) {
    this.payload = payload;
  }

  private extractNodeDetails(block: ContentBlock): { id: string; type: string; content: string } {
    if (typeof block === "object" && block !== null) {
      if (block.type === "text") {
        return { id: "text", type: "text", content: (block as TextBlock).text };
      }
      if (block.type === "tool_use") {
        return { id: "tool_use", type: "tool_use", content: `${(block as ToolUseBlock).name}(${JSON.stringify((block as ToolUseBlock).input)})` };
      }
      if (block.type === "thinking") {
        return { id: "thinking", type: "thinking", content: (block as ThinkingBlock).thinking };
      }
    }
    return { id: "unknown", type: "unknown", content: "[Unknown Content]" };
  }

  public visualize(): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    const nodeMap = new Map<string, { id: string; type: string; content: string }>();

    // 1. Process Messages to create Nodes
    this.payload.messages.forEach((block, index) => {
      const details = this.extractNodeDetails(block);
      const nodeId = `${details.type}-${index}`;
      nodeMap.set(nodeId, { id: nodeId, type: details.type, content: details.content });
    });

    Object.values(nodeMap).forEach(details => {
      nodes.push({
        id: details.id,
        label: details.content.substring(0, 50) + (details.content.length > 50 ? "..." : ""),
        details: details,
        metadata: {
          node_type: details.type,
        },
      });
    });

    // 2. Process Dependencies to create Edges
    this.payload.dependencies.forEach((dep, index) => {
      let edgeMetadata: any = {
        description: dep.metadata.description,
        contextual_info: {},
      };

      if (dep.dependencyType === "temporal" && dep.metadata.temporal) {
        edgeMetadata.contextual_info.temporal = {
          start: dep.metadata.temporal.start_time,
          end: dep.metadata.temporal.end_time,
          desc: dep.metadata.temporal.description,
        };
      } else if (dep.dependencyType === "resource" && dep.metadata.resource) {
        edgeMetadata.contextual_info.resource = {
          resource: dep.metadata.resource.resource_name,
          amount: dep.metadata.resource.required_amount,
          unit: dep.metadata.resource.unit,
        };
      }

      edges.push({
        source: dep.sourceId,
        target: dep.targetId,
        type: dep.dependencyType,
        label: `Dependency (${dep.dependencyType})`,
        metadata: edgeMetadata,
      });
    });

    return { nodes, edges };
  }
}
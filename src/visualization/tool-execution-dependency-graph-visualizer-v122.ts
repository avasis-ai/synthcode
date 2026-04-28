import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface NodeMetadata {
  id: string;
  name: string;
  peakResourceUsage: number;
  startTime?: number;
  endTime?: number;
}

export interface EdgeMetadata {
  sourceId: string;
  targetId: string;
  duration: number;
  resourceConsumption: {
    cpu: number;
    memory: number;
  };
  startTime: number;
  endTime: number;
}

export interface DependencyGraphPayload {
  nodes: Record<string, NodeMetadata>;
  edges: EdgeMetadata[];
  messages: Array<ContentBlock>;
}

export class ToolExecutionDependencyGraphVisualizerV122 {
  private payload: DependencyGraphPayload;

  constructor(payload: DependencyGraphPayload) {
    this.payload = payload;
  }

  private getNodes(): Record<string, NodeMetadata> {
    return this.payload.nodes;
  }

  private getEdges(): EdgeMetadata[] {
    return this.payload.edges;
  }

  private getMessages(): Array<ContentBlock> {
    return this.payload.messages;
  }

  public renderGraph(): {
    svgContent: string;
    metadata: any;
  } {
    const nodes = this.getNodes();
    const edges = this.getEdges();

    const nodeStyles = Object.values(nodes).map(node => ({
      id: node.id,
      size: Math.max(10, node.peakResourceUsage * 2),
      color: `hsl(${node.peakResourceUsage * 10}, 70%, 50%)`,
    }));

    const edgeStyles = edges.map(edge => ({
      source: edge.sourceId,
      target: edge.targetId,
      ganttSegment: {
        start: edge.startTime,
        end: edge.endTime,
        resource: edge.resourceConsumption,
      },
      style: {
        strokeWidth: Math.max(1, edge.resourceConsumption.cpu * 0.5),
        opacity: 0.7,
      }
    }));

    const svgContent = `/* SVG rendering logic using nodeStyles and edgeStyles */`;

    return {
      svgContent,
      metadata: {
        nodeStyles,
        edgeStyles,
        messageHistory: this.getMessages(),
      },
    };
  }

  public filterByTemporalOverlap(startTime: number, endTime: number): {
    filteredEdges: EdgeMetadata[];
    filteredNodes: NodeMetadata[];
  } {
    const filteredEdges = this.getEdges().filter(edge =>
      Math.max(edge.startTime, startTime) < Math.min(edge.endTime, endTime)
    );

    const affectedNodeIds = new Set<string>();
    filteredEdges.forEach(edge => {
      affectedNodeIds.add(edge.sourceId);
      affectedNodeIds.add(edge.targetId);
    });

    const filteredNodes = this.getNodes().filter(node =>
      affectedNodeIds.has(node.id)
    );

    return {
      filteredEdges,
      filteredNodes,
    };
  }

  public highlightResourceBottleneck(minResourceThreshold: number): {
    bottleneckNodes: NodeMetadata[];
    bottleneckEdges: EdgeMetadata[];
  } {
    const bottleneckNodes = Object.values(this.getNodes()).filter(
      node => node.peakResourceUsage >= minResourceThreshold
    );

    const bottleneckEdges = this.getEdges().filter(edge => {
      return edge.resourceConsumption.cpu >= minResourceThreshold * 0.8 ||
        edge.resourceConsumption.memory >= minResourceThreshold * 0.8;
    });

    return {
      bottleneckNodes,
      bottleneckEdges,
    };
  }
}
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type TemporalEdgeData = {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
};

export interface DependencyGraphNode {
  id: string;
  label: string;
  metadata: Record<string, unknown>;
  resourceCapacity: Record<string, number>;
}

export interface DependencyGraphEdge {
  sourceId: string;
  targetId: string;
  data: TemporalEdgeData;
}

export class ToolExecutionDependencyGraphVisualizerV24 {
  private nodes: DependencyGraphNode[];
  private edges: DependencyGraphEdge[];

  constructor(nodes: DependencyGraphNode[], edges: DependencyGraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  private calculateNodeHealth(node: DependencyGraphNode): Record<string, number> {
    let totalCapacity = 0;
    let usedResources: Record<string, number> = {};

    for (const resource in node.resourceCapacity) {
      const capacity = node.resourceCapacity[resource] || 0;
      usedResources[resource] = 0;
      totalCapacity += capacity;
    }

    // Simplified resource usage calculation for demonstration
    // In a real scenario, this would aggregate usage from connected edges.
    const dummyUsage: Record<string, number> = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
    };

    return {
      totalCapacity: totalCapacity,
      usage: dummyUsage,
    };
  }

  private renderNodeIndicators(node: DependencyGraphNode): string {
    const health = this.calculateNodeHealth(node);
    let indicator = `Node ${node.id} Health: `;
    let resourceStatus = "";
    for (const resource in health.usage) {
      const usage = health.usage[resource];
      const capacity = node.resourceCapacity[resource] || 100;
      const percentage = Math.min(100, (usage / capacity) * 100);
      resourceStatus += `${resource}: ${usage.toFixed(1)}/${capacity.toFixed(1)} (${percentage.toFixed(0)}%) `;
    }
    return `${indicator}${resourceStatus.trim()}`;
  }

  private renderEdgeIndicators(edge: DependencyGraphEdge): string {
    const data = edge.data;
    const duration = data.endTime - data.startTime;
    let indicator = `Edge ${edge.sourceId} -> ${edge.targetId} Time: ${duration.toFixed(2)}s. `;
    let resourceStatus = "";
    for (const resource in data.resourceUsage) {
      const usage = data.resourceUsage[resource];
      resourceStatus += `${resource} Usage: ${usage.toFixed(2)} `;
    }
    return `${indicator}${resourceStatus.trim()}`;
  }

  public renderGraphVisualization(): { nodes: string[]; edges: string[]; summary: string } {
    const nodeIndicators: string[] = this.nodes.map(node => this.renderNodeIndicators(node));
    const edgeIndicators: string[] = this.edges.map(edge => this.renderEdgeIndicators(edge));

    const summary = `--- System Health Summary ---\n` +
                     `Nodes Processed: ${this.nodes.length}\n` +
                     `Edges Processed: ${this.edges.length}\n` +
                     `Node Statuses:\n${nodeIndicators.join('\n')}\n` +
                     `Edge Statuses:\n${edgeIndicators.join('\n')}`;

    return {
      nodes: this.nodes.map(n => n.id),
      edges: this.edges.map(e => `${e.sourceId}->${e.targetId}`),
      summary: summary,
    };
  }
}
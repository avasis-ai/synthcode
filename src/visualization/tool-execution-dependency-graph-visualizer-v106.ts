import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalMetadata {
  startTime: number;
  endTime: number;
  resourceUsage: Record<string, number>;
}

export interface NodeData extends Message {
  metadata: TemporalMetadata;
}

export interface EdgeData {
  sourceId: string;
  targetId: string;
  metadata: TemporalMetadata;
}

export class ToolExecutionDependencyGraphVisualizerV106 {
  private nodes: Map<string, NodeData>;
  private edges: EdgeData[];

  constructor() {
    this.nodes = new Map<string, NodeData>();
    this.edges = [];
  }

  public addNode(nodeId: string, data: NodeData): void {
    this.nodes.set(nodeId, data);
  }

  public addEdge(edge: EdgeData): void {
    this.edges.push(edge);
  }

  private getNodesArray(): NodeData[] {
    return Array.from(this.nodes.values());
  }

  private getEdgesArray(): EdgeData[] {
    return this.edges;
  }

  public visualize(viewType: "graph" | "timeline", containerElement: HTMLElement): void {
    if (viewType === "graph") {
      this.renderGraphView(containerElement);
    } else if (viewType === "timeline") {
      this.renderTimelineView(containerElement);
    } else {
      throw new Error("Unsupported view type specified.");
    }
  }

  private renderGraphView(container: HTMLElement): void {
    const containerDiv = document.createElement("div");
    containerDiv.className = "dependency-graph-container";
    container.appendChild(containerDiv);

    // Placeholder for standard graph rendering logic (e.g., using D3 force simulation)
    console.log("Rendering standard graph view.");
    const nodeElements: HTMLElement[] = this.getNodesArray().map(node => {
      const el = document.createElement("div");
      el.className = "node";
      el.textContent = `Node ${node.role} (${node.metadata.startTime.toFixed(0)}): ${node.content.substring(0, 20)}...`;
      return el;
    });

    const edgeElements: HTMLElement[] = this.getEdgesArray().map(edge => {
      const el = document.createElement("div");
      el.className = "edge";
      el.textContent = `Edge ${edge.sourceId} -> ${edge.targetId}`;
      return el;
    });

    nodeElements.forEach(el => containerDiv.appendChild(el));
    edgeElements.forEach(el => containerDiv.appendChild(el));
  }

  private renderTimelineView(container: HTMLElement): void {
    const containerDiv = document.createElement("div");
    containerDiv.className = "timeline-container";
    container.innerHTML = "";
    container.appendChild(containerDiv);

    const timelineElements: HTMLElement[] = [];

    // 1. Render Nodes on Timeline
    const nodeTimelineElements: HTMLElement[] = this.getNodesArray().map(node => {
      const el = document.createElement("div");
      el.className = "timeline-node";
      el.style.marginLeft = `${(node.metadata.startTime / 1000) * 10}px`; // Simple scaling
      el.style.width = `${(node.metadata.endTime - node.metadata.startTime) / 1000 * 10}px`;
      el.style.position = "relative";
      el.style.top = "10px";
      el.textContent = `Node ${node.role}: ${node.content.substring(0, 15)}...`;
      return el;
    });

    // 2. Render Edges on Timeline (as spans/connections)
    const edgeTimelineElements: HTMLElement[] = this.getEdgesArray().map(edge => {
      const el = document.createElement("div");
      el.className = "timeline-edge";
      el.style.marginLeft = `${(edge.metadata.startTime / 1000) * 10}px`;
      el.style.width = `${(edge.metadata.endTime - edge.metadata.startTime) / 1000 * 10}px`;
      el.style.position = "absolute";
      el.style.top = "30px";
      el.textContent = `Connection ${edge.sourceId} -> ${edge.targetId}`;
      return el;
    });

    [...nodeTimelineElements, ...edgeTimelineElements].forEach(el => containerDiv.appendChild(el));

    console.log("Rendering temporal timeline view.");
  }
}
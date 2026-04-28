import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
}

export interface TimeWindow {
  start: number; // Unix timestamp or relative time unit
  end: number;   // Unix timestamp or relative time unit
}

export interface NodeMetadata {
  resourceUsage?: ResourceUsage;
  timeWindow?: TimeWindow;
  label?: string;
}

export interface EdgeMetadata {
  resourceUsage?: ResourceUsage;
  timeWindow?: TimeWindow;
  dependencyType?: "causal" | "temporal" | "resource";
}

export interface GraphPayload {
  nodes: {
    id: string;
    metadata: NodeMetadata;
  }[];
  edges: {
    source: string;
    target: string;
    metadata: EdgeMetadata;
  }[];
}

export interface VisualizerOptions {
  showTemporalConstraints: boolean;
  showResourceUsage: boolean;
  showDependencyTypes: boolean;
}

export class ContextualDependencyGraphVisualizerAdvanced {
  private payload: GraphPayload;
  private options: VisualizerOptions;

  constructor(payload: GraphPayload, options: VisualizerOptions) {
    this.payload = payload;
    this.options = options;
  }

  public visualize(): void {
    console.log("--- Contextual Dependency Graph Visualization Initialized ---");
    console.log("Payload Nodes:", this.payload.nodes.length);
    console.log("Payload Edges:", this.payload.edges.length);

    if (this.options.showResourceUsage) {
      this.renderResourceUsage();
    }

    if (this.options.showTemporalConstraints) {
      this.renderTemporalConstraints();
    }

    if (this.options.showDependencyTypes) {
      this.renderDependencyTypes();
    }

    console.log("--- Visualization Rendering Complete ---");
  }

  private renderResourceUsage(): void {
    console.log("\n[Rendering Resource Usage Layer]");
    this.payload.nodes.forEach(node => {
      if (node.metadata.resourceUsage) {
        console.log(`Node ${node.id}: CPU=${node.metadata.resourceUsage.cpu.toFixed(2)}, Mem=${node.metadata.resourceUsage.memory.toFixed(2)}`);
      }
    });
    this.payload.edges.forEach(edge => {
      if (edge.metadata.resourceUsage) {
        console.log(`Edge ${edge.source} -> ${edge.target}: Resource Usage Detected.`);
      }
    });
  }

  private renderTemporalConstraints(): void {
    console.log("\n[Rendering Temporal Constraints Layer]");
    this.payload.nodes.forEach(node => {
      if (node.metadata.timeWindow) {
        console.log(`Node ${node.id}: Active Time Window [${node.metadata.timeWindow.start} to ${node.metadata.timeWindow.end}]`);
      }
    });
    this.payload.edges.forEach(edge => {
      if (edge.metadata.timeWindow) {
        console.log(`Edge ${edge.source} -> ${edge.target}: Temporal Link [${edge.metadata.timeWindow.start} to ${edge.metadata.timeWindow.end}]`);
      }
    });
  }

  private renderDependencyTypes(): void {
    console.log("\n[Rendering Dependency Type Layer]");
    this.payload.edges.forEach(edge => {
      if (edge.metadata.dependencyType) {
        console.log(`Edge ${edge.source} -> ${edge.target}: Dependency Type - ${edge.metadata.dependencyType.toUpperCase()}`);
      }
    });
  }

  public static create(payload: GraphPayload, options: Partial<VisualizerOptions> = {}): ContextualDependencyGraphVisualizerAdvanced {
    const defaultOptions: VisualizerOptions = {
      showTemporalConstraints: false,
      showResourceUsage: false,
      showDependencyTypes: false,
    };
    const finalOptions: VisualizerOptions = { ...defaultOptions, ...options } as VisualizerOptions;
    return new ContextualDependencyGraphVisualizerAdvanced(payload, finalOptions);
  }
}
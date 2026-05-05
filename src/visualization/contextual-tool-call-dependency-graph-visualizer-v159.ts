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

export interface ResourceUsage {
  resourceId: string;
  usageMetric: "cpu" | "memory" | "network";
  value: number;
  unit: string;
}

export interface TemporalConstraint {
  startTime: number;
  endTime: number;
  dependency?: string;
}

export interface ToolCallContext {
  toolUseId: string;
  resourceUsage: ResourceUsage[];
  temporalConstraints: TemporalConstraint[];
  capabilityLinks: {
    sourceId: string;
    targetId: string;
    capability: string;
  }[];
}

export interface ContextualGraphPayload {
  messages: Message[];
  toolCallContexts: Record<string, ToolCallContext>;
}

export class ContextualToolCallDependencyGraphVisualizer {
  private payload: ContextualGraphPayload;

  constructor(payload: ContextualGraphPayload) {
    this.payload = payload;
  }

  private extractToolCallDependencies(toolUseId: string): {
    dependencies: {
      source: string;
      target: string;
      type: "resource" | "temporal" | "capability";
      data: any;
    }[];
  } {
    const toolContext = this.payload.toolCallContexts[toolUseId];
    if (!toolContext) {
      return [];
    }

    const dependencies: {
      source: string;
      target: string;
      type: "resource" | "temporal" | "capability";
      data: any;
    }[] = [];

    toolContext.resourceUsage.forEach((usage) => {
      dependencies.push({
        source: toolUseId,
        target: usage.resourceId,
        type: "resource",
        data: usage,
      });
    });

    toolContext.temporalConstraints.forEach((constraint) => {
      dependencies.push({
        source: toolUseId,
        target: constraint.dependency || "system_time",
        type: "temporal",
        data: constraint,
      });
    });

    toolContext.capabilityLinks.forEach((link) => {
      dependencies.push({
        source: toolUseId,
        target: link.targetId,
        type: "capability",
        data: link.capability,
      });
    });

    return dependencies;
  }

  public visualizeGraph(): void {
    console.log("--- Contextual Dependency Graph Visualization ---");
    console.log(`Total Messages Processed: ${this.payload.messages.length}`);
    console.log(`Total Contextual Tool Calls Tracked: ${Object.keys(this.payload.toolCallContexts).length}`);

    const allDependencies: {
      source: string;
      target: string;
      type: "resource" | "temporal" | "capability";
      data: any;
    }[] = [];

    for (const toolUseId in this.payload.toolCallContexts) {
      const dependencies = this.extractToolCallDependencies(toolUseId);
      allDependencies.push(...dependencies);
    }

    console.log("\n[Dependency Edges Summary]");
    const typeCounts: Record<string, number> = {
      resource: 0,
      temporal: 0,
      capability: 0,
    };

    allDependencies.forEach((dep) => {
      console.log(
        `  ${dep.source} --(${dep.type.toUpperCase()})--> ${dep.target} (Data: ${JSON.stringify(dep.data)})`
      );
      typeCounts[dep.type] = (typeCounts[dep.type] || 0) + 1;
    });

    console.log("\n[Contextual Metrics]");
    console.log(`Resource Dependencies Count: ${typeCounts.resource}`);
    console.log(`Temporal Dependencies Count: ${typeCounts.temporal}`);
    console.log(`Capability Links Count: ${typeCounts.capability}`);

    console.log("\nVisualization Complete: Graph structure enriched with resource, time, and capability overlays.");
  }
}
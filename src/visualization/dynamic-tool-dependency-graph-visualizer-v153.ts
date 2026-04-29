import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface ResourceConstraint {
  resource: string;
  requiredBy: string;
  conflictsWith: string;
  severity: "high" | "medium" | "low";
}

interface TemporalConstraint {
  toolA: string;
  toolB: string;
  overlapDurationMs: number;
  dependencyType: "precedes" | "concurrent";
}

export interface GraphPayload {
  tools: string[];
  resourceConstraints: ResourceConstraint[];
  temporalConstraints: TemporalConstraint[];
}

interface ToolCapabilities {
  name: string;
  resources: Record<string, { required: number; unit: string }>;
  executionTimeMs: number;
  dependencies: string[];
}

class CapabilityConstraintResolver {
  private tools: ToolCapabilities[];

  constructor(tools: ToolCapabilities[]) {
    this.tools = tools;
  }

  resolveConstraints(): GraphPayload {
    const resourceConstraints: ResourceConstraint[] = [];
    const temporalConstraints: TemporalConstraint[] = [];
    const toolNames = this.tools.map(t => t.name);

    for (let i = 0; i < this.tools.length; i++) {
      for (let j = i + 1; j < this.tools.length; j++) {
        const toolA = this.tools[i];
        const toolB = this.tools[j];

        // 1. Resource Constraint Resolution
        const commonResources = new Set<string>();
        Object.keys(toolA.resources).forEach(res => {
          if (toolB.resources[res]) {
            commonResources.add(res);
          }
        });

        commonResources.forEach(resource => {
          const reqA = toolA.resources[resource].required;
          const reqB = toolB.resources[resource].required;
          const totalRequired = reqA + reqB;
          const capacity = 10; // Assume a fixed system capacity for simplicity

          if (totalRequired > capacity) {
            resourceConstraints.push({
              resource: resource,
              requiredBy: toolA.name,
              conflictsWith: toolB.name,
              severity: "high",
            });
          } else if (totalRequired > capacity * 0.7) {
            resourceConstraints.push({
              resource: resource,
              requiredBy: toolA.name,
              conflictsWith: toolB.name,
              severity: "medium",
            });
          }
        });

        // 2. Temporal Constraint Resolution (Simplified Overlap Check)
        const timeDiff = Math.abs(toolA.executionTimeMs - toolB.executionTimeMs);
        const overlap = Math.max(0, Math.min(toolA.executionTimeMs, toolB.executionTimeMs) - Math.abs(toolA.executionTimeMs - toolB.executionTimeMs));

        if (overlap > 0) {
          temporalConstraints.push({
            toolA: toolA.name,
            toolB: toolB.name,
            overlapDurationMs: overlap,
            dependencyType: "concurrent",
          });
        }
      }
    }

    return {
      tools: toolNames,
      resourceConstraints: resourceConstraints,
      temporalConstraints: temporalConstraints,
    };
  }
}

export class DynamicToolDependencyGraphVisualizer {
  private resolver: CapabilityConstraintResolver;

  constructor(tools: ToolCapabilities[]) {
    this.resolver = new CapabilityConstraintResolver(tools);
  }

  public generateGraphPayload(): GraphPayload {
    return this.resolver.resolveConstraints();
  }

  public visualize(payload: GraphPayload): void {
    console.log("--- Dependency Graph Visualization Report ---");
    console.log(`Tools Involved: ${payload.tools.join(", ")}`);

    console.log("\n[Resource Contention Analysis]");
    if (payload.resourceConstraints.length === 0) {
      console.log("No significant resource conflicts detected.");
    } else {
      payload.resourceConstraints.forEach(c => {
        console.log(
          `  [${c.severity.toUpperCase()}]: Resource '${c.resource}' contention between ${c.requiredBy} and ${c.conflictsWith}.`
        );
      });
    }

    console.log("\n[Temporal Overlap Analysis]");
    if (payload.temporalConstraints.length === 0) {
      console.log("No significant temporal overlaps detected.");
    } else {
      payload.temporalConstraints.forEach(c => {
        console.log(
          `  - ${c.toolA} and ${c.toolB} overlap for ${c.overlapDurationMs}ms (${c.dependencyType}). Potential scheduling conflict.`
        );
      });
    }

    console.log("\n--- Visualization Complete ---");
  }
}
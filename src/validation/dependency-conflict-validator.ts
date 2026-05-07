import { Graph, CycleDetectionResult } from "graph-lib";

export type ResourceName = string;
export type CapabilityName = string;

export interface ResourceRequirement {
  resource: ResourceName;
  capacity: number;
}

export interface CapabilityRequirement {
  capability: CapabilityName;
  level: number;
}

export interface ToolCall {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  // Dependencies: List of IDs of other tools this tool must run after or depends on.
  dependencies: string[];
  // Resources required by this specific call
  resourceRequirements: ResourceRequirement[];
  // Capabilities required by this specific call
  capabilityRequirements: CapabilityRequirement[];
}

export interface GlobalRegistry {
  // Tracks total available resources
  availableResources: Record<ResourceName, number>;
  // Tracks total available capabilities
  availableCapabilities: Record<CapabilityName, number>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DependencyConflictValidator {
  private readonly registry: GlobalRegistry;

  constructor(registry: GlobalRegistry) {
    this.registry = registry;
  }

  validate(planSegment: ToolCall[]): ValidationResult {
    const errors: string[] = [];

    // 1. Dependency Cycle Check
    const cycleResult = this.detectCycles(planSegment);
    if (!cycleResult.isCyclic) {
      errors.push("Circular dependency detected in the plan segment.");
    }

    // 2. Resource and Capability Conflict Check
    const { resourceConflicts, capabilityConflicts } = this.checkResourceAndCapabilityConflicts(planSegment);
    errors.push(...resourceConflicts);
    errors.push(...capabilityConflicts);

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private detectCycles(planSegment: ToolCall[]): CycleDetectionResult {
    const graph = new Graph();
    const callMap = new Map<string, ToolCall>();

    for (const call of planSegment) {
      callMap.set(call.id, call);
      // Add edges based on dependencies
      call.dependencies.forEach(depId => {
        if (callMap.has(depId)) {
          graph.addEdge(call.id, depId);
        }
      });
    }

    // Check for cycles starting from all nodes
    for (const call of planSegment) {
      const cycle = graph.detectCycle(call.id);
      if (cycle) {
        return { isCyclic: true, cycle: cycle.join(" -> ") };
      }
    }

    return { isCyclic: false, cycle: "" };
  }

  private checkResourceAndCapabilityConflicts(
    planSegment: ToolCall[]
  ): { resourceConflicts: string[]; capabilityConflicts: string[] } {
    const totalResourceUsage: Record<ResourceName, number> = {};
    const totalCapabilityUsage: Record<CapabilityName, number> = {};
    const resourceConflicts: string[] = [];
    const capabilityConflicts: string[] = [];

    // Aggregate usage
    for (const call of planSegment) {
      // Aggregate Resources
      for (const req of call.resourceRequirements) {
        totalResourceUsage[req.resource] = (
          totalResourceUsage[req.resource] || 0
        ) + req.capacity;
      }

      // Aggregate Capabilities
      for (const req of call.capabilityRequirements) {
        totalCapabilityUsage[req.capability] = (
          totalCapabilityUsage[req.capability] || 0
        ) + req.level;
      }
    }

    // Check Resource Conflicts
    for (const [resource, used] of Object.entries(totalResourceUsage)) {
      const available = this.registry.availableResources[resource] || 0;
      if (used > available) {
        resourceConflicts.push(
          `Resource conflict: Required ${used} units of '${resource}', but only ${available} available.`
        );
      }
    }

    // Check Capability Conflicts
    for (const [capability, used] of Object.entries(totalCapabilityUsage)) {
      const available = this.registry.availableCapabilities[capability] || 0;
      if (used > available) {
        capabilityConflicts.push(
          `Capability conflict: Required level ${used} of '${capability}', but only ${available} available.`
        );
      }
    }

    return { resourceConflicts, capabilityConflicts };
  }
}
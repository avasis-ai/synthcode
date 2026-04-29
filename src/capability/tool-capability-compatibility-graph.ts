import { Graph } from "./graph";

export type CapabilityName = string;

export interface CompatibilityEdge {
  source: CapabilityName;
  target: CapabilityName;
  compatible: boolean;
  conflict?: string;
  suggestedUpgrade?: CapabilityName;
}

export interface CompatibilityReport {
  isCompatible: boolean;
  conflicts: CompatibilityEdge[];
  suggestedResolutions: {
    path: CapabilityName[];
    reason: string;
  }[];
}

export class ToolCapabilityCompatibilityGraph {
  private graph: Graph<CapabilityName, CompatibilityEdge>;

  constructor() {
    this.graph = new Graph<CapabilityName, CompatibilityEdge>();
  }

  public addCompatibility(
    source: CapabilityName,
    target: CapabilityName,
    compatible: boolean,
    conflict?: string,
    suggestedUpgrade?: CapabilityName
  ): void {
    const edge: CompatibilityEdge = {
      source,
      target,
      compatible,
      conflict,
      suggestedUpgrade,
    };
    this.graph.addEdge(source, target, edge);
  }

  public addConflict(
    capabilityA: CapabilityName,
    capabilityB: CapabilityName,
    conflictDescription: string,
    suggestedResolution: CapabilityName
  ): void {
    this.addCompatibility(
      capabilityA,
      capabilityB,
      false,
      conflictDescription,
      suggestedResolution
    );
    this.addCompatibility(
      capabilityB,
      capabilityA,
      false,
      conflictDescription,
      suggestedResolution
    );
  }

  public checkCompatibility(requiredCapabilities: CapabilityName[]): CompatibilityReport {
    if (requiredCapabilities.length === 0) {
      return {
        isCompatible: true,
        conflicts: [],
        suggestedResolutions: [],
      };
    }

    const conflicts: CompatibilityEdge[] = [];
    const uniqueCapabilities = Array.from(new Set(requiredCapabilities));

    // 1. Check all pairwise conflicts
    for (let i = 0; i < uniqueCapabilities.length; i++) {
      for (let j = i + 1; j < uniqueCapabilities.length; j++) {
        const capA = uniqueCapabilities[i];
        const capB = uniqueCapabilities[j];

        // Check A -> B
        const edgeAB = this.graph.getEdge(capA, capB);
        if (edgeAB && !edgeAB.compatible) {
          conflicts.push(edgeAB);
        }

        // Check B -> A (Though addConflict handles symmetry, this is safer)
        const edgeBA = this.graph.getEdge(capB, capA);
        if (edgeBA && !edgeBA.compatible) {
          // Avoid duplicating conflict reporting if the graph structure is perfectly symmetric
          if (!conflicts.some(c => c.source === capB && c.target === capA)) {
             conflicts.push(edgeBA);
          }
        }
      }
    }

    const isCompatible = conflicts.length === 0;
    const resolutions: {
        path: CapabilityName[];
        reason: string;
    }[] = [];

    if (!isCompatible) {
      // 2. Attempt to find minimal resolution paths (simplified: just report the conflicts)
      // A full shortest path/cycle detection for resolution is complex; here we suggest
      // removing one conflicting node or upgrading based on recorded suggestions.
      const conflictMap = new Map<string, CompatibilityEdge>();
      conflicts.forEach(conflict => {
        const key = `${conflict.source}-${conflict.target}`;
        if (!conflictMap.has(key)) {
            conflictMap.set(key, conflict);
        }
      });

      // For demonstration, we suggest removing one endpoint of the first found conflict
      if (conflicts.length > 0) {
        const firstConflict = conflicts[0];
        resolutions.push({
            path: [firstConflict.source, firstConflict.target],
            reason: `Conflict detected between ${firstConflict.source} and ${firstConflict.target}. Consider removing one or using the suggested upgrade: ${firstConflict.suggestedUpgrade || 'N/A'}.`
        });
      }
    }

    return {
      isCompatible,
      conflicts,
      suggestedResolutions: resolutions,
    };
  }
}
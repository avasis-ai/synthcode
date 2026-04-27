import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CapabilityMetadata {
  name: string;
  description: string;
  prerequisites: string[];
  conflicts_with: string[];
  requires_inputs: Record<string, { description: string }>;
  output_effects: string[];
}

export type DependencyGraph = Map<string, {
  metadata: CapabilityMetadata;
  dependencies: {
    requires: string[];
    conflicts: string[];
    is_prerequisite_for: string[];
  };
}>;

export class ToolCapabilityDependencyGraph {
  private graph: DependencyGraph;

  constructor() {
    this.graph = new Map<string, {
      metadata: CapabilityMetadata;
      dependencies: {
        requires: string[];
        conflicts: string[];
        is_prerequisite_for: string[];
      };
    }>();
  }

  addCapability(metadata: CapabilityMetadata): void {
    if (this.graph.has(metadata.name)) {
      throw new Error(`Capability ${metadata.name} already exists.`);
    }

    const dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    } = {
      requires: metadata.prerequisites,
      conflicts: metadata.conflicts_with,
      is_prerequisite_for: [],
    };

    this.graph.set(metadata.name, {
      metadata,
      dependencies,
    });
  }

  ingestCapabilities(metadataList: CapabilityMetadata[]): void {
    for (const metadata of metadataList) {
      this.addCapability(metadata);
    }
  }

  buildGraphStructure(): void {
    this.graph.clear();
    // First pass: Add all capabilities
    const metadataList: CapabilityMetadata[] = [];
    for (const [name, data] of this.graph.entries()) {
      metadataList.push(data.metadata);
    }

    // Reset and rebuild to correctly calculate mutual dependencies
    this.graph.clear();
    for (const metadata of metadataList) {
      const newGraphEntry: {
        metadata: CapabilityMetadata;
        dependencies: {
          requires: string[];
          conflicts: string[];
          is_prerequisite_for: string[];
        };
      } = {
        metadata,
        dependencies: {
          requires: metadata.prerequisites,
          conflicts: metadata.conflicts_with,
          is_prerequisite_for: [],
        },
      };
      this.graph.set(metadata.name, newGraphEntry);
    }

    // Second pass: Calculate 'is_prerequisite_for' relationships
    for (const [name, data] of this.graph.entries()) {
      const currentPrereqs = data.metadata.prerequisites;
      for (const prereqName of currentPrereqs) {
        if (this.graph.has(prereqName)) {
          const prereqData = this.graph.get(prereqName)!;
          prereqData.dependencies.is_prerequisite_for.push(name);
        } else {
          console.warn(`Prerequisite "${prereqName}" for capability "${name}" not found in graph.`);
        }
      }
    }
  }

  getCapability(name: string): {
    metadata: CapabilityMetadata;
    dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    };
  } | undefined {
    return this.graph.get(name);
  }

  findCapabilitiesRequiring(capabilityName: string): {
    metadata: CapabilityMetadata;
    dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    };
  }[] {
    const results: {
      metadata: CapabilityMetadata;
      dependencies: {
        requires: string[];
        conflicts: string[];
        is_prerequisite_for: string[];
      };
    }[] = [];

    for (const [name, data] of this.graph.entries()) {
      if (data.dependencies.requires.includes(capabilityName)) {
        results.push(data);
      }
    }
    return results;
  }

  findConflictingCapabilities(capabilityName: string): {
    metadata: CapabilityMetadata;
    dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    };
  }[] {
    const results: {
      metadata: CapabilityMetadata;
      dependencies: {
        requires: string[];
        conflicts: string[];
        is_prerequisite_for: string[];
      };
    }[] = [];

    for (const [name, data] of this.graph.entries()) {
      if (data.dependencies.conflicts.includes(capabilityName)) {
        results.push(data);
      }
    }
    return results;
  }

  findCapabilitiesUsing(capabilityName: string): {
    metadata: CapabilityMetadata;
    dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    };
  }[] {
    return this.findCapabilitiesRequiring(capabilityName);
  }

  findCapabilitiesPrerequisiteFor(capabilityName: string): {
    metadata: CapabilityMetadata;
    dependencies: {
      requires: string[];
      conflicts: string[];
      is_prerequisite_for: string[];
    };
  }[] {
    const data = this.getCapability(capabilityName);
    if (!data) {
      return [];
    }
    const results: {
      metadata: CapabilityMetadata;
      dependencies: {
        requires: string[];
        conflicts: string[];
        is_prerequisite_for: string[];
      };
    }[] = [];

    for (const [name, graphData] of this.graph.entries()) {
      if (graphData.dependencies.is_prerequisite_for.includes(name)) {
        results.push(graphData);
      }
    }
    return results;
  }
}
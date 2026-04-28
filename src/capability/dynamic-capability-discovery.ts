import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export interface CapabilityDescriptor {
  capabilityName: string;
  description: string;
  requiredInputs: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
    };
  };
  potentialSideEffects: string[];
  version: string;
}

export interface ProviderAdapter {
  discoverCapabilities(): Promise<CapabilityDescriptor[]>;
}

export interface CapabilityGraph {
  capabilities: Map<string, CapabilityDescriptor>;
  lastUpdated: Date;
}

export class CapabilityDiscoveryService {
  private providers: ProviderAdapter[];

  constructor(providers: ProviderAdapter[]) {
    this.providers = providers;
  }

  private resolveConflict(
    existing: CapabilityDescriptor,
    newDescriptor: CapabilityDescriptor
  ): CapabilityDescriptor {
    if (existing.version === newDescriptor.version) {
      return existing;
    }
    // Simple strategy: prefer the newer version or the one with more detailed inputs
    if (newDescriptor.version > existing.version) {
      return newDescriptor;
    }
    return existing;
  }

  private mergeDescriptors(
    graph: CapabilityGraph,
    descriptors: CapabilityDescriptor[]
  ): CapabilityGraph {
    const newCapabilities = new Map<string, CapabilityDescriptor>(graph.capabilities);

    for (const descriptor of descriptors) {
      const existing = newCapabilities.get(descriptor.capabilityName);
      if (existing) {
        newCapabilities.set(
          descriptor.capabilityName,
          this.resolveConflict(existing, descriptor)
        );
      } else {
        newCapabilities.set(
          descriptor.capabilityName,
          descriptor
        );
      }
    }

    return {
      capabilities: new Map(newCapabilities),
      lastUpdated: new Date(),
    };
  }

  public async discoverGraph(): Promise<CapabilityGraph> {
    let aggregatedGraph: CapabilityGraph = {
      capabilities: new Map(),
      lastUpdated: new Date(0),
    };

    const discoveryPromises = this.providers.map(
      async (adapter) => {
        try {
          const descriptors = await adapter.discoverCapabilities();
          return descriptors;
        } catch (error) {
          console.error(
            `Error discovering capabilities from provider: ${adapter.constructor.name}`,
            error
          );
          return [] as CapabilityDescriptor[];
        }
      }
    );

    const results = await Promise.all(discoveryPromises);

    let currentGraph: CapabilityGraph = aggregatedGraph;
    for (const descriptors of results) {
      currentGraph = this.mergeDescriptors(currentGraph, descriptors);
    }

    return currentGraph;
  }
}
import { ProjectContext } from "../context";
import { CapabilityRegistry } from "../capability/capability-registry";

export interface ServiceDescriptor {
  capabilityName: string;
  endpoint: string;
  description: string;
  requiredInputs: Record<string, { description: string; type: string }>;
  outputSchema: Record<string, { type: string; description: string }>;
}

export class ServiceDiscoveryService {
  private sources: (() => ServiceDescriptor[] | null)[];

  constructor() {
    this.sources = [];
  }

  registerSource(source: () => ServiceDescriptor[] | null): void {
    this.sources.push(source);
  }

  discover(context: ProjectContext): ServiceDescriptor[] {
    let discoveredDescriptors: ServiceDescriptor[] = [];
    for (const source of this.sources) {
      const descriptors = source();
      if (descriptors) {
        discoveredDescriptors = [...discoveredDescriptors, ...descriptors];
      }
    }
    return discoveredDescriptors;
  }
}

export class ToolCapabilityDiscoveryService {
  private discoveryService: ServiceDiscoveryService;
  private capabilityRegistry: CapabilityRegistry;

  constructor(discoveryService: ServiceDiscoveryService, capabilityRegistry: CapabilityRegistry) {
    this.discoveryService = discoveryService;
    this.capabilityRegistry = capabilityRegistry;
  }

  discoverAndRegister(context: ProjectContext): void {
    const descriptors = this.discoveryService.discover(context);
    for (const descriptor of descriptors) {
      this.capabilityRegistry.registerCapability(descriptor);
    }
  }
}
import { Tool } from "./tool";

export interface Capability {
  name: string;
  metadata: Record<string, any>;
  checkExistence(): boolean;
}

export class CapabilityDiscoveryManager {
  discoverAllCapabilities(tools: Tool[]): Map<string, Capability> {
    const capabilities = new Map<string, Capability>();

    for (const tool of tools) {
      if (typeof (tool as any).getCapabilities === 'function') {
        const toolCapabilities = (tool as any).getCapabilities();
        for (const capability of toolCapabilities) {
          if (!capabilities.has(capability.name)) {
            capabilities.set(capability.name, capability);
          }
        }
      }
    }

    return capabilities;
  }
}

export { CapabilityDiscoveryManager };
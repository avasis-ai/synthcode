import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CapabilityDescriptor {
  name: string;
  description: string;
  provides: string[];
  getCapabilityMetadata: () => Record<string, any>;
}

export class DynamicCapabilityRegistry {
  private capabilities: Map<string, CapabilityDescriptor> = new Map();

  registerCapability(descriptor: CapabilityDescriptor): void {
    if (this.capabilities.has(descriptor.name)) {
      console.warn(`Capability "${descriptor.name}" is already registered. Overwriting.`);
    }
    this.capabilities.set(descriptor.name, descriptor);
  }

  getCapability(name: string): CapabilityDescriptor | undefined {
    return this.capabilities.get(name);
  }

  getAllCapabilities(): CapabilityDescriptor[] {
    return Array.from(this.capabilities.values());
  }

  discoverCapabilities(toolInstances: any[]): Promise<CapabilityDescriptor[]> {
    return new Promise((resolve) => {
      const discoveredDescriptors: CapabilityDescriptor[] = [];

      for (const toolInstance of toolInstances) {
        if (typeof toolInstance.getCapabilities === 'function') {
          try {
            const capabilities = toolInstance.getCapabilities();
            if (Array.isArray(capabilities)) {
              for (const descriptor of capabilities) {
                if (descriptor instanceof CapabilityDescriptor) {
                  this.registerCapability(descriptor);
                  discoveredDescriptors.push(descriptor);
                } else {
                  console.error("Invalid capability descriptor provided by tool:", descriptor);
                }
              }
            }
          } catch (e) {
            console.error("Error discovering capabilities for a tool instance:", e);
          }
        }
      }
      resolve(discoveredDescriptors);
    });
  }
}
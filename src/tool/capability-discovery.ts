import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export interface CapabilityProvider {
  name: string;
  capabilities: Set<string>;
}

export class CapabilityDiscoveryManager {
  private providers: CapabilityProvider[];
  private capabilitiesMap: Map<string, Set<string>>;

  constructor(providers: CapabilityProvider[]) {
    this.providers = providers;
    this.capabilitiesMap = new Map();
    this.discoverCapabilities();
  }

  private discoverCapabilities(): void {
    for (const provider of this.providers) {
      for (const capability of provider.capabilities) {
        if (!this.capabilitiesMap.has(capability)) {
          this.capabilitiesMap.set(capability, new Set());
        }
        this.capabilitiesMap.get(capability)!.add(provider.name);
      }
    }
  }

  public getAvailableCapabilities(): Set<string> {
    const allCapabilities = new Set<string>();
    for (const capability of this.capabilitiesMap.keys()) {
      allCapabilities.add(capability);
    }
    return allCapabilities;
  }

  public findProvidersForCapability(capability: string): string[] {
    const providerNames = this.capabilitiesMap.get(capability);
    if (!providerNames) {
      return [];
    }
    return Array.from(providerNames);
  }

  public getProviderDetails(providerName: string): CapabilityProvider | undefined {
    return this.providers.find(p => p.name === providerName);
  }
}
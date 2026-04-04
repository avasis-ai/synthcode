import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Capability {
  name: string;
  description: string;
  []: string;
}

export interface ToolService {
  name: string;
  reportCapabilities(): Capability[];
}

export class CapabilityDiscoveryService {
  private registeredTools: ToolService[] = [];
  private discoveredCapabilities: Set<string> = new Set<string>();

  registerTool(tool: ToolService): void {
    this.registeredTools.push(tool);
  }

  discoverAllCapabilities(): string[] {
    this.discoveredCapabilities.clear();
    for (const tool of this.registeredTools) {
      const capabilities = tool.reportCapabilities();
      for (const cap of capabilities) {
        this.discoveredCapabilities.add(cap.name);
      }
    }
    return Array.from(this.discoveredCapabilities);
  }

  getCapabilityReport(): {
    capabilities: string[];
    promptBlock: string;
  } {
    const capabilities = this.discoverAllCapabilities();
    const capabilityList = capabilities.map((name) => `\n- ${name}`).join("\n");

    const promptBlock = `\n\n--- AVAILABLE CAPABILITIES ---\n` +
                         `The agent has access to the following functional capabilities: ${capabilityList}\n` +
                         `Use these capabilities to determine the necessary actions for the user request. If no capability is needed, proceed with text generation.\n` +
                         `-----------------------------\n`;

    return {
      capabilities: capabilities,
      promptBlock: promptBlock,
    };
  }
}
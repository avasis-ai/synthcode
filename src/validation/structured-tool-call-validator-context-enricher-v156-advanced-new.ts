import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ResourceUsage {
  resourceName: string;
  requiredAmount: number;
  unit: string;
}

interface CapabilityCompatibility {
  requiredCapability: string;
  isCompatible: boolean;
  reason?: string;
}

export interface AdvancedToolCallContext {
  messages: Message[];
  toolCall: {
    name: string;
    input: Record<string, unknown>;
  };
  resourceUsage: ResourceUsage[];
  capabilityCompatibility: CapabilityCompatibility[];
}

class ResourceUsageService {
  getUsage(toolName: string, input: Record<string, unknown>): ResourceUsage[] {
    if (toolName === "image_generator") {
      return [{ resourceName: "gpu_cycles", requiredAmount: 100, unit: "cycles" }];
    }
    if (toolName === "database_query") {
      const queryLength = (input["query"] as string)?.length ?? 0;
      return [{ resourceName: "db_read_ops", requiredAmount: queryLength / 10, unit: "ops" }];
    }
    return [];
  }
}

class CapabilityCompatibilityService {
  checkCompatibility(toolName: string, requiredCapability: string): CapabilityCompatibility[] {
    if (toolName === "image_generator" && requiredCapability === "high_res_image") {
      return [{ requiredCapability: "high_res_image", isCompatible: true }];
    }
    if (toolName === "database_query" && requiredCapability === "read_only") {
      return [{ requiredCapability: "read_only", isCompatible: true }];
    }
    return [{ requiredCapability: requiredCapability, isCompatible: false, reason: "Unknown capability mismatch" }];
  }
}

export class StructuredToolCallValidatorContextEnricher {
  private resourceService: ResourceUsageService;
  private capabilityService: CapabilityCompatibilityService;

  constructor() {
    this.resourceService = new ResourceUsageService();
    this.capabilityService = new CapabilityCompatibilityService();
  }

  enrichContext(
    messages: Message[],
    toolCall: { name: string; input: Record<string, unknown> }
  ): AdvancedToolCallContext {
    const resourceUsage = this.resourceService.getUsage(toolCall.name, toolCall.input);
    const capabilityCompatibility = this.capabilityService.checkCompatibility(
      toolCall.name,
      "default_required_capability" // Simplified for example
    );

    return {
      messages: messages,
      toolCall: toolCall,
      resourceUsage: resourceUsage,
      capabilityCompatibility: capabilityCompatibility,
    };
  }
}
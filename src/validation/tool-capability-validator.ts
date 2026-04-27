import { ProjectContext, CapabilityRegistry } from "../context/context";
import { ToolCall } from "../types/tool-call";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

class ToolCapabilityValidator {
  private capabilityRegistry: CapabilityRegistry;
  private projectContext: ProjectContext;

  constructor(capabilityRegistry: CapabilityRegistry, projectContext: ProjectContext) {
    this.capabilityRegistry = capabilityRegistry;
    this.projectContext = projectContext;
  }

  validate(toolCall: ToolCall): ValidationResult {
    const errors: string[] = [];
    const toolName = toolCall.name;

    if (!toolName) {
      errors.push("Tool call must specify a name.");
      return { isValid: false, errors };
    }

    if (!this.capabilityRegistry.isToolRegistered(toolName)) {
      errors.push(`Tool "${toolName}" is not registered in the capability registry.`);
    }

    const toolCapabilities = this.capabilityRegistry.getToolCapabilities(toolName);
    const requiredCapabilities = toolCall.requiredCapabilities || [];

    for (const requiredCap of requiredCapabilities) {
      if (!this.projectContext.isCapabilityAvailable(requiredCap)) {
        errors.push(`Tool "${toolName}" requires capability "${requiredCap}", which is not available in the current project context.`);
      }
    }

    if (this.capabilityRegistry.isDeprecated(toolName, this.projectContext.getProjectVersion())) {
      errors.push(`Tool "${toolName}" is deprecated for the current project version.`);
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}

export { ToolCapabilityValidator };
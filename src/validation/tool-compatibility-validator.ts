import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type ToolName = string;
type Version = string;

export interface ToolCallRequest {
  toolName: ToolName;
  toolVersion: Version;
  inputSchema: Record<string, unknown>;
}

export interface AgentContext {
  availableCapabilities: Record<ToolName, {
    version: Version;
    schema: Record<string, unknown>;
  }>;
  requiredSchemas: Record<string, Version>;
}

export interface CompatibilityIssue {
  checkName: string;
  severity: "ERROR" | "WARNING";
  message: string;
}

export interface CompatibilityReport {
  isValid: boolean;
  issues: CompatibilityIssue[];
}

export interface CompatibilityCheck {
  checkName: string;
  execute: (
    request: ToolCallRequest;
    context: AgentContext
  ) => CompatibilityIssue | null;
}

class ToolCompatibilityValidator {
  private checks: CompatibilityCheck[];

  constructor() {
    this.checks = [
      new CapabilityPresenceCheck(),
      new SchemaVersionCheck(),
      new DependencyVersionCheck(),
    ];
  }

  public validate(
    request: ToolCallRequest;
    context: AgentContext
  ): CompatibilityReport {
    const issues: CompatibilityIssue[] = [];

    for (const check of this.checks) {
      const issue = check.execute(request, context);
      if (issue) {
        issues.push(issue);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }
}

class CapabilityPresenceCheck implements CompatibilityCheck {
  checkName = "CapabilityPresenceCheck";

  execute(
    request: ToolCallRequest;
    context: AgentContext
  ): CompatibilityIssue | null {
    if (!context.availableCapabilities[request.toolName]) {
      return {
        checkName: this.checkName,
        severity: "ERROR",
        message: `Tool '${request.toolName}' is not available in the agent's capabilities.`,
      };
    }
    return null;
  }
}

class SchemaVersionCheck implements CompatibilityCheck {
  checkName = "SchemaVersionCheck";

  execute(
    request: ToolCallRequest;
    context: AgentContext
  ): CompatibilityIssue | null {
    const availableTool = context.availableCapabilities[request.toolName];
    if (!availableTool) return null;

    // Simple version comparison check (assuming semantic versioning comparison logic is complex,
    // we just check if the requested version matches the available major version for simplicity).
    const requestedMajor = request.toolVersion.split(".")[0];
    const availableMajor = availableTool.version.split(".")[0];

    if (requestedMajor !== availableMajor) {
      return {
        checkName: this.checkName,
        severity: "ERROR",
        message: `Version mismatch for '${request.toolName}'. Requested major version ${requestedMajor} does not match available major version ${availableMajor}.`,
      };
    }
    return null;
  }
}

class DependencyVersionCheck implements CompatibilityCheck {
  checkName = "DependencyVersionCheck";

  execute(
    request: ToolCallRequest;
    context: AgentContext
  ): CompatibilityIssue | null {
    // Placeholder logic: Check if the tool requires any schemas that are missing or outdated in the context.
    // In a real scenario, the ToolCallRequest would contain required dependencies.
    // For this implementation, we assume the tool requires a dependency 'user_profile'
    // and check if the context provides it.

    const requiredDependency = "user_profile";
    if (!context.requiredSchemas[requiredDependency]) {
      return {
        checkName: this.checkName,
        severity: "WARNING",
        message: `Tool '${request.toolName}' might require dependency '${requiredDependency}', but it is not defined in the current context.`,
      };
    }
    return null;
  }
}

export {ToolCompatibilityValidator};
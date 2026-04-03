import type { PermissionConfig } from "../types.js";

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

function matchPattern(pattern: string, toolName: string): boolean {
  if (!pattern.includes("*")) {
    return pattern === toolName;
  }
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(toolName);
}

export class PermissionEngine {
  private allowedPatterns: string[];
  private deniedPatterns: string[];
  private askPatterns: string[];
  private defaultAction: "allow" | "deny" | "ask";

  constructor(config?: PermissionConfig) {
    this.allowedPatterns = config?.allowedTools ?? [];
    this.deniedPatterns = config?.deniedTools ?? [];
    this.askPatterns = config?.askTools ?? [];
    this.defaultAction = config?.defaultAction ?? "allow";
  }

  check(toolName: string, _input?: Record<string, unknown>): PermissionResult {
    for (const pattern of this.deniedPatterns) {
      if (matchPattern(pattern, toolName)) {
        return { allowed: false, reason: `Tool '${toolName}' matches denied pattern '${pattern}'` };
      }
    }

    for (const pattern of this.allowedPatterns) {
      if (matchPattern(pattern, toolName)) {
        return { allowed: true };
      }
    }

    for (const pattern of this.askPatterns) {
      if (matchPattern(pattern, toolName)) {
        return { allowed: false, reason: "ask" };
      }
    }

    if (this.defaultAction === "deny") {
      return { allowed: false, reason: `Tool '${toolName}' not explicitly allowed` };
    }

    if (this.defaultAction === "ask") {
      return { allowed: false, reason: "ask" };
    }

    return { allowed: true };
  }

  addAllowed(pattern: string): void {
    this.allowedPatterns.push(pattern);
  }

  addDenied(pattern: string): void {
    this.deniedPatterns.push(pattern);
  }

  addAsk(pattern: string): void {
    this.askPatterns.push(pattern);
  }
}

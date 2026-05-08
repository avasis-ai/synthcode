import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

type Role = "user" | "assistant" | "tool" | "system";

interface RoleContext {
  sourceRole: Role;
  targetRole: Role;
  payload: Record<string, unknown>;
}

interface RoleSchema {
  [role: string]: (payload: Record<string, unknown>) => boolean;
}

class RoleHandshakeValidator {
  private schemas: Map<Role, RoleSchema>;

  constructor() {
    this.schemas = new Map();
    this.initializeSchemas();
  }

  private initializeSchemas() {
    // Define expected schemas for various roles
    // Example: When transitioning to 'tool', the payload must contain 'tool_id' and 'input_data'.
    this.schemas.set("tool", {
      (payload: Record<string, unknown>): boolean => {
        return typeof payload === 'object' && payload !== null &&
               'tool_id' in payload &&
               typeof (payload as any).tool_id === 'string' &&
               'input_data' in payload;
      }
    });

    // Example: When transitioning to 'user', the payload must be a string message.
    this.schemas.set("user", {
      (payload: Record<string, unknown>): boolean => {
        return typeof payload === 'string' && payload.length > 0;
      }
    });

    // Default schema for general roles
    this.schemas.set("assistant", {
      (payload: Record<string, unknown>): boolean => {
        return true; // Minimal check
      }
    });
  }

  validate(context: RoleContext): { isValid: boolean; message: string } {
    const { sourceRole, targetRole, payload } = context;

    if (!this.schemas.has(targetRole)) {
      return { isValid: false, message: `Unknown target role: ${targetRole}` };
    }

    const targetSchema = this.schemas.get(targetRole)!;

    // 1. Check if the payload conforms to the target role's schema
    const schemaCheck = targetSchema[targetRole](payload);
    if (!schemaCheck) {
      return {
        isValid: false,
        message: `Payload mismatch for target role '${targetRole}'. Expected structure not met.`,
      };
    }

    // 2. Check for authority conflicts (SourceRole must be allowed to send data to TargetRole)
    if (!this.isAuthorityValid(sourceRole, targetRole)) {
      return {
        isValid: false,
        message: `Authority conflict: Source role '${sourceRole}' is not authorized to handoff data to '${targetRole}'.`,
      };
    }

    return { isValid: true, message: "Handshake successful." };
  }

  private isAuthorityValid(source: Role, target: Role): boolean {
    // Define allowed transitions (Source -> Target)
    const allowedTransitions: Record<Role, Set<Role>> = {
      user: new Set(["assistant", "tool"]),
      assistant: new Set(["user", "tool"]),
      tool: new Set(["assistant"]),
      system: new Set(["assistant"]),
    };

    return allowedTransitions[source]?.has(target) ?? false;
  }
}

export const roleHandshakeValidator = new RoleHandshakeValidator();
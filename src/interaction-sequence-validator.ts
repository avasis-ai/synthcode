import { strict as assert } from "assert";

type Schema = Record<string, unknown>;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type SequenceDefinition = {
  step: {
    role: "user" | "assistant" | "tool";
    schema: Schema;
    allowed_next_roles: ("user" | "assistant" | "tool")[];
  };
  sequence: SequenceStep[];
};

export interface SequenceStep {
  role: "user" | "assistant" | "tool";
  schema: Schema;
  allowed_next_roles: ("user" | "assistant" | "tool")[];
}

export class InteractionSequenceValidator {
  private readonly sequenceDefinition: SequenceDefinition;

  constructor(sequenceDefinition: SequenceDefinition) {
    this.sequenceDefinition = sequenceDefinition;
  }

  private validateSchema(payload: Record<string, unknown>, schema: Schema): boolean {
    for (const key in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, key)) {
        const expectedType = schema[key];
        if (typeof expectedType === "string") {
          const expected = expectedType as "string" | "number" | "boolean" | "object";
          const actual = typeof (payload[key] as unknown);

          if (expected === "string" && actual !== "string") return false;
          if (expected === "number" && actual !== "number") return false;
          if (expected === "boolean" && actual !== "boolean") return false;
          if (expected === "object" && (actual !== "object" || payload[key] === null)) return false;
        }
      }
    }
    return true;
  }

  public validate(interactionHistory: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let currentStepIndex = 0;
    let lastRole: "user" | "assistant" | "tool" | null = null;

    if (interactionHistory.length === 0) {
      return { isValid: false, errors: ["Interaction history cannot be empty."] };
    }

    for (let i = 0; i < interactionHistory.length; i++) {
      const message = interactionHistory[i];
      const stepDef = this.sequenceDefinition.sequence[currentStepIndex];

      if (!stepDef) {
        errors.push(`Validation failed at step ${i}: No definition found for this step.`);
        break;
      }

      // 1. Role Check
      if (message.role !== stepDef.role) {
        errors.push(`Validation failed at step ${i}: Expected role "${stepDef.role}", but received "${message.role}".`);
      }

      // 2. Schema Check (Simplified check based on message structure)
      // In a real scenario, we would map Message to a payload and validate against schema.
      // For this exercise, we assume the message itself must conform to the schema structure.
      const payload = {
        role: message.role,
        content: message.role === "assistant" ? (message as AssistantMessage).content : message.content,
        // Add other relevant fields for schema validation
      };
      if (!this.validateSchema(payload, stepDef.schema)) {
        errors.push(`Validation failed at step ${i}: Payload does not match required schema.`);
      }

      // 3. Transition Check (Only check if this is not the first step)
      if (i > 0) {
        const previousStepDef = this.sequenceDefinition.sequence[currentStepIndex - 1];
        if (previousStepDef && !previousStepDef.allowed_next_roles.includes(message.role)) {
          errors.push(`Validation failed at step ${i}: Transition from previous step (${previousStepDef.role}) to current role (${message.role}) is disallowed.`);
        }
      }

      // 4. Advance State
      if (i < interactionHistory.length - 1) {
        const nextStepDef = this.sequenceDefinition.sequence[currentStepIndex + 1];
        if (nextStepDef && !stepDef.allowed_next_roles.includes(nextStepDef.role)) {
          errors.push(`Validation failed at step ${i}: Transition from current step (${stepDef.role}) to next step (${nextStepDef.role}) is disallowed.`);
        }
      }

      // Advance index only if the current step was successfully validated against its definition
      if (errors.length === 0 || i === interactionHistory.length - 1) {
        currentStepIndex++;
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}
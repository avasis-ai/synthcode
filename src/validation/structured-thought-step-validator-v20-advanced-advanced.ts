import { ValidatorBase, ValidationResult } from "./validator-base";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface ThoughtStep {
  payload: any;
  previousStepPayload: any | null;
}

export class StructuredThoughtStepValidatorV20AdvancedAdvanced extends ValidatorBase {
  validate(step: ThoughtStep): ValidationResult {
    const { payload, previousStepPayload } = step;
    const errors: string[] = [];

    if (!payload) {
      return { isValid: false, errors: ["Payload is required for validation."] };
    }

    // 1. Basic Payload Structure Validation (Example)
    if (typeof payload !== 'object' || payload === null) {
      errors.push("Payload must be a non-null object.");
    }

    // 2. Cross-Step Consistency Checks
    if (previousStepPayload) {
      // Example: Check if the current step requires a 'goal_id' that must exist in the previous step's context.
      const requiredGoalId = (payload as any)?.goal_id;
      if (requiredGoalId && typeof requiredGoalId === 'string' && !previousStepPayload['context']?.goal_id) {
        errors.push("Current step requires 'goal_id', but no 'goal_id' was found in the previous step's context.");
      }

      // Example: State Transition Check (e.g., if the previous step was a 'plan', the current step must be an 'execution' or 'refinement').
      const previousStepType = (previousStepPayload as any)?.step_type;
      const currentStepType = (payload as any)?.step_type;

      if (previousStepType === "plan" && currentStepType !== "execution" && currentStepType !== "refinement") {
        errors.push(`Invalid transition: After a 'plan' step, the next step must be 'execution' or 'refinement', but found '${currentStepType}'.`);
      }

      // Example: ID Dependency Check (e.g., if the current step uses a tool, the tool name must be known from the previous step's tool definitions).
      const currentToolUse = (payload as any)?.tool_use_id;
      if (currentToolUse && previousStepPayload?.tool_definitions && !previousStepPayload.tool_definitions.includes(currentToolUse)) {
        errors.push(`Tool ID '${currentToolUse}' used in the current step was not defined or available in the previous step's context.`);
      }
    }

    // 3. Specific Payload Content Validation (Example)
    if (payload.step_type === "plan" && !payload.steps_array?.length) {
      errors.push("Plan step must contain at least one step in 'steps_array'.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors: errors };
    }

    return { isValid: true, errors: [] };
  }
}
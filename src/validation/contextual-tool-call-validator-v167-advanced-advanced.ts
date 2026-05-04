import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface ValidationContext {
  history: Message[];
  currentGoal: string;
  currentState: Record<string, any>;
}

export class ContextualToolCallValidator {
  private context: ValidationContext;

  constructor(context: ValidationContext) {
    this.context = context;
  }

  private getSchemaValidator(toolName: string, toolInput: Record<string, unknown>): boolean {
    // Placeholder for actual schema validation logic (e.g., using Zod or JSON Schema)
    // In a real scenario, this would check toolInput against the tool's defined schema.
    console.log(`[Schema Check] Validating inputs for ${toolName}:`, toolInput);
    return true;
  }

  private checkContextualConsistency(toolName: string, toolInput: Record<string, unknown>): boolean {
    const { history, currentState } = this.context;

    // 1. User ID Consistency Check
    const requiredUserId = currentState.user_id;
    if (requiredUserId && toolInput.user_id !== requiredUserId) {
      console.error("[Contextual Error] User ID mismatch. Expected:", requiredUserId, "Got:", toolInput.user_id);
      return false;
    }

    // 2. State Dependency Check (Example: If tool requires 'document_id', check if it exists in state)
    if (toolName === "fetch_document" && typeof toolInput.document_id === 'undefined') {
      console.error("[Contextual Error] 'fetch_document' requires 'document_id' which is missing.");
      return false;
    }

    // 3. History Dependency Check (Example: If tool uses an ID from a previous tool call)
    const lastToolCall = history.filter(m => m.role === "tool").pop();
    if (toolName === "update_record" && lastToolCall && typeof toolInput.record_id === 'undefined') {
      console.warn("[Contextual Warning] 'update_record' might benefit from using the ID from the last tool result.");
    }

    return true;
  }

  private checkGoalAlignment(toolName: string, toolInput: Record<string, unknown>): boolean {
    const { currentGoal } = this.context;

    // Simple heuristic: Check if the tool name seems relevant to the overall goal.
    const goalLower = currentGoal.toLowerCase();
    const toolNameLower = toolName.toLowerCase();

    if (goalLower.includes("booking") && !toolNameLower.includes("book") && !toolNameLower.includes("calendar")) {
      console.warn(`[Goal Alignment Warning] Tool '${toolName}' might be irrelevant to the goal: "${currentGoal}"`);
    }

    return true;
  }

  public validate(toolName: string, toolInput: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Stage 1: Schema Validation
    if (!this.getSchemaValidator(toolName, toolInput)) {
      errors.push("Schema validation failed for tool arguments.");
    }

    // Stage 2: Contextual Consistency Check
    if (!this.checkContextualConsistency(toolName, toolInput)) {
      errors.push("Contextual consistency check failed (e.g., mismatched IDs or missing state data).");
    }

    // Stage 3: Goal Alignment Check
    if (!this.checkGoalAlignment(toolName, toolInput)) {
      // This is often a warning, but we treat it as a soft failure for demonstration
      errors.push("Goal alignment check suggests the tool might be off-topic.");
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors: errors.length > 0 ? errors : [],
    };
  }
}
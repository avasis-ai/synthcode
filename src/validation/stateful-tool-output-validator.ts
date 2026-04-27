import { Message, ToolResultMessage } from "./types";

export interface ValidationContext {
  history: Message[];
  // Add any other context needed for validation, e.g., session metadata
}

export interface StatefulOutputValidator {
  validate(
    toolOutput: ToolResultMessage,
    context: ValidationContext
  ): { isValid: boolean; message: string };
}

export class DefaultStatefulOutputValidator implements StatefulOutputValidator {
  validate(
    toolOutput: ToolResultMessage,
    context: ValidationContext
  ): { isValid: boolean; message: string } {
    if (!toolOutput.tool_use_id) {
      return { isValid: false, message: "Tool result is missing a tool_use_id." };
    }

    const history = context.history;

    if (history.length === 0) {
      return { isValid: true, message: "No history provided, basic validation passed." };
    }

    // Example stateful validation: Check if the tool output references an ID
    // that was successfully used in a previous tool call result.
    if (toolOutput.content.includes("reference_id:")) {
      const requiredId = toolOutput.content.split("reference_id:")[1]?.trim() || "";
      if (!requiredId) {
        return { isValid: false, message: "Tool output claims to reference an ID but none was found." };
      }

      const previousToolResults = history.filter(
        (msg): msg is ToolResultMessage => msg.role === "tool"
      );

      const foundMatch = previousToolResults.some(
        (result) => result.content.includes(requiredId)
      );

      if (!foundMatch) {
        return {
          isValid: false,
          message: `Tool output references ID '${requiredId}', but no matching ID was found in the previous tool results history.`,
        };
      }
    }

    // Add more complex state checks here (e.g., ensuring an ID returned here
    // matches the expected format from a previous step).

    return { isValid: true, message: "Stateful validation passed successfully." };
  }
}

export const createDefaultValidator = (): StatefulOutputValidator => {
  return new DefaultStatefulOutputValidator();
};
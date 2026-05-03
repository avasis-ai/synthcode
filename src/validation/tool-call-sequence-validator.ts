import { Message, ToolUseBlock } from "./types";

export class ToolCallSequenceValidator {
  private readonly context: Message[];

  constructor(context: Message[]) {
    this.context = context;
  }

  validate(proposedCalls: ToolUseBlock[]): void {
    const availableOutputs: Record<string, any> = {};
    let currentContext: Message[] = [...this.context];

    for (const call of proposedCalls) {
      const requiredInputs = this.extractRequiredInputs(call);
      const missingDependencies = this.checkDependencies(requiredInputs, availableOutputs);

      if (missingDependencies.length > 0) {
        throw new Error(
          `Tool call "${call.name}" requires missing dependencies: ${missingDependencies.join(", ")}.`
        );
      }

      // Simulate execution and store output (assuming successful execution for validation purposes)
      // In a real scenario, we would execute the tool and get the result.
      // Here, we just simulate that the tool call itself is 'available' for subsequent calls
      // if it's designed to pass its own ID or context.
      // For simplicity, we assume the output of a tool call is available under its ID.
      availableOutputs[call.id] = {
        result: "Simulated successful output",
        tool_use_id: call.id,
      };

      // Update context to include the result of this call for subsequent checks
      const resultMessage: Message = {
        role: "tool",
        tool_use_id: call.id,
        content: JSON.stringify(availableOutputs[call.id]),
      } as any; // Type assertion for simulation simplicity
      currentContext.push(resultMessage);
    }
  }

  private extractRequiredInputs(call: ToolUseBlock): Record<string, string> {
    // In a real system, this would involve inspecting the tool definition schema
    // to determine which parameters are mandatory and what they represent.
    // For this simulation, we assume any parameter that is not a simple string
    // or that needs context must be checked.
    const required: Record<string, string> = {};
    for (const key in call.input) {
      const value = call.input[key];
      if (typeof value === 'string' && value.length > 0) {
        required[key] = value;
      } else if (typeof value !== 'string') {
        // If it's not a string, we assume it might need context resolution
        required[key] = "CONTEXT_DEPENDENT";
      }
    }
    return required;
  }

  private checkDependencies(
    requiredInputs: Record<string, string>,
    availableOutputs: Record<string, any>
  ): string[] {
    const missing: string[] = [];

    for (const key in requiredInputs) {
      const value = requiredInputs[key];

      if (value === "CONTEXT_DEPENDENT") {
        // Check if the dependency can be sourced from previous tool outputs
        let found = false;
        for (const outputId in availableOutputs) {
          // Simple heuristic: if the key matches an output ID, assume dependency met
          if (outputId.includes(key)) {
            found = true;
            break;
          }
        }
        if (!found) {
          missing.push(`Context for parameter '${key}'`);
        }
      } else if (typeof value === 'string' && value.length > 0) {
        // If it's a direct string, we assume it's fine unless we implement stricter validation
      }
    }
    return missing;
  }
}
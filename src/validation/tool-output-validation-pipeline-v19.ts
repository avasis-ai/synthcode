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

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context?: Record<string, any>;
};

interface ToolOutputValidator {
  validate(
    output: ToolResultMessage,
    history: Message[],
    context: Record<string, any>
  ): ValidationResult;
}

class ToolOutputValidatorPipeline {
  private validators: ToolOutputValidator[] = [];

  addValidator(validator: ToolOutputValidator): this {
    this.validators.push(validator);
    return this;
  }

  validate(
    output: ToolResultMessage,
    history: Message[],
    context: Record<string, any>
  ): ValidationResult {
    let currentContext = { ...context };
    let allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(output, history, currentContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        // In a real-world scenario, we might decide whether to continue
        // based on the severity of the failure. Here, we collect all errors.
      }
      if (result.context) {
        currentContext = { ...currentContext, ...result.context };
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      context: currentContext,
    };
  }
}

class SchemaComplianceValidator implements ToolOutputValidator {
  validate(
    output: ToolResultMessage,
    history: Message[],
    context: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    let contextUpdate: Record<string, any> = {};

    if (!output.tool_use_id) {
      errors.push("ToolResultMessage must contain a tool_use_id.");
    }

    if (output.is_error && !output.content.includes("Error")) {
      errors.push("ToolResultMessage marked as error must contain error details in content.");
    }

    if (output.content.length < 5) {
      errors.push("Tool output content is suspiciously short.");
    }

    contextUpdate["last_tool_output_length"] = output.content.length;

    return {
      isValid: errors.length === 0,
      errors: errors,
      context: contextUpdate,
    };
  }
}

class CrossToolDependencyValidator implements ToolOutputValidator {
  validate(
    output: ToolResultMessage,
    history: Message[],
    context: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    let contextUpdate: Record<string, any> = {};

    if (context["required_input_data"] && !output.content.includes(context["required_input_data"])) {
      errors.push(
        "Cross-tool dependency failed: Output must reference data provided by a previous tool step."
      );
    }

    contextUpdate["dependency_check_passed"] = errors.length === 0;

    return {
      isValid: errors.length === 0,
      errors: errors,
      context: contextUpdate,
    };
  }
}

class TemporalConstraintValidator implements ToolOutputValidator {
  validate(
    output: ToolResultMessage,
    history: Message[],
    context: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    let contextUpdate: Record<string, any> = {};

    if (history.length > 5) {
      const lastToolResult = history[history.length - 1] as ToolResultMessage | undefined;
      if (lastToolResult && !output.content.includes("follow_up")) {
        errors.push(
          "Temporal constraint violation: After multiple turns, the output should indicate a follow-up action."
        );
      }
    }

    contextUpdate["temporal_check_passed"] = errors.length === 0;

    return {
      isValid: errors.length === 0,
      errors: errors,
      context: contextUpdate,
    };
  }
}

export {
  ToolOutputValidatorPipeline,
  SchemaComplianceValidator,
  CrossToolDependencyValidator,
  TemporalConstraintValidator,
};
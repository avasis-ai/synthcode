import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ToolContext {
  messages: Message[];
  toolName: string;
  toolInput: Record<string, unknown>;
}

interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    path?: string;
  }[];
  context: Record<string, unknown>;
}

type ValidationStep = (context: ToolContext, previousResults: ValidationResult) => ValidationResult;

class StructuredToolInputValidationPipelineV3 {
  private steps: ValidationStep[];

  constructor() {
    this.steps = [];
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  private runSteps(context: ToolContext, initialResult: ValidationResult): ValidationResult {
    let currentResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { ...context.toolInput },
    };

    for (const step of this.steps) {
      currentResult = step(context, currentResult);
    }
    return currentResult;
  }

  validate(context: ToolContext): ValidationResult {
    const initialResult: ValidationResult = {
      isValid: true,
      errors: [],
      context: { ...context.toolInput },
    };
    return this.runSteps(context, initialResult);
  }
}

const createPipeline = (): StructuredToolInputValidationPipelineV3 => {
  const pipeline = new StructuredToolInputValidationPipelineV3();

  // Step 1: Basic Schema Presence Check
  const basicSchemaCheck: ValidationStep = (context, previousResults) => {
    const input = context.toolInput;
    const errors: { field: string; message: string; path?: string }[] = [];

    if (typeof input.required_field !== 'string' || !input.required_field) {
      errors.push({ field: 'required_field', message: 'The required_field must be provided and be a non-empty string.' });
    }

    if (typeof input.user_id !== 'string' || !input.user_id) {
      errors.push({ field: 'user_id', message: 'User ID is mandatory for all tool calls.' });
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...previousResults.context, ...input },
    };
    return result;
  };

  // Step 2: Cross-Field Dependency Check (Role-based logic)
  const dependencyCheck: ValidationStep = (context, previousResults) => {
    const input = context.toolInput;
    const errors: { field: string; message: string; path?: string }[] = [];

    if (previousResults.errors.some(e => e.field === 'user_id')) {
      // If user_id failed, skip complex role checks that depend on it
      return { isValid: true, errors: [], context: previousResults.context };
    }

    const userRole = input.user_role as string | undefined;
    const departmentId = input.department_id as string | undefined;

    if (userRole === 'admin' && (!departmentId || typeof departmentId !== 'string')) {
      errors.push({ field: 'department_id', message: 'Admins must specify a department_id for auditing purposes.' });
    }

    if (userRole === 'guest' && input.department_id) {
      errors.push({ field: 'department_id', message: 'Guest users cannot specify a department_id.' });
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...previousResults.context },
    };
    return result;
  };

  // Step 3: Dynamic Value Constraint Check (e.g., ID format)
  const formatCheck: ValidationStep = (context, previousResults) => {
    const input = context.toolInput;
    const errors: { field: string; message: string; path?: string }[] = [];

    const userId = input.user_id as string | undefined;
    const requiredField = input.required_field as string | undefined;

    if (userId && !/^[a-zA-Z0-9]{8,16}$/.test(userId)) {
      errors.push({ field: 'user_id', message: 'User ID must be alphanumeric and between 8 and 16 characters.' });
    }

    if (requiredField && !/^[A-Z]{3,5}$/.test(requiredField)) {
      errors.push({ field: 'required_field', message: 'Required field must be 3 to 5 uppercase letters.' });
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors: errors,
      context: { ...previousResults.context },
    };
    return result;
  };

  pipeline.addStep(basicSchemaCheck);
  pipeline.addStep(dependencyCheck);
  pipeline.addStep(formatCheck);

  return pipeline;
};

export const structuredToolInputValidationPipelineV3 = createPipeline();
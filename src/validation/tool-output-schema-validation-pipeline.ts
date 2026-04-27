import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  coercedOutput: any;
}

export type ValidationError = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export interface ValidatorStep {
  execute(
    data: any,
    schema: object,
    context: {
      errors: ValidationError[];
      coercedData: any;
    }
  ): {
    data: any;
    context: {
      errors: ValidationError[];
      coercedData: any;
    };
  };
}

class ToolOutputSchemaValidationPipeline {
  private steps: ValidatorStep[];

  constructor() {
    this.steps = [];
  }

  addStep(step: ValidatorStep): void {
    this.steps.push(step);
  }

  private runPipeline(
    initialData: any,
    schema: object
  ): ValidationResult {
    let currentData: any = initialData;
    let context: {
      errors: ValidationError[];
      coercedData: any;
    } = {
      errors: [],
      coercedData: initialData,
    };

    for (const step of this.steps) {
      const result = step.execute(currentData, schema, context);
      currentData = result.data;
      context = result.context;
    }

    const isValid = context.errors.length === 0;
    return {
      isValid,
      errors: context.errors.map(e => e.message),
      coercedOutput: context.coercedData,
    };
  }

  public validate(output: any, schema: object): ValidationResult {
    return this.runPipeline(output, schema);
  }
}

class TypeCoercionStep implements ValidatorStep {
  execute(
    data: any,
    schema: object,
    context: {
      errors: ValidationError[];
      coercedData: any;
    }
  ): {
    data: any;
    context: {
      errors: ValidationError[];
      coercedData: any;
    };
  } {
    const coercedData: any = { ...data };
    // Simplified coercion: attempts to convert string representations of numbers/booleans
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          if (typeof value === 'string') {
            if (!isNaN(Number(value))) {
              coercedData[key] = Number(value);
            } else if (value.toLowerCase() === 'true') {
              coercedData[key] = true;
            } else if (value.toLowerCase() === 'false') {
              coercedData[key] = false;
            }
          }
        }
      }
    }
    return {
      data: coercedData,
      context: {
        errors: [...context.errors],
        coercedData: coercedData,
      },
    };
  }
}

class RequiredFieldStep implements ValidatorStep {
  execute(
    data: any,
    schema: object,
    context: {
      errors: ValidationError[];
      coercedData: any;
    }
  ): {
    data: any;
    context: {
      errors: ValidationError[];
      coercedData: any;
    };
  } {
    const requiredFields = schema.required || [];
    const currentErrors: ValidationError[] = [];

    for (const field of requiredFields) {
      if (typeof data !== 'object' || data === null || !(field in data) || data[field] === undefined || data[field] === null) {
        currentErrors.push({
          path: field,
          message: `${field} is required but missing or null.`,
          severity: "error",
        });
      }
    }

    const newContext: {
      errors: ValidationError[];
      coercedData: any;
    } = {
      errors: [...context.errors, ...currentErrors],
      coercedData: context.coercedData,
    };

    return {
      data: data,
      context: newContext,
    };
  }
}

class TypeCheckStep implements ValidatorStep {
  execute(
    data: any,
    schema: object,
    context: {
      errors: ValidationError[];
      coercedData: any;
    }
  ): {
    data: any;
    context: {
      errors: ValidationError[];
      coercedData: any;
    };
  } {
    const currentErrors: ValidationError[] = [];
    const schemaType = schema.type;

    if (!schemaType) {
      return {
        data: data,
        context: {
          errors: [...context.errors],
          coercedData: context.coercedData,
        },
      };
    }

    const actualType = typeof data;

    if (schemaType === "string" && actualType !== "string") {
      currentErrors.push({
        path: "root",
        message: `Expected type 'string', but got '${actualType}'.`,
        severity: "error",
      });
    } else if (schemaType === "number" && actualType !== "number") {
      currentErrors.push({
        path: "root",
        message: `Expected type 'number', but got '${actualType}'.`,
        severity: "error",
      });
    } else if (schemaType === "object" && (actualType !== "object" || data === null)) {
      currentErrors.push({
        path: "root",
        message: `Expected type 'object', but got '${actualType}'.`,
        severity: "error",
      });
    }

    const newContext: {
      errors: ValidationError[];
      coercedData: any;
    } = {
      errors: [...context.errors, ...currentErrors],
      coercedData: context.coercedData,
    };

    return {
      data: data,
      context: newContext,
    };
  }
}

export const createToolOutputValidationPipeline = (): ToolOutputSchemaValidationPipeline => {
  const pipeline = new ToolOutputSchemaValidationPipeline();
  pipeline.addStep(new TypeCoercionStep());
  pipeline.addStep(new RequiredFieldStep());
  pipeline.addStep(new TypeCheckStep());
  return pipeline;
};
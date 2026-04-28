import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface SchemaContext {
  schema: Record<string, any>;
  payload: Record<string, unknown>;
}

export interface StructuredToolOutputValidator {
  validate(context: SchemaContext, payload: Record<string, unknown>): ValidationError[];
}

export interface TemporalConstraint {
  check(context: SchemaContext, payload: Record<string, unknown>): ValidationError[];
}

export interface CrossFieldConstraint {
  check(context: SchemaContext, payload: Record<string, unknown>): ValidationError[];
}

class StructuredToolOutputValidatorImpl implements StructuredToolOutputValidator {
  private constraints: TemporalConstraint[] = [];
  private crossFieldConstraints: CrossFieldConstraint[] = [];

  addTemporalConstraint(constraint: TemporalConstraint): this {
    this.constraints.push(constraint);
    return this;
  }

  addCrossFieldConstraint(constraint: CrossFieldConstraint): this {
    this.crossFieldConstraints.push(constraint);
    return this;
  }

  validate(context: SchemaContext, payload: Record<string, unknown>): ValidationError[] {
    let errors: ValidationError[] = [];

    for (const constraint of this.constraints) {
      errors = errors.concat(constraint.check(context, payload));
    }

    for (const constraint of this.crossFieldConstraints) {
      errors = errors.concat(constraint.check(context, payload));
    }

    return errors;
  }
}

export class StructuredToolOutputValidationPipelineBuilder {
  private validator: StructuredToolOutputValidatorImpl = new StructuredToolOutputValidatorImpl();

  private constructor() {}

  private static getInstance(): StructuredToolOutputValidationPipelineBuilder {
    if (!StructuredToolOutputValidationPipelineBuilder.instance) {
      StructuredToolOutputValidationPipelineBuilder.instance = new StructuredToolOutputValidationPipelineBuilder();
    }
    return StructuredToolOutputValidationPipelineBuilder.instance;
  }

  public static getInstance(): StructuredToolOutputValidationPipelineBuilder {
    return StructuredToolOutputValidationPipelineBuilder.getInstance();
  }

  public addValidator(validator: StructuredToolOutputValidator): this {
    // In a real scenario, we might compose validators, but here we assume
    // the builder manages specialized constraint validators.
    return this;
  }

  public addTemporalConstraint(constraint: TemporalConstraint): this {
    this.validator.addTemporalConstraint(constraint);
    return this;
  }

  public addCrossFieldConstraint(constraint: CrossFieldConstraint): this {
    this.validator.addCrossFieldConstraint(constraint);
    return this;
  }

  public build(): StructuredToolOutputValidator {
    return this.validator;
  }
}

export const buildStructuredToolOutputValidationPipeline = (): StructuredToolOutputValidator => {
  return StructuredToolOutputValidationPipelineBuilder.getInstance().build();
};

class BasicTypeValidator implements StructuredToolOutputValidator {
  validate(context: SchemaContext, payload: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];
    const schema = context.schema;
    const payloadKeys = Object.keys(payload);

    for (const key of payloadKeys) {
      const schemaDef = schema[key];
      const value = payload[key];

      if (!schemaDef) continue;

      if (schemaDef.type === "string" && typeof value !== "string") {
        errors.push({ field: key, message: `Expected string, got ${typeof value}`, severity: "error" });
      } else if (schemaDef.type === "number" && typeof value !== "number") {
        errors.push({ field: key, message: `Expected number, got ${typeof value}`, severity: "error" });
      }
      // Add more basic type checks as needed
    }
    return errors;
  }
}

class TemporalConsistencyValidator implements TemporalConstraint {
  check(context: SchemaContext, payload: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];
    const { schema, payload } = context;

    // Example: Check if 'endTime' is after 'startTime'
    if (schema.startTime && schema.endTime && payload.startTime && payload.endTime) {
      const startTime = new Date(payload.startTime).getTime();
      const endTime = new Date(payload.endTime).getTime();

      if (isNaN(startTime) || isNaN(endTime)) {
        errors.push({ field: "temporal", message: "Invalid date format provided.", severity: "error" });
        return errors;
      }

      if (endTime < startTime) {
        errors.push({ field: "temporal", message: "End time cannot be before start time.", severity: "error" });
      }
    }
    return errors;
  }
}

class CrossFieldConstraintValidator implements CrossFieldConstraint {
  check(context: SchemaContext, payload: Record<string, unknown>): ValidationError[] {
    const errors: ValidationError[] = [];
    const { schema, payload } = context;

    // Example: If 'status' is 'COMPLETED', 'completionDate' must exist.
    if (schema.status && schema.completionDate && payload.status && payload.completionDate) {
      if (payload.status === "COMPLETED" && !payload.completionDate) {
        errors.push({ field: "completionDate", message: "Completion date is required when status is COMPLETED.", severity: "error" });
      }
    }
    return errors;
  }
}

export const validateStructuredToolOutput = (
  payload: Record<string, unknown>,
  schema: Record<string, any>,
  temporalConstraints: TemporalConstraint[] = [],
  crossFieldConstraints: CrossFieldConstraint[] = []
): ValidationReport => {
  const context: SchemaContext = { schema, payload };
  const pipelineBuilder = StructuredToolOutputValidationPipelineBuilder.getInstance();

  let validator = pipelineBuilder
    .addTemporalConstraint(...temporalConstraints)
    .addCrossFieldConstraint(...crossFieldConstraints)
    .build();

  // We combine basic type validation with the specialized pipeline execution
  const basicValidator = new BasicTypeValidator();
  
  const typeErrors = basicValidator.validate(context, payload);
  const constraintErrors = validator.validate(context, payload);

  const allErrors: ValidationError[] = [...typeErrors, ...constraintErrors];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};
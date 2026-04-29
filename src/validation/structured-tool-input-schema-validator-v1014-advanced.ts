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

type SchemaDefinition = Record<string, any>;

interface ValidationContext {
  input: Record<string, unknown>;
  schema: SchemaDefinition;
}

type ValidatorStep = (context: ValidationContext) => {
  isValid: boolean;
  errors: string[];
};

class AdvancedSchemaValidator {
  private steps: ValidatorStep[] = [];

  private constructor() {}

  public static getInstance(): AdvancedSchemaValidator {
    if (!AdvancedSchemaValidator.instance) {
      AdvancedSchemaValidator.instance = new AdvancedSchemaValidator();
    }
    return AdvancedSchemaValidator.instance;
  }

  public addStep(step: ValidatorStep): this {
    this.steps.push(step);
    return this;
  }

  public validate(input: Record<string, unknown>, schema: SchemaDefinition): {
    isValid: boolean;
    errors: string[];
  } {
    const context: ValidationContext = { input, schema };
    let allErrors: string[] = [];
    let allValid = true;

    for (const step of this.steps) {
      const result = step(context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }
}

export class StructuredToolInputSchemaValidator {
  private static instance: AdvancedSchemaValidator;

  private constructor() {
    this.instance = AdvancedSchemaValidator.getInstance();
  }

  public static getInstance(): StructuredToolInputSchemaValidator {
    if (!StructuredToolInputSchemaValidator.instance) {
      StructuredToolInputSchemaValidator.instance = new StructuredToolInputSchemaValidator();
    }
    return StructuredToolInputSchemaValidator.instance;
  }

  public withCrossFieldDependencyCheck(
    dependencyCheck: (context: ValidationContext) => {
      isValid: boolean;
      errors: string[];
    }
  ): this {
    return this.addStep(dependencyCheck);
  }

  public withTemporalOrderingCheck(
    check: (context: ValidationContext) => {
      isValid: boolean;
      errors: string[];
    }
  ): this {
    return this.addStep(check);
  }

  private addStep(step: ValidatorStep): this {
    (this.instance as any).addStep(step);
    return this;
  }

  public validate(input: Record<string, unknown>, schema: SchemaDefinition): {
    isValid: boolean;
    errors: string[];
  } {
    return this.instance.validate(input, schema);
  }
}
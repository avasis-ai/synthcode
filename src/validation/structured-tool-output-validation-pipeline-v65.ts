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
  details?: Record<string, any>;
};

interface SchemaDefinition {
  [key: string]: any;
}

interface ValidationStep {
  execute: (data: Record<string, unknown>, context: { schema: SchemaDefinition; baseline: SchemaDefinition }) => Promise<ValidationResult>;
}

class SchemaConflictResolver {
  static resolve(
    errors1: string[],
    errors2: string[]
  ): string[] {
    const combined = [...errors1, ...errors2];
    const uniqueErrors = Array.from(new Set(combined));
    return uniqueErrors;
  }
}

class SchemaEvolutionCheck {
  static async check(
    currentSchema: SchemaDefinition,
    baselineSchema: SchemaDefinition
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const keys1 = Object.keys(currentSchema);
    const keys2 = Object.keys(baselineSchema);

    const missingInBaseline = keys1.filter(key => !(key in baselineSchema));
    if (missingInBaseline.length > 0) {
      errors.push(
        `Schema Drift Detected: Field(s) ${missingInBaseline.join(", ")} present in current schema but missing in baseline.`
      );
    }

    const extraInBaseline = keys2.filter(key => !(key in currentSchema));
    if (extraInBaseline.length > 0) {
      errors.push(
        `Schema Drift Detected: Field(s) ${extraInBaseline.join(", ")} present in baseline but missing in current schema.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];
  private baselineSchema: SchemaDefinition;

  constructor(steps: ValidationStep[], baselineSchema: SchemaDefinition) {
    this.steps = steps;
    this.baselineSchema = baselineSchema;
  }

  public async validate(
    data: Record<string, unknown>
  ): Promise<ValidationResult> {
    let currentResult: ValidationResult = {
      isValid: true,
      errors: [],
    };

    // 1. Schema Evolution Check (Pre-validation)
    const evolutionResult = await SchemaEvolutionCheck.check(
      {} as SchemaDefinition, // Assuming current schema is passed or derived
      this.baselineSchema
    );
    if (!evolutionResult.isValid) {
      return {
        isValid: false,
        errors: [`Schema Evolution Failure: ${evolutionResult.errors.join("; ")}`],
      };
    }

    let accumulatedErrors: string[] = [];
    let currentData: Record<string, unknown> = data;

    // 2. Execute core validation steps
    for (const step of this.steps) {
      const result = await step.execute(currentData, {
        schema: {} as SchemaDefinition, // Placeholder for actual schema context
        baseline: this.baselineSchema,
      });

      if (!result.isValid) {
        accumulatedErrors = SchemaConflictResolver.resolve(
          accumulatedErrors,
          result.errors
        );
      }
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
    };
  }
}

export {
  StructuredToolOutputValidationPipeline,
  SchemaConflictResolver,
  SchemaEvolutionCheck,
};
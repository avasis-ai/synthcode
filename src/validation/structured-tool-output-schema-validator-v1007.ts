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

interface TemporalConstraint {
  fieldA: keyof Record<string, unknown>;
  fieldB: keyof Record<string, unknown>;
  comparison: "greater_than" | "less_than" | "equals";
  dependency: {
    sourceField: keyof Record<string, unknown>;
    sourceType: "field" | "timestamp";
  };
}

interface DependencyConstraint {
  field: keyof Record<string, unknown>;
  dependsOn: {
    sourceField: keyof Record<string, unknown>;
    sourceType: "field" | "timestamp";
  };
  validator: (value: unknown, context: { data: Record<string, unknown>; history: Record<string, unknown> }) => boolean;
}

interface StructuredSchemaValidator {
  validate(
    data: Record<string, unknown>,
    context: { history: Record<string, unknown> }
  ): { isValid: boolean; errors: string[] };
}

class StructuredToolOutputSchemaValidatorV1007 implements StructuredSchemaValidator {
  private constraints: {
    temporal: TemporalConstraint[];
    dependencies: DependencyConstraint[];
  };

  constructor(constraints: {
    temporal: TemporalConstraint[];
    dependencies: DependencyConstraint[];
  }) {
    this.constraints = {
      temporal: constraints.temporal,
      dependencies: constraints.dependencies,
    };
  }

  private validateTemporalConstraints(data: Record<string, unknown>, context: { history: Record<string, unknown> }): string[] {
    const errors: string[] = [];
    for (const constraint of this.constraints.temporal) {
      const valueA = data[constraint.fieldA];
      const valueB = data[constraint.fieldB];

      if (valueA === undefined || valueB === undefined) continue;

      let comparisonResult = false;
      try {
        const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA));
        const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB));

        switch (constraint.comparison) {
          case "greater_than":
            comparisonResult = numA > numB;
            break;
          case "less_than":
            comparisonResult = numA < numB;
            break;
          case "equals":
            comparisonResult = numA === numB;
            break;
        }

        if (!comparisonResult) {
          errors.push(
            `Temporal constraint failed: ${constraint.fieldA} (${valueA}) must be ${constraint.comparison} ${constraint.fieldB} (${valueB}). Dependency check: ${constraint.dependency.sourceField} (${constraint.dependency.sourceType}).`
          );
        }
      } catch (e) {
        errors.push(`Error evaluating temporal constraint between ${constraint.fieldA} and ${constraint.fieldB}: ${(e as Error).message}`);
      }
    }
    return errors;
  }

  private validateDependencyConstraints(data: Record<string, unknown>, context: { history: Record<string, unknown> }): string[] {
    const errors: string[] = [];
    for (const constraint of this.constraints.dependencies) {
      const value = data[constraint.field];
      if (value === undefined) continue;

      const { sourceField, sourceType } = constraint.dependsOn;
      let contextValue: unknown = undefined;

      if (sourceType === "field") {
        contextValue = context.history[sourceField];
      } else if (sourceType === "timestamp") {
        contextValue = context.history[sourceField] || Date.now();
      }

      if (contextValue === undefined) {
        errors.push(`Dependency check failed for field ${String(constraint.field)}: Source field ${String(sourceField)} not found in history.`);
        continue;
      }

      if (!constraint.validator(value, { data, history: context.history })) {
        errors.push(
          `Dependency constraint failed for field ${String(constraint.field)}. Value ${JSON.stringify(value)} violates rule dependent on ${String(sourceField)} (${sourceType}).`
        );
      }
    }
    return errors;
  }

  validate(data: Record<string, unknown>, context: { history: Record<string, unknown> }): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    // 1. Validate Temporal Constraints
    const temporalErrors = this.validateTemporalConstraints(data, context);
    allErrors.push(...temporalErrors);

    // 2. Validate Cross-Field Dependencies
    const dependencyErrors = this.validateDependencyConstraints(data, context);
    allErrors.push(...dependencyErrors);

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

export { StructuredToolOutputSchemaValidatorV1007 };
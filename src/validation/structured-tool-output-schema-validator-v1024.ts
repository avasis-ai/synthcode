import {
  StructuredToolOutputSchemaValidatorV1023,
  ValidationContext,
  ValidationResult,
} from "./structured-tool-output-schema-validator-v1023";

type TemporalConstraint = {
  field: string;
  check: (value: any, context: ValidationContext) => boolean;
  message: string;
};

type CrossToolDependency = {
  sourceToolId: string;
  targetToolId: string;
  check: (sourceOutput: any, targetOutput: any) => boolean;
  message: string;
};

interface AdvancedValidationOptions extends ValidationOptions {
  temporalConstraints?: TemporalConstraint[];
  crossToolDependencies?: CrossToolDependency[];
}

export class StructuredToolOutputSchemaValidatorV1024 extends StructuredToolOutputSchemaValidatorV1023 {
  private temporalConstraints: TemporalConstraint[] = [];
  private crossToolDependencies: CrossToolDependency[] = [];

  constructor(options: AdvancedValidationOptions) {
    super(options);
    if (options.temporalConstraints) {
      this.temporalConstraints = options.temporalConstraints;
    }
    if (options.crossToolDependencies) {
      this.crossToolDependencies = options.crossToolDependencies;
    }
  }

  public addTemporalConstraint(constraint: TemporalConstraint): this {
    this.temporalConstraints.push(constraint);
    return this;
  }

  public addCrossToolDependency(dependency: CrossToolDependency): this {
    this.crossToolDependencies.push(dependency);
    return this;
  }

  public validate(
    data: Record<string, unknown>,
    context: ValidationContext,
  ): ValidationResult {
    let result = super.validate(data, context);

    if (result.isValid) {
      this.validateTemporalConstraints(data, context);
      this.validateCrossToolDependencies(data, context);
    }

    return result;
  }

  private validateTemporalConstraints(
    data: Record<string, unknown>,
    context: ValidationContext,
  ): void {
    for (const constraint of this.temporalConstraints) {
      const value = data[constraint.field];
      if (value !== undefined) {
        if (!constraint.check(value, context)) {
          context.addError(
            `Temporal constraint failed for field '${constraint.field}': ${constraint.message}`,
          );
        }
      }
    }
  }

  private validateCrossToolDependencies(
    data: Record<string, unknown>,
    context: ValidationContext,
  ): void {
    for (const dependency of this.crossToolDependencies) {
      const sourceOutput = data[dependency.sourceToolId];
      const targetOutput = data[dependency.targetToolId];

      if (sourceOutput && targetOutput) {
        if (!dependency.check(sourceOutput, targetOutput)) {
          context.addError(
            `Cross-tool dependency failed between '${dependency.sourceToolId}' and '${dependency.targetToolId}': ${dependency.message}`,
          );
        }
      }
    }
  }
}
import {
  StructuredToolOutputSchemaValidatorV1014,
  ConflictDetail,
  Context,
  SchemaSource,
} from "./structured-tool-output-schema-validator-v1014.js";

export interface SchemaEvolutionStrategy {
  resolveConflict(conflict: ConflictDetail, context: Context): unknown;
  mergeSchemas(schemas: SchemaSource[]): Record<string, unknown>;
}

export class AdvancedStructuredToolOutputSchemaValidatorV1014 extends StructuredToolOutputSchemaValidatorV1014 {
  private evolutionStrategy: SchemaEvolutionStrategy;

  constructor(evolutionStrategy: SchemaEvolutionStrategy) {
    super();
    this.evolutionStrategy = evolutionStrategy;
  }

  public resolveConflict(conflict: ConflictDetail, context: Context): unknown {
    return this.evolutionStrategy.resolveConflict(conflict, context);
  }

  public validateWithEvolution(
    schemaSources: SchemaSource[],
    context: Context,
    data: unknown
  ): { isValid: boolean; mergedSchema: unknown; errors: string[] } {
    const mergedSchema = this.evolutionStrategy.mergeSchemas(schemaSources);

    const validationResult = this.validate(mergedSchema, data, context);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        mergedSchema: mergedSchema,
        errors: ["Validation failed after schema merging. See details for conflicts."],
      };
    }

    return {
      isValid: true,
      mergedSchema: mergedSchema,
      errors: [],
    };
  }
}
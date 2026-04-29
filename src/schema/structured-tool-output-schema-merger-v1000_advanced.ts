import { z } from "zod";

export enum ConflictResolutionStrategy {
  KeepA = "keep_a",
  KeepB = "keep_b",
  Overwrite = "overwrite",
  SemanticMerge = "semantic_merge",
  MajorityVote = "majority_vote",
}

export interface SchemaField {
  description: string;
  required: boolean;
  schema: z.ZodTypeAny;
}

export interface StructuredSchema {
  properties: Record<string, SchemaField>;
  required: string[];
}

export class StructuredToolOutputSchemaMerger {
  private readonly defaultStrategy: ConflictResolutionStrategy;

  constructor(defaultStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.Overwrite) {
    this.defaultStrategy = defaultStrategy;
  }

  private resolveConflict(
    key: string,
    fieldA: SchemaField,
    fieldB: SchemaField,
    strategy: ConflictResolutionStrategy
  ): SchemaField {
    switch (strategy) {
      case ConflictResolutionStrategy.KeepA:
        return fieldA;
      case ConflictResolutionStrategy.KeepB:
        return fieldB;
      case ConflictResolutionStrategy.Overwrite:
        // Simple overwrite: B wins
        return fieldB;
      case ConflictResolutionStrategy.SemanticMerge:
        // Placeholder for complex semantic merge logic (e.g., merging enums, combining union types)
        // For simplicity, we'll prioritize B but log a warning in a real system.
        console.warn(`Semantic merge applied for field '${key}'. Using B's definition.`);
        return fieldB;
      case ConflictResolutionStrategy.MajorityVote:
        // Placeholder for majority vote (requires analyzing multiple sources, not just two)
        console.warn(`Majority vote applied for field '${key}'. Using B's definition as fallback.`);
        return fieldB;
      default:
        return fieldB;
    }
  }

  public mergeSchemas(
    schemaA: StructuredSchema,
    schemaB: StructuredSchema,
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.Overwrite
  ): StructuredSchema {
    const mergedProperties: Record<string, SchemaField> = { ...schemaA.properties };
    const allKeys = new Set<string>([
      ...Object.keys(schemaA.properties),
      ...Object.keys(schemaB.properties),
    ]);

    for (const key of allKeys) {
      const fieldA = schemaA.properties[key];
      const fieldB = schemaB.properties[key];

      if (!fieldA && !fieldB) continue;

      if (!fieldA) {
        mergedProperties[key] = {
          description: fieldB.description,
          required: fieldB.required,
          schema: fieldB.schema,
        };
      } else if (!fieldB) {
        // Field only exists in A, keep A's definition
        continue;
      } else {
        // Conflict resolution needed
        const resolvedField = this.resolveConflict(key, fieldA, fieldB, strategy);
        mergedProperties[key] = {
          description: resolvedField.description,
          required: resolvedField.required,
          schema: resolvedField.schema,
        };
      }
    }

    const mergedRequired = new Set<string>(
      [...schemaA.required, ...schemaB.required].filter(
        (reqKey) => mergedProperties[reqKey] !== undefined
      )
    );

    return {
      properties: mergedProperties,
      required: Array.from(mergedRequired),
    };
  }

  public mergeWithAdvancedStrategy(
    schemaA: StructuredSchema,
    schemaB: StructuredSchema,
    strategy: ConflictResolutionStrategy
  ): StructuredSchema {
    if (!Object.values(ConflictResolutionStrategy).includes(strategy)) {
      throw new Error("Invalid conflict resolution strategy provided.");
    }
    return this.mergeSchemas(schemaA, schemaB, strategy);
  }
}
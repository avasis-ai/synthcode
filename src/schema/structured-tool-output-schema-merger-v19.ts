import { z, ZodSchema } from "zod";

export type MergeStrategy = "prefer_latest" | "union_all" | "error";

interface SchemaDefinition {
  schema: ZodSchema<any>;
  description: string;
}

export class StructuredToolOutputSchemaMerger {
  private accumulatedSchema: ZodSchema<any>;
  private accumulatedDescription: string;

  constructor(initialSchema: ZodSchema<any>, initialDescription: string) {
    this.accumulatedSchema = initialSchema;
    this.accumulatedDescription = initialDescription;
  }

  private resolveConflict(
    existingSchema: ZodSchema<any>,
    newSchema: ZodSchema<any>,
    strategy: MergeStrategy
  ): ZodSchema<any> {
    if (strategy === "error") {
      throw new Error(
        "Schema conflict detected: Cannot merge schemas with conflicting definitions."
      );
    }
    if (strategy === "prefer_latest") {
      // In a real-world scenario, this would involve deep merging logic.
      // For simplicity here, we assume the new schema overrides the old one
      // if they conflict, but we'll try to merge structure if possible.
      return z.intersection(existingSchema, newSchema);
    }
    // union_all: This is complex for Zod. We'll use intersection as a safe default
    // that requires all fields present in either schema.
    return z.intersection(existingSchema, newSchema);
  }

  private mergeSchemas(
    schemas: SchemaDefinition[],
    strategy: MergeStrategy
  ): StructuredToolOutputSchemaMerger {
    if (schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    let currentSchema: ZodSchema<any> = schemas[0].schema;
    let currentDescription = schemas[0].description;

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i].schema;
      const nextDescription = schemas[i].description;

      try {
        currentSchema = this.resolveConflict(
          currentSchema,
          nextSchema,
          strategy
        );
        currentDescription = `${currentDescription} | ${nextDescription}`;
      } catch (e) {
        throw new Error(`Failed to merge schema at index ${i}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new StructuredToolOutputSchemaMerger(currentSchema, currentDescription);
  }

  public merge(
    schemas: SchemaDefinition[],
    strategy: MergeStrategy = "union_all"
  ): StructuredToolOutputSchemaMerger {
    return this.mergeSchemas(schemas, strategy);
  }

  public addSchema(
    schema: ZodSchema<any>,
    description: string
  ): StructuredToolOutputSchemaMerger {
    const newDefinition: SchemaDefinition[] = [
      { schema: schema, description: description }
    ];
    return this.merge(newDefinition, "union_all");
  }

  public getFinalSchema(): ZodSchema<any> {
    return this.accumulatedSchema;
  }

  public getFinalDescription(): string {
    return this.accumulatedDescription;
  }
}

export { StructuredToolOutputSchemaMerger };
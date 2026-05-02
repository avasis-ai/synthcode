import { z, ZodSchema } from "zod";

type ConflictResolutionStrategy = "latest" | "union" | "manual";

interface SchemaMergeOptions {
  strategy: ConflictResolutionStrategy;
  // Placeholder for advanced conflict resolution rules, e.g., { field: "type_override" }
  conflictRules?: Record<string, any>;
}

interface SchemaMergerBuilder {
  withSchema(schema: ZodSchema<any>): SchemaMergerBuilder;
  withOptions(options: SchemaMergeOptions): SchemaMergerBuilder;
  build(): ZodSchema<any>;
}

export class StructuredToolOutputSchemaMergerAdvanced {
  private schemas: ZodSchema<any>[] = [];
  private options: SchemaMergeOptions = { strategy: "latest" };

  private constructor() {}

  public static getInstance(): StructuredToolOutputSchemaMergerAdvanced {
    if (!StructuredToolOutputSchemaMergerAdvanced.instance) {
      StructuredToolOutputSchemaMergerAdvanced.instance = new StructuredToolOutputSchemaMergerAdvanced();
    }
    return StructuredToolOutputSchemaMergerAdvanced.instance;
  }

  public static get instance(): StructuredToolOutputSchemaMergerAdvanced {
    if (!StructuredToolOutputSchemaMergerAdvanced.instance) {
      StructuredToolOutputSchemaMergerAdvanced.instance = new StructuredToolOutputSchemaMergerAdvanced();
    }
    return StructuredToolOutputSchemaMergerAdvanced.instance;
  }

  public withSchema(schema: ZodSchema<any>): SchemaMergerBuilder {
    this.schemas.push(schema);
    return this as unknown as SchemaMergerBuilder;
  }

  public withOptions(options: SchemaMergeOptions): SchemaMergerBuilder {
    this.options = { ...this.options, ...options };
    return this as unknown as SchemaMergerBuilder;
  }

  public build(): ZodSchema<any> {
    if (this.schemas.length === 0) {
      throw new Error("No schemas provided to the merger.");
    }

    let mergedSchema: ZodSchema<any> = this.schemas[0];

    for (let i = 1; i < this.schemas.length; i++) {
      const nextSchema = this.schemas[i];
      mergedSchema = this.mergeSchemas(mergedSchema, nextSchema);
    }

    return mergedSchema;
  }

  private mergeSchemas(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    const options = this.options;
    const strategy = options.strategy;

    if (strategy === "latest") {
      return this.mergeLatest(schema1, schema2);
    } else if (strategy === "union") {
      return this.mergeUnion(schema1, schema2);
    } else if (strategy === "manual") {
      return this.mergeManual(schema1, schema2);
    }
    throw new Error(`Unsupported conflict resolution strategy: ${strategy}`);
  }

  private mergeLatest(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    // In 'latest' strategy, schema2 overwrites schema1's definitions.
    // This is a simplified representation; actual Zod merging is complex.
    const mergedObject = { ...schema1.shape, ...schema2.shape };
    return z.object(mergedObject);
  }

  private mergeUnion(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    // In 'union' strategy, we combine all possible fields, preferring the most permissive type.
    // This requires deep introspection, simplified here.
    const combinedShape: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(schema1.shape), ...Object.keys(schema2.shape)]);

    for (const key of allKeys) {
      const s1 = schema1.shape[key];
      const s2 = schema2.shape[key];

      if (s1 && s2) {
        // Attempt to create a union of the two schemas for the same key
        combinedShape[key] = z.union([s1, s2]);
      } else if (s1) {
        combinedShape[key] = s1;
      } else if (s2) {
        combinedShape[key] = s2;
      }
    }
    return z.object(combinedShape);
  }

  private mergeManual(schema1: ZodSchema<any>, schema2: ZodSchema<any>): ZodSchema<any> {
    // 'Manual' strategy implies using explicit conflictRules or a predefined merge logic.
    // For this advanced implementation, we default to union but log potential conflicts.
    console.warn("Manual merge strategy activated. Using union logic with potential conflicts.");
    return this.mergeUnion(schema1, schema2);
  }
}

export { StructuredToolOutputSchemaMergerAdvanced };
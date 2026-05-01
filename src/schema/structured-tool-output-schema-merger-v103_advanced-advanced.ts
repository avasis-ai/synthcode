import { z, ZodSchema } from "zod";

export enum ConflictResolutionStrategy {
  PreferLeft = "prefer_left",
  PreferRight = "prefer_right",
  MergeUnion = "merge_union",
  Error = "error",
}

export interface SchemaMergeReport {
  path: string;
  conflict: boolean;
  resolution: ConflictResolutionStrategy;
  details: string;
}

export class StructuredToolOutputSchemaMergerAdvanced {
  private readonly strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.Error) {
    this.strategy = strategy;
  }

  public mergeSchemas(
    schemaLeft: ZodSchema<any>,
    schemaRight: ZodSchema<any>
  ): { mergedSchema: ZodSchema<any>; report: SchemaMergeReport[] } {
    const report: SchemaMergeReport[] = [];
    const mergedSchema = this.recursiveMerge(schemaLeft, schemaRight, "", report);
    return { mergedSchema, report };
  }

  private recursiveMerge(
    schemaLeft: ZodSchema<any>,
    schemaRight: ZodSchema<any>,
    path: string,
    report: SchemaMergeReport[]
  ): ZodSchema<any> {
    if (!schemaLeft || !schemaRight) {
      return schemaLeft || schemaRight || z.any();
    }

    const leftType = schemaLeft.safeParse({});
    const rightType = schemaRight.safeParse({});

    if (leftType.success && rightType.success) {
      const leftObject = leftType.data;
      const rightObject = rightType.data;

      if (schemaLeft.isObject() && schemaRight.isObject()) {
        const mergedObjectSchema = this.mergeObjectSchemas(
          schemaLeft as z.ZodObject<any>,
          schemaRight as z.ZodObject<any>,
          path,
          report
        );
        return z.object(mergedObjectSchema);
      }

      if (schemaLeft.isArray() && schemaRight.isArray()) {
        return this.mergeArraySchemas(
          schemaLeft as z.ZodArray<any>,
          schemaRight as z.ZodArray<any>,
          path,
          report
        );
      }

      if (schemaLeft.isOptional() && schemaRight.isOptional()) {
        return z.union([schemaLeft, schemaRight]);
      }

      // Fallback for primitive types or incompatible structures
      if (this.strategy === ConflictResolutionStrategy.Error) {
        report.push({
          path: path,
          conflict: true,
          resolution: ConflictResolutionStrategy.Error,
          details: "Schema conflict detected and resolution strategy is set to Error.",
        });
        return z.any(); // Or throw an error in a real implementation
      }

      if (this.strategy === ConflictResolutionStrategy.PreferLeft) {
        return schemaLeft;
      }

      if (this.strategy === ConflictResolutionStrategy.PreferRight) {
        return schemaRight;
      }

      // MergeUnion strategy for primitives/simple types
      return z.union([schemaLeft, schemaRight]);
    }

    return z.any();
  }

  private mergeObjectSchemas(
    schemaLeft: z.ZodObject<any>,
    schemaRight: z.ZodObject<any>,
    path: string,
    report: SchemaMergeReport[]
  ): Record<string, z.ZodSchema<any>> {
    const mergedSchema: Record<string, z.ZodSchema<any>> = {};
    const allKeys = new Set([...Object.keys(schemaLeft.shape), ...Object.keys(schemaRight.shape)]);

    for (const key of allKeys) {
      const leftSchema = schemaLeft.shape[key];
      const rightSchema = schemaRight.shape[key];
      const currentPath = `${path}.${key}`;

      if (!leftSchema && !rightSchema) continue;

      if (!leftSchema) {
        mergedSchema[key] = rightSchema;
        continue;
      }

      if (!rightSchema) {
        mergedSchema[key] = leftSchema;
        continue;
      }

      const mergedSchemaForKey = this.recursiveMerge(
        leftSchema,
        rightSchema,
        currentPath,
        report
      );
      mergedSchema[key] = mergedSchemaForKey;
    }
    return mergedSchema;
  }

  private mergeArraySchemas(
    schemaLeft: z.ZodArray<any>,
    schemaRight: z.ZodArray<any>,
    path: string,
    report: SchemaMergeReport[]
  ): z.ZodArray<any> {
    const innerLeft = schemaLeft.schema;
    const innerRight = schemaRight.schema;

    const mergedInnerSchema = this.recursiveMerge(
      innerLeft,
      innerRight,
      path,
      report
    );

    return z.array(mergedInnerSchema);
  }
}
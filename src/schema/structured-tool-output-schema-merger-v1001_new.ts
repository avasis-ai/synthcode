import { z, ZodTypeAny, z.ZodError } from "zod";

export enum ConflictResolutionStrategy {
  PreferString,
  PreferNumber,
  RequireUnion,
  ThrowError,
}

export interface FieldConflict {
  fieldName: string;
  conflictingTypes: {
    source: string;
    schema: any;
    type: string;
  }[];
  resolution: "Union" | "Error" | "Resolved";
}

export interface MergeReport {
  strategyUsed: ConflictResolutionStrategy;
  totalSchemasMerged: number;
  fieldConflicts: FieldConflict[];
  warnings: string[];
}

export interface StructuredToolOutputSchema {
  schema: z.ZodTypeAny;
  description: string;
}

type SchemaDefinition = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
};

class SchemaMerger {
  private schemas: SchemaDefinition[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: SchemaDefinition[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("SchemaMerger requires at least one schema definition.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private resolveTypeConflict(
    fieldName: string,
    conflicts: { source: string; schema: any; type: string }[]
  ): { resolvedSchema: z.ZodTypeAny; report: FieldConflict } {
    const report: FieldConflict = {
      fieldName,
      conflictingTypes: conflicts,
      resolution: "Error",
    };

    if (conflicts.length === 1) {
      return { resolvedSchema: conflicts[0].schema, report: { ...report, resolution: "Resolved" } };
    }

    if (this.strategy === ConflictResolutionStrategy.ThrowError) {
      throw new Error(
        `Schema conflict detected for field '${fieldName}'. Conflicting types found: ${conflicts.map(c => c.type).join(', ')}.`
      );
    }

    if (this.strategy === ConflictResolutionStrategy.RequireUnion) {
      const unionTypes: z.ZodTypeAny[] = conflicts.map(c => c.schema);
      const unionSchema = z.unionAll(unionTypes);
      report.resolution = "Union";
      return { resolvedSchema: unionSchema, report };
    }

    // Simple fallback strategies (e.g., preferring string if conflict exists)
    if (this.strategy === ConflictResolutionStrategy.PreferString) {
      const stringSchema = z.string();
      report.resolution = "Resolved (Preferred String)";
      return { resolvedSchema: stringSchema, report };
    }

    if (this.strategy === ConflictResolutionStrategy.PreferNumber) {
      const numberSchema = z.number();
      report.resolution = "Resolved (Preferred Number)";
      return { resolvedSchema: numberSchema, report };
    }

    throw new Error(`Unsupported conflict resolution strategy for field ${fieldName}.`);
  }

  public merge(): { schema: StructuredToolOutputSchema; report: MergeReport } {
    const mergedSchemaMap = new Map<string, { schema: z.ZodTypeAny; description: string }>();
    const report: MergeReport = {
      strategyUsed: this.strategy,
      totalSchemasMerged: this.schemas.length,
      fieldConflicts: [],
      warnings: [],
    };

    for (const definition of this.schemas) {
      const schemaObject = definition.schema.safeParse({});
      if (!schemaObject.success) {
        report.warnings.push(`Could not parse schema for ${definition.name}: ${schemaObject.error.issues.map(i => i.message).join(', ')}`);
        continue;
      }

      // Simplified approach: Assume the root schema is an object for merging fields
      const currentSchema = schemaObject.data;
      if (typeof currentSchema !== 'object' || currentSchema === null) {
        report.warnings.push(`Schema ${definition.name} does not define a root object structure.`);
        continue;
      }

      const fields: Record<string, { schema: z.ZodTypeAny; description: string }> = {};

      // In a real scenario, we would introspect the Zod object structure.
      // For this simulation, we assume the schema object itself represents the fields.
      // We will treat the entire schema as the structure to merge.
      // A proper implementation would use schema.shape.keys()
      const shape = (definition.schema as any).shape || {};
      for (const fieldName in shape) {
        const fieldSchema = shape[fieldName];
        const fieldDescription = definition.description; // Simplified description handling

        if (!fields[fieldName]) {
          fields[fieldName] = { schema: fieldSchema, description: fieldDescription };
        } else {
          const existing = fields[fieldName];
          const conflicts = [
            { source: definition.name, schema: fieldSchema, type: fieldSchema.constructor.name },
            { source: "Existing", schema: existing.schema, type: existing.schema.constructor.name },
          ];
          const { resolvedSchema, report: fieldReport } = this.resolveTypeConflict(fieldName, conflicts);
          fields[fieldName] = { schema: resolvedSchema, description: fieldDescription };
          report.fieldConflicts.push(fieldReport);
        }
      }
    }

    // Reconstruct the final Zod object from the merged fields map
    const mergedShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(fields)) {
      mergedShape[key] = value.schema;
    }

    const finalSchema = z.object(mergedShape);

    return {
      schema: {
        schema: finalSchema,
        description: "A unified schema derived from multiple tool output definitions.",
      },
      report: report,
    };
  }
}

export { SchemaMerger };
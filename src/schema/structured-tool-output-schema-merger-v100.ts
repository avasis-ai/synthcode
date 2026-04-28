import { z, ZodSchema, ZodTypeAny } from "zod";

export type ConflictResolutionStrategy = "prefer_latest" | "union" | "strict";

export interface FieldConflict {
  field: string;
  conflictingTypes: {
    schema: ZodSchema<any>;
    description: string;
  }[];
}

export interface SchemaConflict {
  type: "field_conflict" | "required_overlap";
  details: any;
}

export interface MergeReport {
  conflicts: SchemaConflict[];
  decisions: {
    field: string;
    resolution: string;
  }[];
}

export interface StructuredToolOutputSchema {
  schema: ZodSchema<any>;
  description: string;
}

export class SchemaMerger {
  private schemas: StructuredToolOutputSchema[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: StructuredToolOutputSchema[], strategy: ConflictResolutionStrategy = "union") {
    if (!schemas || schemas.length === 0) {
      throw new Error("SchemaMerger requires at least one schema.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private detectConflicts(schemas: StructuredToolOutputSchema[]): SchemaConflict[] {
    const conflicts: SchemaConflict[] = [];
    const allFields: Set<string> = new Set<string>();
    const fieldToSchemas: Map<string, StructuredToolOutputSchema[]> = new Map();

    for (const schema of schemas) {
      const fields = schema.schema._def.shape;
      for (const key in fields) {
        const field = key as string;
        allFields.add(field);
        if (!fieldToSchemas.has(field)) {
          fieldToSchemas.set(field, []);
        }
        fieldToSchemas.get(field)!.push(schema);
      }
    }

    for (const [field, schemaList] of fieldToSchemas.entries()) {
      if (schemaList.length > 1) {
        const types: { schema: ZodSchema<any>; description: string }[] = [];
        for (const schema of schemaList) {
          const fieldSchema = schema.schema.shape[field];
          if (fieldSchema) {
            types.push({
              schema: fieldSchema as ZodSchema<any>,
              description: schema.description,
            });
          }
        }

        if (types.length > 1) {
          // Simple conflict detection: check if types are fundamentally different
          const firstType = types[0].schema;
          const subsequentTypes = types.slice(1).map(t => t.schema);

          let hasTypeConflict = false;
          for (const subsequentSchema of subsequentTypes) {
            // A very basic check: if one is string and the other is number, it's a conflict
            if (firstType.zodType === z.string() && subsequentSchema.zodType === z.number()) {
              hasTypeConflict = true;
              break;
            }
          }

          if (hasTypeConflict) {
            conflicts.push({
              type: "field_conflict",
              details: { field, conflictingTypes: types.map(t => ({
                schema: t.schema,
                description: t.description,
              })) },
            });
          }
        }
      }
    }
    return conflicts;
  }

  private resolveField(field: string, fieldSchemas: StructuredToolOutputSchema[]): { mergedSchema: ZodSchema<any>; decision: string } {
    let mergedSchema: ZodSchema<any>;
    let decision: string = "Merged successfully";

    if (this.strategy === "strict") {
      const conflicts = this.detectConflicts([this.schemas[0], ...fieldSchemas.slice(1)]);
      if (conflicts.some(c => c.type === "field_conflict" && c.details.field === field)) {
        throw new Error(`Strict merge failed for field '${field}': Conflicting types detected.`);
      }
      // In strict mode, we might just take the first one if no conflict is found, or throw if any conflict exists.
      mergedSchema = fieldSchemas[0].schema.shape[field] as ZodSchema<any>;
      decision = `Used schema from the first source (${fieldSchemas[0].description}).`;
    } else if (this.strategy === "prefer_latest") {
      // Prefer the last schema's definition for this field
      const lastSchema = fieldSchemas[fieldSchemas.length - 1];
      mergedSchema = lastSchema.schema.shape[field] as ZodSchema<any>;
      decision = `Used schema from the latest source (${lastSchema.description}).`;
    } else { // union
      // Attempt to union schemas (this is complex, so we'll use z.union for primitives)
      const unionSchemas: ZodSchema<any>[] = [];
      for (const schema of fieldSchemas) {
        const fieldSchema = schema.schema.shape[field] as ZodSchema<any>;
        if (fieldSchema) {
          unionSchemas.push(fieldSchema);
        }
      }
      if (unionSchemas.length > 0) {
        mergedSchema = z.union(unionSchemas);
        decision = `Unionized ${unionSchemas.length} schemas for field '${field}'.`;
      } else {
        throw new Error(`Could not find schema for field '${field}' in any source.`);
      }
    }
    return { mergedSchema, decision };
  }

  public merge(): { unifiedSchema: ZodSchema<any>; report: MergeReport } {
    const conflicts = this.detectConflicts(this.schemas);
    const decisions: { field: string; resolution: string }[] = [];
    const mergedShape: Record<string, ZodSchema<any>> = {};

    for (const schema of this.schemas) {
      const fields = schema.schema.shape;
      for (const field in fields) {
        const fieldName = field as string;
        if (!mergedShape[fieldName]) {
          // First time seeing this field, initialize it
          mergedShape[fieldName] = fields[fieldName] as ZodSchema<any>;
        } else {
          // Field seen before, resolve conflict/merge
          const fieldSchemasForMerge: StructuredToolOutputSchema[] = this.schemas.map(s => ({
            schema: s.schema,
            description: s.description,
          }));
          const { mergedSchema, decision } = this.resolveField(fieldName, fieldSchemasForMerge);
          mergedShape[fieldName] = mergedSchema;
          decisions.push({ field: fieldName, resolution: decision });
        }
      }
    }

    const unifiedSchema = z.object(mergedShape);
    const report: MergeReport = {
      conflicts: conflicts,
      decisions: decisions,
    };

    return { unifiedSchema, report };
  }
}

export { SchemaMerger };
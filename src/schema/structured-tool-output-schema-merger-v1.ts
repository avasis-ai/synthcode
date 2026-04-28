import { z } from "zod";

export type SchemaDefinition = z.ZodTypeAny;

export type ConflictReport = {
  field: string;
  conflicts: {
    type: string;
    required: boolean;
  }[];
};

export type ConflictResolutionStrategy = "prefer_union" | "prefer_most_specific" | "flag_all";

interface MergedSchemaResult {
  mergedSchema: SchemaDefinition;
  conflicts: ConflictReport;
}

export class SchemaMerger {
  private schemas: SchemaDefinition[];
  private strategy: ConflictResolutionStrategy;

  constructor(schemas: SchemaDefinition[], strategy: ConflictResolutionStrategy) {
    this.schemas = schemas;
    this.strategy = strategy;
  }

  private getFieldType(schema: SchemaDefinition, fieldName: string): { type: z.ZodTypeAny; required: boolean } | null {
    const field = schema.shape[fieldName];
    if (!field) {
      return null;
    }
    // Simplified type extraction for demonstration; in a real scenario, this would involve deep Zod introspection.
    // For this implementation, we assume the field itself is the type definition.
    return { type: field as z.ZodTypeAny, required: field.required() };
  }

  private resolveConflict(
    fieldName: string,
    conflicts: { type: z.ZodTypeAny; required: boolean }[]
  ): { mergedType: z.ZodTypeAny; resolved: boolean } {
    if (conflicts.length === 1) {
      return { mergedType: conflicts[0].type, resolved: true };
    }

    if (this.strategy === "flag_all") {
      // In a real scenario, we might throw or return a special error type.
      // Here, we'll just union them to allow compilation, but the report will flag it.
      const unionType = z.union([
        ...conflicts.map(c => c.type)
      ]);
      return { mergedType: unionType, resolved: false };
    }

    if (this.strategy === "prefer_union") {
      const unionType = z.union([
        ...conflicts.map(c => c.type)
      ]);
      return { mergedType: unionType, resolved: true };
    }

    if (this.strategy === "prefer_most_specific") {
      // This is highly complex with Zod. For simplicity, we'll default to unioning if types differ,
      // but we acknowledge the limitation here.
      const unionType = z.union([
        ...conflicts.map(c => c.type)
      ]);
      return { mergedType: unionType, resolved: false };
    }

    // Fallback
    return { mergedType: z.any(), resolved: false };
  }

  public merge(): { mergedSchema: SchemaDefinition; conflicts: ConflictReport } {
    const mergedShape: Record<string, z.ZodTypeAny> = {};
    const conflicts: Record<string, { type: z.ZodTypeAny; required: boolean }[]> = {};

    for (const schema of this.schemas) {
      const shape = schema.shape;
      for (const [fieldName, fieldSchema] of Object.entries(shape)) {
        const fieldNameKey = fieldName as string;

        if (!mergedShape[fieldNameKey]) {
          mergedShape[fieldNameKey] = fieldSchema;
          conflicts[fieldNameKey] = [{ type: fieldSchema, required: fieldSchema.required() }];
        } else {
          const existingConflicts = conflicts[fieldNameKey] || [];
          const newConflict = { type: fieldSchema, required: fieldSchema.required() };

          // Check if the new conflict is substantially different from existing ones
          // (A real check would compare schemas deeply)
          const isDifferent = !existingConflicts.some(c => c.type.constructor.name === fieldSchema.constructor.name);

          if (isDifferent) {
            conflicts[fieldNameKey] = [...existingConflicts, newConflict];
          }
        }
      }
    }

    const finalShape: Record<string, z.ZodTypeAny> = {};
    const finalConflicts: ConflictReport = { field: "", conflicts: [] };

    for (const [fieldName, conflictsArray] of Object.entries(conflicts)) {
      const fieldNameKey = fieldName as string;
      const conflictsList = conflictsArray as { type: z.ZodTypeAny; required: boolean }[];

      const { mergedType, resolved } = this.resolveConflict(fieldNameKey, conflictsList);
      finalShape[fieldNameKey] = mergedType;

      if (!resolved) {
        finalConflicts.field = fieldNameKey;
        finalConflicts.conflicts = conflictsList.map(c => ({
          type: c.type.constructor.name,
          required: c.required,
        }));
      }
    }

    const mergedSchema = z.object(finalShape);

    return {
      mergedSchema: mergedSchema as SchemaDefinition,
      conflicts: finalConflicts,
    };
  }
}
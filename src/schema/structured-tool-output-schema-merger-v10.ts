import {
  SchemaDefinition,
  MergeOptions,
  MergeReport,
  FieldSchema,
} from "./types";

export class SchemaMerger {
  private schemas: SchemaDefinition[];
  private options: MergeOptions;

  constructor(schemas: SchemaDefinition[], options: MergeOptions) {
    this.schemas = schemas;
    this.options = options;
  }

  public merge(): {
    schema: SchemaDefinition;
    report: MergeReport;
  } {
    const mergedSchema: Record<string, FieldSchema> = {};
    const report: MergeReport = {
      conflicts: [],
      resolutions: [],
      warnings: [],
    };

    for (const schema of this.schemas) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (mergedSchema[fieldName]) {
          const existingSchema = mergedSchema[fieldName];
          const conflict = {
            field: fieldName,
            schemas: this.schemas.map(s => s.name),
            conflictType: "Field Collision",
          };

          const resolution = this.resolveConflict(
            existingSchema,
            fieldSchema,
            conflict
          );

          if (resolution.action === "OVERWRITE") {
            mergedSchema[fieldName] = fieldSchema;
            report.resolutions.push({
              field: fieldName,
              resolution: "Overwritten by latest schema",
              details: {
                old: existingSchema,
                new: fieldSchema,
              },
            });
          } else if (resolution.action === "UNION") {
            mergedSchema[fieldName] = this.unionSchemas(existingSchema, fieldSchema);
            report.resolutions.push({
              field: fieldName,
              resolution: "Merged (Union)",
              details: {
                merged: mergedSchema[fieldName],
              },
            });
          } else if (resolution.action === "ERROR") {
            report.conflicts.push({
              field: fieldName,
              schemas: conflict.schemas,
              conflictType: "Unresolvable Field Conflict",
              message: "Cannot merge conflicting field types based on current options.",
            });
            // Keep the existing schema if merging fails critically
            mergedSchema[fieldName] = existingSchema;
          }
        } else {
          mergedSchema[fieldName] = fieldSchema;
        }
      }
    }

    const finalSchema: SchemaDefinition = {
      name: "MergedToolOutputSchema",
      description: "A unified schema derived from multiple tool output definitions.",
      fields: mergedSchema,
    };

    return {
      schema: finalSchema,
      report: report,
    };
  }

  private resolveConflict(
    existing: FieldSchema,
    incoming: FieldSchema,
    conflict: {
      field: string;
      schemas: string[];
      conflictType: string;
    }
  ): {
    action: "OVERWRITE" | "UNION" | "ERROR";
    resolvedSchema: FieldSchema;
  } {
    if (this.options.conflictStrategy === "OVERWRITE") {
      return { action: "OVERWRITE", resolvedSchema: incoming };
    }

    if (this.options.conflictStrategy === "UNION") {
      return { action: "UNION", resolvedSchema: this.unionSchemas(existing, incoming) };
    }

    // Default or specific strategy (e.g., "LATEST" or "MOST_SPECIFIC")
    if (this.options.conflictStrategy === "LATEST") {
      return { action: "OVERWRITE", resolvedSchema: incoming };
    }

    // Fallback to union if specific strategy fails or is not defined
    return { action: "UNION", resolvedSchema: this.unionSchemas(existing, incoming) };
  }

  private unionSchemas(existing: FieldSchema, incoming: FieldSchema): FieldSchema {
    const mergedType = {
      type: "object",
      properties: {
        ...existing.properties,
        ...incoming.properties,
      },
      required: [...new Set([...(existing.required || []), ...(incoming.required || [])])]
    };

    return {
      type: "object",
      description: "Union of two schemas.",
      properties: mergedType.properties,
      required: mergedType.required,
    };
  }
}
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

interface SchemaMergeResult {
  schema: Record<string, unknown>;
  warnings: string[];
  errors: string[];
}

type Schema = Record<string, unknown>;

export class StructuredToolOutputSchemaMergerV3 {
  private readonly userContextSchema: Schema;
  private readonly systemContextSchema: Schema;

  constructor(userContextSchema: Schema, systemContextSchema: Schema) {
    this.userContextSchema = userContextSchema;
    this.systemContextSchema = systemContextSchema;
  }

  private resolveConflict(
    key: string,
    schemaA: unknown,
    schemaB: unknown,
    path: string,
  ): { mergedSchema: unknown; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let mergedSchema: unknown = {};

    const isTypeA = (s: unknown): boolean => (s && typeof s === 'object' && 'type' in s);
    const isTypeB = (s: unknown): boolean => (s && typeof s === 'object' && 'type' in s);

    const typeA = typeof schemaA === 'object' && schemaA !== null && 'type' in schemaA ? schemaA['type'] : undefined;
    const typeB = typeof schemaB === 'object' && schemaB !== null && 'type' in schemaB ? schemaB['type'] : undefined;

    if (typeA && typeB && typeA !== typeB && !(typeA === 'object' && typeB === 'object')) {
      errors.push(
        `Type conflict at '${path}': Schema A expects '${typeA}' but Schema B expects '${typeB}'. Manual resolution required.`,
      );
    }

    if (typeof schemaA === 'object' && schemaA !== null && typeof schemaB === 'object' && schemaB !== null) {
      // Handle object merging recursively
      const objA = schemaA as Record<string, unknown>;
      const objB = schemaB as Record<string, unknown>;

      const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
      const mergedObject: Record<string, unknown> = {};

      for (const key of allKeys) {
        const keyA = objA[key];
        const keyB = objB[key];

        if (keyA === undefined && keyB === undefined) continue;

        if (keyA !== undefined && keyB !== undefined) {
          const nestedResult = this.resolveConflict(key, keyA, keyB, `${path}.${key}`);
          mergedObject[key] = nestedResult.mergedSchema;
          warnings.push(...nestedResult.warnings);
          errors.push(...nestedResult.errors);
        } else if (keyA !== undefined) {
          mergedObject[key] = keyA;
        } else {
          mergedObject[key] = keyB;
        }
      }
      mergedSchema = mergedObject;
    } else if (typeA && typeB) {
      // If types conflict but are both complex objects, we rely on the recursive merge above.
      // If they are simple types, we prioritize the user context (A).
      mergedSchema = schemaA;
      warnings.push(
        `Structural conflict at '${path}': Both schemas define types. Prioritizing Schema A's definition (${typeA}).`,
      );
    } else {
      // Fallback: If types are incompatible or simple, prioritize A but merge properties if possible.
      mergedSchema = { ...schemaA, ...schemaB } as unknown as Record<string, unknown>;
    }

    return { mergedSchema, warnings, errors };
  }

  public mergeSchemas(
    toolOutputSchema: Schema,
    userSchema: Schema = this.userContextSchema,
    systemSchema: Schema = this.systemContextSchema,
  ): SchemaMergeResult {
    const finalSchema: Schema = {};
    const allWarnings: string[] = [];
    const allErrors: string[] = [];

    // 1. Merge User Context and System Context (User context takes precedence)
    const userSystemMerge = this.resolveConflict(
      "root",
      userSchema,
      systemSchema,
      "root",
    );
    Object.assign(finalSchema, userSystemMerge.mergedSchema);
    allWarnings.push(...userSystemMerge.warnings);
    allErrors.push(...userSystemMerge.errors);

    // 2. Merge Tool Output Schema into the combined context
    const finalMerge = this.resolveConflict(
      "root",
      finalSchema,
      toolOutputSchema,
      "root",
    );

    // Finalize results
    const finalSchemaResult: Schema = finalMerge.mergedSchema;
    const finalWarnings: string[] = [...allWarnings, ...finalMerge.warnings];
    const finalErrors: string[] = [...allErrors, ...finalMerge.errors];

    return {
      schema: finalSchemaResult,
      warnings: finalWarnings,
      errors: finalErrors,
    };
  }

  public generateCompatibilityReport(
    toolOutputSchema: Schema,
    userSchema: Schema = this.userContextSchema,
    systemSchema: Schema = this.systemContextSchema,
  ): {
    report: SchemaMergeResult;
    summary: string;
  } {
    const result = this.mergeSchemas(
      toolOutputSchema,
      userSchema,
      systemSchema,
    );

    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;

    let summary = `Schema Merge Complete. Successfully merged ${Object.keys(result.schema).length} top-level properties.`;
    if (errorCount > 0) {
      summary += ` WARNING: Encountered ${errorCount} critical structural incompatibility errors. Review the 'errors' array.`;
    } else if (warningCount > 0) {
      summary += ` WARNING: Encountered ${warningCount} potential structural warnings. Review the 'warnings' array.`;
    } else {
      summary += " No structural conflicts detected. Schema appears compatible.";
    }

    return {
      report: result,
      summary: summary,
    };
  }
}
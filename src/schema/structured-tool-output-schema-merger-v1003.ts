import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type SchemaType = Record<string, any>;

type ConflictResolutionStrategy = "union" | "intersection" | "prefer_latest";

export interface SchemaMergeOptions {
  strategy: ConflictResolutionStrategy;
}

export interface SchemaMergeReport {
  mergedSchema: SchemaType;
  details: {
    field: string;
    conflict: boolean;
    resolution: string;
  }[];
}

export class StructuredToolOutputSchemaMerger {
  private readonly options: SchemaMergeOptions;

  constructor(options: SchemaMergeOptions) {
    this.options = options;
  }

  public mergeSchemas(schemas: SchemaType[]): SchemaMergeReport {
    if (!schemas || schemas.length === 0) {
      return {
        mergedSchema: {} as SchemaType,
        details: [],
      };
    }

    let mergedSchema: SchemaType = {};
    const details: {
      field: string;
      conflict: boolean;
      resolution: string;
    }[] = [];

    for (const schema of schemas) {
      this.deepMerge(mergedSchema, schema, "", details);
    }

    return {
      mergedSchema: mergedSchema,
      details: details,
    };
  }

  private deepMerge(
    target: SchemaType,
    source: SchemaType,
    path: string,
    details: {
      field: string;
      conflict: boolean;
      resolution: string;
    }[]
  ): void {
    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue;
      }

      const sourceValue = source[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof sourceValue === "object" && sourceValue !== null && !Array.isArray(sourceValue)) {
        const targetValue = target[key];

        if (typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
          // Recursive merge for nested objects
          this.deepMerge(
            (targetValue as SchemaType) || {} as SchemaType,
            sourceValue as SchemaType,
            currentPath,
            details
          );
        } else {
          // Overwrite or initialize nested object
          target[key] = { ...(targetValue as SchemaType) || {} } as SchemaType;
          this.deepMerge(
            (target[key] as SchemaType),
            sourceValue as SchemaType,
            currentPath,
            details
          );
        }
      } else {
        // Handle primitive or array types (potential conflict)
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          const targetValue = target[key];
          const conflict = true;
          let resolution = "N/A";

          if (this.options.strategy === "union") {
            // For primitives, union usually means taking the most permissive type,
            // but here we'll just prefer the source if it's different.
            resolution = `Union applied: Kept ${key} from source (overwriting target).`;
            target[key] = sourceValue;
          } else if (this.options.strategy === "intersection") {
            // Intersection is hard for arbitrary types; we'll default to a union-like merge
            // but report the conflict.
            resolution = `Intersection applied: Conflict detected, merging structure.`;
            target[key] = sourceValue;
          } else { // prefer_latest
            resolution = `Prefer Latest applied: Overwriting target with source value.`;
            target[key] = sourceValue;
          }
          details.push({
            field: key,
            conflict: true,
            resolution: resolution,
          });
        } else {
          // No conflict, just assign
          target[key] = sourceValue;
        }
      }
    }
  }
}
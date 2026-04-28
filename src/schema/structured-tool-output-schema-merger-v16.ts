import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type SchemaMergerOptions = {
  conflictStrategy?: "prefer-latest" | "union-all" | "custom-resolver-fn";
  customResolver?: (
    key: string,
    valueA: unknown,
    valueB: unknown,
    path: string
  ) => unknown;
};

export interface Schema {
  type: string;
  properties?: Record<string, Schema>;
  required?: string[];
  description?: string;
  items?: Schema;
}

export class StructuredToolOutputSchemaMergerV16 {
  private readonly defaultOptions: SchemaMergerOptions = {
    conflictStrategy: "prefer-latest",
  };

  private resolveConflict(
    key: string,
    valueA: unknown,
    valueB: unknown,
    path: string,
    options: SchemaMergerOptions
  ): unknown {
    if (options.customResolver) {
      return options.customResolver(key, valueA, valueB, path);
    }

    switch (options.conflictStrategy) {
      case "prefer-latest":
        return valueB;
      case "union-all":
        return this.unionAll(valueA, valueB, path);
      default:
        return valueB;
    }
  }

  private unionAll(valueA: unknown, valueB: unknown, path: string): unknown {
    if (typeof valueA === "object" && valueA !== null && typeof valueB === "object" && valueB !== null) {
      const merged: Record<string, unknown> = {};
      const keysA = Object.keys(valueA) as string[];
      const keysB = Object.keys(valueB) as string[];
      const allKeys = Array.from(new Set([...keysA, ...keysB]));

      for (const key of allKeys) {
        const pathKey = `${path}.${key}`;
        const valA = (valueA as Record<string, unknown>)[key];
        const valB = (valueB as Record<string, unknown>)[key];

        if (valA !== undefined && valB !== undefined) {
          merged[key] = this.unionAll(valA, valB, pathKey);
        } else if (valA !== undefined) {
          merged[key] = valA;
        } else {
          merged[key] = valB;
        }
      }
      return merged;
    }
    return valueB;
  }

  private mergeSchemas(
    schemaA: Schema,
    schemaB: Schema,
    options: SchemaMergerOptions,
    path: string = ""
  ): Schema {
    const mergedSchema: Schema = {
      type: schemaA.type,
      properties: { ...schemaA.properties, ...(schemaB.properties || {}) },
      required: [...(schemaA.required || []), ...(schemaB.required || [])] as string[],
      description: schemaB.description || schemaA.description,
    };

    const finalProperties: Record<string, Schema> = {};
    const allKeys = new Set<string>();

    const processProperties = (props: Record<string, Schema>, prefix: string) => {
      for (const key of Object.keys(props)) {
        const fullKey = `${prefix}.${key}`;
        allKeys.add(key);
      }
    };

    processProperties(schemaA.properties || {}, path);
    processProperties(schemaB.properties || {}, path);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const propA = (schemaA.properties || {})[key];
      const propB = (schemaB.properties || {})[key];

      if (propA && propB) {
        const mergedProps = this.mergeSchemas(propA, propB, options, fullPath);
        finalProperties[key] = mergedProps;
      } else if (propA) {
        finalProperties[key] = propA;
      } else if (propB) {
        finalProperties[key] = propB;
      }
    }

    mergedSchema.properties = finalProperties;

    if (schemaA.required && schemaB.required) {
      mergedSchema.required = Array.from(new Set([...(schemaA.required as Set<string>), ...(schemaB.required as Set<string>)]));
    } else if (schemaA.required) {
      mergedSchema.required = schemaA.required;
    } else {
      mergedSchema.required = schemaB.required;
    }

    return mergedSchema;
  }

  public merge(
    schemaA: Schema,
    schemaB: Schema,
    options?: SchemaMergerOptions
  ): Schema {
    const effectiveOptions = {
      ...this.defaultOptions,
      ...(options || {}),
    };

    return this.mergeSchemas(schemaA, schemaB, effectiveOptions);
  }
}
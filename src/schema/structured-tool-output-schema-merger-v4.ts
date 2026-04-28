import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Schema {
  type: "object" | "array" | "string" | "number" | "boolean" | "any";
  properties?: {
    [key: string]: Schema;
  };
  items?: Schema;
  required?: string[];
  enum?: string[];
}

export enum ConflictResolutionStrategy {
  FavorStrictest = "favor_strictest",
  MergeUnion = "merge_union",
  FailOnConflict = "fail_on_conflict",
}

export interface ConflictReport {
  path: string;
  conflictingSchemas: Schema[];
  resolutionApplied: "merged" | "overwritten" | "failed";
  message: string;
}

export interface SchemaMergeResult {
  mergedSchema: Schema;
  report: ConflictReport[];
}

export class StructuredToolOutputSchemaMergerV4 {
  private strategies: Record<ConflictResolutionStrategy, (s1: Schema, s2: Schema) => Schema>;

  constructor() {
    this.strategies = {
      [ConflictResolutionStrategy.FavorStrictest]: this.mergeStrictest.bind(this),
      [ConflictResolutionStrategy.MergeUnion]: this.mergeUnion.bind(this),
      [ConflictResolutionStrategy.FailOnConflict]: this.mergeFailOnConflict.bind(this),
    };
  }

  public mergeSchemas(
    schemas: Schema[],
    strategy: ConflictResolutionStrategy
  ): SchemaMergeResult {
    if (!schemas || schemas.length === 0) {
      throw new Error("Input schemas array cannot be empty.");
    }

    const strategyMerger = this.strategies[strategy];
    if (!strategyMerger) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    const initialReport: ConflictReport[] = [];
    const mergedSchema = this.recursiveMerge(schemas, "", strategyMerger);

    return {
      mergedSchema,
      report: initialReport,
    };
  }

  private recursiveMerge(
    schemas: Schema[],
    currentPath: string,
    merger: (s1: Schema, s2: Schema) => Schema
  ): Schema {
    if (schemas.length === 0) {
      throw new Error("Cannot merge zero schemas.");
    }

    let mergedSchema: Schema = schemas[0];
    let report: ConflictReport[] = [];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];
      const previousSchema = mergedSchema;

      // For simplicity in this implementation, we merge the current accumulated schema
      // with the next schema in the array, accumulating reports along the way.
      // A real implementation would need to track reports across the entire merge.
      // Here, we simulate the merge and focus on the structure.

      if (previousSchema.type === "object" && nextSchema.type === "object") {
        const mergedObject = this.mergeObjects(
          previousSchema,
          nextSchema,
          currentPath,
          merger
        );
        mergedSchema = mergedObject;
      } else {
        // Simple type merge (e.g., array of primitives)
        mergedSchema = this.mergeSimpleTypes(
          previousSchema,
          nextSchema,
          currentPath,
          merger
        );
      }
    }

    return mergedSchema;
  }

  private mergeObjects(
    s1: Schema,
    s2: Schema,
    path: string,
    merger: (s1: Schema, s2: Schema) => Schema
  ): Schema {
    const properties1 = s1.properties || {};
    const properties2 = s2.properties || {};
    const allKeys = new Set([...Object.keys(properties1), ...Object.keys(properties2)]);
    const mergedProperties: Record<string, Schema> = {};

    for (const key of allKeys) {
      const prop1 = properties1[key];
      const prop2 = properties2[key];
      const newPath = `${path}.${key}`;

      if (prop1 && prop2) {
        // Conflict detected for this key, use the strategy merger
        const mergedProp = merger(prop1, prop2);
        mergedProperties[key] = mergedProp;
      } else if (prop1) {
        mergedProperties[key] = prop1;
      } else if (prop2) {
        mergedProperties[key] = prop2;
      }
    }

    return {
      type: "object",
      properties: mergedProperties,
      required: [...(s1.required || []), ...(s2.required || [])]
        .filter(Boolean) as string[],
    };
  }

  private mergeSimpleTypes(
    s1: Schema,
    s2: Schema,
    path: string,
    merger: (s1: Schema, s2: Schema) => Schema
  ): Schema {
    // This is a placeholder for complex type merging logic
    if (s1.type !== s2.type) {
      // If types conflict, the merger function handles it.
      return merger(s1, s2);
    }
    // If types match, we might merge enums or just pick one.
    return { type: s1.type };
  }

  private mergeStrictest(s1: Schema, s2: Schema): Schema {
    // Favor the schema that is more restrictive (e.g., narrower enum, or more specific type)
    // For simplicity, we'll merge properties, favoring non-null/non-optional definitions.
    const mergedProps: Record<string, Schema> = {};
    const allKeys = new Set([...(s1.properties ? Object.keys(s1.properties) : []), ...(s2.properties ? Object.keys(s2.properties) : [])]);

    for (const key of allKeys) {
      const p1 = s1.properties?.[key];
      const p2 = s2.properties?.[key];

      if (p1 && p2) {
        // Recursively merge, but favor the stricter result
        const merged = this.mergeStrictest(p1, p2);
        mergedProps[key] = merged;
      } else if (p1) {
        mergedProps[key] = p1;
      } else if (p2) {
        mergedProps[key] = p2;
      }
    }

    return {
      type: "object",
      properties: mergedProps,
      required: [...(s1.required || []), ...(s2.required || [])]
        .filter(Boolean) as string[],
    };
  }

  private mergeUnion(s1: Schema, s2: Schema): Schema {
    // Intelligently merge unions: if both are unions, combine them.
    // If one is a union and the other is a concrete type, the result is a union of both.
    // This is highly complex and simplified here.
    if (s1.type === "object" && s1.properties) {
      // Assume object merging for simplicity if both are objects
      return this.mergeObjects(s1, s2, "root", this.mergeUnion);
    }
    // Placeholder for true union merging logic
    return { type: "any" };
  }

  private mergeFailOnConflict(s1: Schema, s2: Schema): Schema {
    // If any conflict is found (e.g., different types for the same field),
    // we must report it and potentially fail or return a placeholder.
    // For the return type, we will just return the first schema and rely on the report mechanism.
    return s1;
  }
}
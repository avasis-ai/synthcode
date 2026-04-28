import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Schema {
  [key: string]: any;
}

export type ConflictResolutionStrategy =
  | "deep_merge"
  | "prefer_union"
  | "custom_resolver";

export class SchemaMerger {
  private strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = "deep_merge") {
    this.strategy = strategy;
  }

  merge(schema1: Schema, schema2: Schema): Schema {
    const merged: Schema = { ...schema1 };
    for (const key in schema2) {
      if (!Object.prototype.hasOwnProperty.call(schema2, key)) continue;

      const keyValue = schema2[key];
      const existingValue = schema1[key];

      if (typeof existingValue === "object" && existingValue !== null &&
        typeof keyValue === "object" && keyValue !== null &&
        !Array.isArray(existingValue) && !Array.isArray(keyValue)) {
        
        if (this.strategy === "deep_merge") {
          merged[key] = this.deepMerge(existingValue, keyValue);
        } else if (this.strategy === "prefer_union") {
          merged[key] = this.preferUnion(existingValue, keyValue);
        } else {
          merged[key] = keyValue; // Fallback or custom logic placeholder
        }
      } else {
        merged[key] = keyValue;
      }
    }
    return merged;
  }

  private deepMerge(obj1: Schema, obj2: Schema): Schema {
    const result: Schema = { ...obj1 };
    for (const key in obj2) {
      if (!Object.prototype.hasOwnProperty.call(obj2, key)) continue;
      const key2 = obj2[key];
      const key1 = obj1[key];

      if (typeof key1 === "object" && key1 !== null &&
        typeof key2 === "object" && key2 !== null &&
        !Array.isArray(key1) && !Array.isArray(key2)) {
        result[key] = this.deepMerge(key1, key2);
      } else {
        result[key] = key2;
      }
    }
    return result;
  }

  private preferUnion(obj1: Schema, obj2: Schema): Schema {
    const result: Schema = { ...obj1 };
    for (const key in obj2) {
      if (!Object.prototype.hasOwnProperty.call(obj2, key)) continue;
      const key2 = obj2[key];
      const key1 = obj1[key];

      if (typeof key1 === "object" && key1 !== null &&
        typeof key2 === "object" && key2 !== null &&
        !Array.isArray(key1) && !Array.isArray(key2)) {
        // For union, we recursively merge, but prioritize structure from both
        result[key] = this.deepMerge(key1, key2);
      } else {
        // If types conflict or are primitives, prefer the structure from obj2 (the latest/most specific)
        result[key] = key2;
      }
    }
    return result;
  }
}

export function mergeToolOutputSchemas(
  schema1: Schema,
  schema2: Schema,
  strategy: ConflictResolutionStrategy = "deep_merge"
): Schema {
  const merger = new SchemaMerger(strategy);
  return merger.merge(schema1, schema2);
}
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaDefinition = Record<string, any>;

interface MergeOptions {
  precedence?: "A" | "B" | "LATEST";
  allowUnionMerge?: boolean;
}

export class StructuredToolOutputSchemaMerger {
  private options: MergeOptions;

  constructor(options: MergeOptions = {}) {
    this.options = {
      precedence: options.precedence || "LATEST",
      allowUnionMerge: options.allowUnionMerge ?? true,
    };
  }

  private resolveType(typeA: any, typeB: any): any {
    if (typeA === typeB) {
      return typeA;
    }
    if (typeof typeA === 'string' && typeof typeB === 'string') {
      if (this.options.allowUnionMerge) {
        return { type: ["string", "string"] }; // Simplified union representation
      }
      return "string | string";
    }
    return { type: ["any", "any"] };
  }

  private mergeProperties(
    propsA: Record<string, any>,
    propsB: Record<string, any>,
    path: string = ""
  ): Record<string, any> {
    const merged: Record<string, any> = { ...propsA, ...propsB };

    for (const key in propsB) {
      if (!propsA[key] && !merged[key]) continue;

      const propA = propsA[key];
      const propB = propsB[key];

      if (typeof propA === 'object' && propA !== null && typeof propB === 'object' && propB !== null) {
        if (Array.isArray(propA) && Array.isArray(propB)) {
          // Handle array merging (e.g., union of possible items)
          merged[key] = propA.concat(propB);
        } else if (propA.properties && propB.properties) {
          // Recursive merge for object properties
          merged[key] = this.mergeProperties(
            propA.properties,
            propB.properties,
            path === key ? key : `${path}.${key}`
          );
        } else {
          // Fallback for complex object merge
          merged[key] = { ...propA, ...propB };
        }
      } else if (propA !== undefined && propB !== undefined) {
        // Conflict resolution for primitive types
        if (this.options.precedence === "A") {
          // Keep A, but validate against B's type if possible
          merged[key] = propA;
        } else if (this.options.precedence === "B") {
          // Keep B
          merged[key] = propB;
        } else {
          // LATEST: Prefer non-null/non-empty, or B if A is empty
          if (propA && !propB) {
            merged[key] = propA;
          } else if (propB && !propA) {
            merged[key] = propB;
          } else if (propA && propB) {
            // Simple merge for primitives: prefer B unless A is more descriptive
            merged[key] = propB;
          }
        }
      } else {
        // If one is missing, take the existing one (or B if A is missing)
        if (propA === undefined && propB !== undefined) {
          merged[key] = propB;
        } else if (propA !== undefined && propB === undefined) {
          merged[key] = propA;
        }
      }
    }
    return merged;
  }

  public mergeSchemas(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    options?: Partial<MergeOptions>
  ): SchemaDefinition {
    const effectiveOptions = {
      ...this.options,
      ...(options || {}),
    };

    // Re-initialize merger with potentially overridden options for this call
    const merger = new StructuredToolOutputSchemaMerger(effectiveOptions);

    return merger["mergeSchemas"](schemaA, schemaB);
  }

  public validateMergedSchema(mergedSchema: SchemaDefinition): boolean {
    if (!mergedSchema || typeof mergedSchema !== 'object') {
      return false;
    }

    // Basic structural validation: check for required top-level keys
    const requiredKeys: (keyof SchemaDefinition)[] = ["type", "properties"];

    if (!requiredKeys.every(key => (mergedSchema as any)[key] !== undefined)) {
      return false;
    }

    // In a real scenario, this would recursively validate every property type against a known JSON Schema standard.
    // For this implementation, we check for the presence of 'properties' object.
    if (typeof (mergedSchema as any).properties !== 'object' || (mergedSchema as any).properties === null) {
      return false;
    }

    return true;
  }
}
import {
  Schema,
  FieldSchema,
  MergeConflictResolver,
} from "./schema-merger-types";

export class StructuredToolOutputSchemaMergerV1017 {
  private readonly defaultResolver: MergeConflictResolver<any>;

  constructor() {
    this.defaultResolver = this.defaultStructuralResolver();
  }

  private defaultStructuralResolver(): MergeConflictResolver<any> {
    return (
      key,
      schemaA,
      schemaB,
      path
    ): any => {
      if (schemaA === null || schemaB === null) {
        return schemaA || schemaB;
      }

      // Simple type conflict resolution: prefer the type that is more restrictive or present in the latest version (B)
      if (schemaA.type !== schemaB.type) {
        console.warn(
          `Structural conflict at ${path}.${key}: Type mismatch detected. A=${schemaA.type}, B=${schemaB.type}. Preferring B's type.`
        );
        return { ...schemaB, type: schemaB.type };
      }

      // If both are objects, attempt deep merge (this is a simplification)
      if (schemaA.type === "object" && schemaB.type === "object") {
        const mergedProperties: Record<string, FieldSchema> = {};
        const allKeys = new Set([...Object.keys(schemaA.properties), ...Object.keys(schemaB.properties)]);

        for (const propKey of allKeys) {
          const propA = schemaA.properties?.[propKey];
          const propB = schemaB.properties?.[propKey];

          if (propA && propB) {
            mergedProperties[propKey] = this.defaultStructuralResolver(
              propKey,
              propA,
              propB,
              `${path}.${key}`
            );
          } else if (propA) {
            mergedProperties[propKey] = propA;
          } else if (propB) {
            mergedProperties[propKey] = propB;
          }
        }
        return { type: "object", properties: mergedProperties };
      }

      // For primitives or arrays, prefer B's value if it exists and is not null
      return schemaB;
    };
  }

  /**
   * Merges two tool output schemas using a provided structural conflict resolver.
   * @param schemaA The base schema (e.g., older version).
   * @param schemaB The overriding schema (e.g., newer version).
   * @param resolver The custom resolver function to handle structural conflicts.
   * @returns The merged Schema object.
   */
  public mergeWithStructuralConflictResolution(
    schemaA: Schema,
    schemaB: Schema,
    resolver: MergeConflictResolver<any>
  ): Schema {
    if (!schemaA || !schemaB) {
      throw new Error("Both schemaA and schemaB must be provided.");
    }

    const mergedProperties: Record<string, FieldSchema> = {};
    const allKeys = new Set([
      ...Object.keys(schemaA.properties || {}),
      ...Object.keys(schemaB.properties || {}),
    ]);

    for (const propKey of allKeys) {
      const propA = schemaA.properties?.[propKey];
      const propB = schemaB.properties?.[propKey];

      if (propA && propB) {
        const mergedField = resolver(
          propKey,
          propA,
          propB,
          `properties.${propKey}`
        );
        mergedProperties[propKey] = mergedField as FieldSchema;
      } else if (propA) {
        mergedProperties[propKey] = propA;
      } else if (propB) {
        mergedProperties[propKey] = propB;
      }
    }

    return {
      type: "object",
      properties: mergedProperties,
      required: [...(schemaA.required || []), ...(schemaB.required || [])]
        .filter((value, index, self) => self.indexOf(value) === index) // Deduplicate
    };
  }

  /**
   * Merges two tool output schemas using the default structural conflict resolution logic.
   * @param schemaA The base schema (e.g., older version).
   * @param schemaB The overriding schema (e.g., newer version).
   * @returns The merged Schema object.
   */
  public mergeWithDefaultStructuralConflictResolution(
    schemaA: Schema,
    schemaB: Schema
  ): Schema {
    return this.mergeWithStructuralConflictResolution(
      schemaA,
      schemaB,
      this.defaultResolver
    );
  }
}
import {
  SchemaObject,
  SchemaDiff,
  SchemaComparisonResult,
} from "./schema-diffing-types";

export class StructuredToolOutputSchemaDiffing {
  calculateDiff(schemaA: SchemaObject, schemaB: SchemaObject): SchemaDiff {
    const diff: SchemaDiff = {
      type: "object",
      properties: {},
      required: [],
      description: "",
      allOf: [],
      oneOf: [],
      anyOf: [],
      items: null,
      additionalProperties: null,
    };

    const propertyDiffs: Record<string, SchemaDiff> = {};
    const allOfDiffs: SchemaDiff[] = [];
    const oneOfDiffs: SchemaDiff[] = [];
    const anyOfDiffs: SchemaDiff[] = [];
    const required: string[] = [];

    const compareProperties = (
      propsA: Record<string, SchemaObject>,
      propsB: Record<string, SchemaObject>,
      currentDiff: SchemaDiff
    ): {
      properties: Record<string, SchemaDiff>;
      required: string[];
    } => {
      const newProperties: Record<string, SchemaDiff> = {};
      const newRequired: string[] = [];

      const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);

      for (const key of allKeys) {
        const schemaA = propsA[key];
        const schemaB = propsB[key];

        if (schemaA && schemaB) {
          const diff = this.compareSchema(schemaA, schemaB);
          newProperties[key] = diff;
        } else if (schemaA && !schemaB) {
          newProperties[key] = {
            type: "removed",
            description: `Property '${key}' removed from schema B.`,
          };
        } else if (!schemaA && schemaB) {
          newProperties[key] = {
            type: "added",
            description: `Property '${key}' added to schema B.`,
          };
        }
      }

      // Simplified required tracking for this scope
      // In a real scenario, we'd need to track 'required' explicitly from the schema structure
      return { properties: newProperties, required: [] };
    };

    const compareArrayItems = (itemsA: SchemaObject | null, itemsB: SchemaObject | null): SchemaDiff | null => {
      if (!itemsA || !itemsB) {
        return null;
      }
      return this.compareSchema(itemsA, itemsB);
    };

    const compareUnion = (unionA: SchemaObject | null, unionB: SchemaObject | null): SchemaDiff | null => {
      if (!unionA || !unionB) {
        return null;
      }
      const diff: SchemaDiff = {
        type: "object",
        properties: {
          _diff_union_items: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  schema: {
                    type: "string",
                    description: "The schema object itself (for tracking)."
                  }
                }
              }
            }
          }
        }
      };

      const diffItems: { schema: SchemaObject, index: number }[] = [];

      // Collect all schemas from both unions
      const allSchemas: SchemaObject[] = [];
      if (Array.isArray(unionA.items)) {
        unionA.items.forEach((item: SchemaObject, index: number) => {
          allSchemas.push({ schema: item, index: index });
        });
      }
      if (Array.isArray(unionB.items)) {
        unionB.items.forEach((item: SchemaObject, index: number) => {
          allSchemas.push({ schema: item, index: index });
        });
      }

      // Simple comparison: just report the difference in the list of schemas
      // A full diffing of union items is complex; we report structural change.
      const diffReport: SchemaDiff = {
        type: "object",
        properties: {
          _diff_union_items_changed: {
            type: "boolean",
            description: "True if the list of schemas in the union has changed.",
          }
        }
      };

      // Placeholder logic for union comparison
      return diffReport;
    };

    // --- Main Logic Execution ---

    const { properties: propDiffs, required: requiredA } = compareProperties(
      schemaA.properties || {},
      schemaB.properties || {},
      diff
    );

    const finalDiff: SchemaDiff = {
      type: "object",
      properties: propDiffs,
      required: [], // Simplified: Real required tracking is complex
      description: "",
      allOf: [],
      oneOf: [],
      anyOf: [],
      items: compareArrayItems(schemaA.items, schemaB.items),
      additionalProperties: this.compareSchema(
        schemaA.additionalProperties,
        schemaB.additionalProperties
      ),
    };

    // Handle allOf, oneOf, anyOf comparison (simplified)
    if (schemaA.allOf || schemaB.allOf) {
      const allOfDiff = this.compareSchema(schemaA.allOf, schemaB.allOf);
      if (allOfDiff) finalDiff.allOf = [allOfDiff];
    }
    if (schemaA.oneOf || schemaB.oneOf) {
      const oneOfDiff = this.compareSchema(schemaA.oneOf, schemaB.oneOf);
      if (oneOfDiff) finalDiff.oneOf = [oneOfDiff];
    }
    if (schemaA.anyOf || schemaB.anyOf) {
      const anyOfDiff = this.compareSchema(schemaA.anyOf, schemaB.anyOf);
      if (anyOfDiff) finalDiff.anyOf = [anyOfDiff];
    }

    return finalDiff;
  }

  private compareSchema(schemaA: SchemaObject, schemaB: SchemaObject): SchemaDiff | null {
    if (!schemaA || !schemaB) {
      return null;
    }

    const diff: SchemaDiff = {
      type: "object",
      properties: {},
      required: [],
      description: "",
      allOf: [],
      oneOf: [],
      anyOf: [],
      items: null,
      additionalProperties: null,
    };

    const propDiffs: Record<string, SchemaDiff> = {};
    const required: string[] = [];

    // 1. Compare Properties
    const { properties: propDiffs: newPropDiffs, required: newRequired } = this.compareProperties(
      schemaA.properties || {},
      schemaB.properties || {},
      diff
    );
    Object.assign(diff.properties, newPropDiffs);
    // In a real implementation, we'd merge required fields here.

    // 2. Compare Array Items
    diff.items = this.compareArrayItems(schemaA.items, schemaB.items);

    // 3. Compare Additional Properties
    diff.additionalProperties = this.compareSchema(
      schemaA.additionalProperties,
      schemaB.additionalProperties
    );

    // 4. Compare Combinators (allOf, oneOf, anyOf)
    if (schemaA.allOf || schemaB.allOf) {
      const allOfDiff = this.compareSchema(schemaA.allOf, schemaB.allOf);
      if (allOfDiff) diff.allOf = [allOfDiff];
    }
    if (schemaA.oneOf || schemaB.oneOf) {
      const oneOfDiff = this.compareSchema(schemaA.oneOf, schemaB.oneOf);
      if (oneOfDiff) diff.oneOf = [oneOfDiff];
    }
    if (schemaA.anyOf || schemaB.anyOf) {
      const anyOfDiff = this.compareSchema(schemaA.anyOf, schemaB.anyOf);
      if (anyOfDiff) diff.anyOf = [anyOfDiff];
    }

    // 5. Handle Union Type Changes (If the schema itself is a union)
    if (schemaA.oneOf || schemaB.oneOf) {
      const unionDiff = this.compareUnion(schemaA.oneOf, schemaB.oneOf);
      if (unionDiff) diff.oneOf = [unionDiff];
    }

    // Basic check for type change (e.g., object -> array)
    if (schemaA.type !== schemaB.type) {
      diff.type = {
        type: "changed",
        description: `Type changed from '${schemaA.type || 'any'}' to '${schemaB.type || 'any'}'`,
      };
    }

    // If no structural changes were detected, return null or a minimal diff
    if (Object.keys(diff.properties).length === 0 && !diff.items && !diff.allOf && !diff.oneOf && !diff.anyOf) {
      return null;
    }

    return diff;
  }

  private compareProperties(
    propsA: Record<string, SchemaObject>,
    propsB: Record<string, SchemaObject>,
    currentDiff: SchemaDiff
  ): {
    properties: Record<string, SchemaDiff>;
    required: string[];
  } {
    const newProperties: Record<string, SchemaDiff> = {};
    const newRequired: string[] = [];

    const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);

    for (const key of allKeys) {
      const schemaA = propsA[key];
      const schemaB = propsB[key];

      if (schemaA && schemaB) {
        const diff = this.compareSchema(schemaA, schemaB);
        newProperties[key] = diff || { type: "unchanged", description: `Property '${key}' is structurally identical.` };
      } else if (schemaA && !schemaB) {
        newProperties[key] = {
          type: "removed",
          description: `Property '${key}' removed from schema B.`,
        };
      } else if (!schemaA && schemaB) {
        newProperties[key] = {
          type: "added",
          description: `Property '${key}' added to schema B.`,
        };
      }
    }

    return { properties: newProperties, required: [] };
  }
}
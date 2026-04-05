import {
  Schema,
  SchemaDefinition,
  Type,
  UnionSchema,
  FieldSchema,
} from "./schema-types";

export class ToolOutputSchemaUnionResolverV12 {
  resolve(
    schemas: SchemaDefinition[],
    context: Record<string, unknown> = {}
  ): SchemaDefinition {
    if (!schemas || schemas.length === 0) {
      return { type: "object", properties: {} } as SchemaDefinition;
    }

    const mergedSchema = this.mergeSchemas(schemas, context);

    return {
      type: "object",
      properties: mergedSchema.properties || {},
      required: mergedSchema.required || [],
    } as SchemaDefinition;
  }

  private mergeSchemas(
    schemas: SchemaDefinition[],
    context: Record<string, unknown>
  ): { properties: Record<string, SchemaDefinition>; required: string[] } {
    const properties: Record<string, SchemaDefinition> = {};
    const requiredSet = new Set<string>();

    for (const schema of schemas) {
      if (schema.type === "object" && schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (properties[key]) {
            properties[key] = this.resolveConflict(
              properties[key] as SchemaDefinition,
              propSchema as SchemaDefinition,
              key,
              context
            );
          } else {
            properties[key] = propSchema as SchemaDefinition;
          }
        }
      }
    }

    // Simple heuristic for required fields: if any schema requires it, we might consider it required,
    // but for robust union merging, we'll stick to explicit union logic or assume all properties are optional
    // unless a specific conflict resolution dictates otherwise.
    // For V12, we prioritize union merging within the properties themselves.

    return {
      properties: properties,
      required: [], // Simplified: relying on explicit union resolution within properties
    };
  }

  private resolveConflict(
    existing: SchemaDefinition,
    incoming: SchemaDefinition,
    key: string,
    context: Record<string, unknown>
  ): SchemaDefinition {
    // Strategy: If both are unions, merge the unions.
    if (existing.type === "union" && incoming.type === "union") {
      const existingUnion = existing as UnionSchema;
      const incomingUnion = incoming as UnionSchema;

      const combinedTypes: SchemaDefinition[] = [
        ...(existingUnion.schema || []),
        ...(incomingUnion.schema || []),
      ];

      // Deduplicate types while maintaining structure
      const uniqueTypesMap = new Map<string, SchemaDefinition>();
      for (const type of combinedTypes) {
        const typeKey = JSON.stringify(type);
        if (!uniqueTypesMap.has(typeKey)) {
          uniqueTypesMap.set(typeKey, type);
        }
      }

      return { type: "union", schema: Array.from(uniqueTypesMap.values()) } as UnionSchema;
    }

    // Strategy: If one is a union and the other is not, wrap the non-union in a union.
    if (existing.type === "union" && incoming.type !== "union") {
      const existingUnion = existing as UnionSchema;
      return {
        type: "union",
        schema: [...(existingUnion.schema || []), incoming],
      } as UnionSchema;
    }

    if (incoming.type === "union" && existing.type !== "union") {
      const incomingUnion = incoming as UnionSchema;
      return {
        type: "union",
        schema: [...(existingUnion.schema || []), ...(incomingUnion.schema || [])],
      } as UnionSchema;
    }

    // Strategy: If types conflict (e.g., one is 'string', other is 'number'),
    // default to a union of the two types, unless one is more specific (e.g., an object).
    if (existing.type !== incoming.type && existing.type !== "object" && incoming.type !== "object") {
      return { type: "union", schema: [existing, incoming] } as UnionSchema;
    }

    // Fallback: If types match or one is more complex (object), prefer the incoming one or merge properties if both are objects.
    if (existing.type === "object" && incoming.type === "object") {
      return this.mergeSchemas(
        [existing, incoming],
        context
      ).properties ? { type: "object", properties: this.mergeSchemas([existing, incoming], context).properties } : existing;
    }

    return incoming; // Default to incoming schema if no specific conflict resolution is defined
  }
}
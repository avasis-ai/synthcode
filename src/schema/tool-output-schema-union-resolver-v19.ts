import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

interface SchemaField {
  type: string;
  description?: string;
  required?: boolean;
  schema?: SchemaField | SchemaField[];
}

type ToolOutputSchema = SchemaField;

export class ToolOutputSchemaUnionResolverV19 {
  private readonly unionSchemas: ToolOutputSchema[];

  constructor(unionSchemas: ToolOutputSchema[]) {
    this.unionSchemas = unionSchemas;
  }

  private resolvePrimitiveUnion(schemas: SchemaField[]): SchemaField {
    if (schemas.length === 0) {
      throw new Error("Cannot resolve union of zero schemas.");
    }

    const combinedSchema: Record<string, any> = {
      type: "union",
      description: "One of the provided tool output schemas.",
      items: []
    };

    const uniqueTypes = new Set<string>();
    const typeMap = new Map<string, SchemaField[]>();

    for (const schema of schemas) {
      if (schema.type) {
        if (!uniqueTypes.has(schema.type)) {
          uniqueTypes.add(schema.type);
          if (!typeMap.has(schema.type)) {
            typeMap.set(schema.type, []);
          }
        }
      }
    }

    // For simplicity in this resolver, we just list them as alternatives
    // A real implementation would merge properties if types overlap (e.g., object merging)
    combinedSchema.items = schemas.map(s => ({
      ...s,
      // Ensure 'type' is present for union clarity
      type: s.type || "any"
    }));

    return combinedSchema;
  }

  private resolveObjectUnion(schemas: SchemaField[]): SchemaField {
    if (schemas.length === 0) {
      throw new Error("Cannot resolve union of zero object schemas.");
    }

    const mergedProperties = new Map<string, SchemaField>();

    for (const schema of schemas) {
      if (schema.type === "object" && schema.schema) {
        const currentSchema = schema.schema as Record<string, any>;
        for (const [key, value] of Object.entries(currentSchema)) {
          if (typeof value === 'object' && value !== null && 'type' in value) {
            const fieldSchema = value as SchemaField;

            if (!mergedProperties.has(key)) {
              mergedProperties.set(key, fieldSchema);
            } else {
              const existingSchema = mergedProperties.get(key)!;
              // Simple conflict resolution: if both are unions, try to merge the items.
              // Otherwise, prioritize the first defined schema or throw on conflict.
              if (existingSchema.type === "union" && fieldSchema.type === "union") {
                // This requires deep merging of union items, which is complex.
                // For V19, we assume the union structure handles this by listing all.
                // We'll just append the new items to the existing union structure.
                const existingItems = (existingSchema as any).items || [];
                const newItems = (fieldSchema as any).items || [];
                mergedProperties.set(key, {
                    ...existingSchema,
                    items: [...existingItems, ...newItems]
                });
              } else if (existingSchema.type !== fieldSchema.type) {
                // Type conflict detected
                throw new Error(`Schema conflict for key "${key}": Types ${existingSchema.type} and ${fieldSchema.type} are incompatible.`);
              } else {
                // Types match, attempt to merge properties recursively (simplified)
                // For simplicity, we'll just overwrite or keep the first one if they are complex.
                mergedProperties.set(key, fieldSchema);
              }
            }
          }
        }
      }
    }

    const mergedSchema: SchemaField = {
      type: "object",
      description: "Union of tool output schemas.",
      schema: {
        type: "object",
        properties: Object.fromEntries(mergedProperties),
        required: Array.from(mergedProperties.values()).filter(s => s.required).map(s => s as any).map(s => s['__key__'] || 'unknown') // Placeholder for required tracking
      }
    };

    // A proper implementation would need to track required fields across all input schemas.
    return mergedSchema;
  }

  /**
   * Resolves the union of multiple tool output schemas into a single, combined schema.
   * @returns {SchemaField} The resolved union schema.
   */
  public resolve(): SchemaField {
    if (this.unionSchemas.length === 0) {
      throw new Error("Cannot resolve union: No schemas provided.");
    }

    // Check if all schemas are objects to use object merging logic
    const allObjects = this.unionSchemas.every(s => s.type === "object" && s.schema);
    if (allObjects) {
      return this.resolveObjectUnion(this.unionSchemas);
    }

    // Fallback to primitive/general union resolution
    return this.resolvePrimitiveUnion(this.unionSchemas);
  }
}
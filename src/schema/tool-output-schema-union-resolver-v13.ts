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

interface Schema {
  name: string;
  description: string;
  properties: Record<string, any>;
  required?: string[];
}

interface Context {
  messages: Message[];
  // Add other context fields as necessary
}

export class ToolOutputSchemaUnionResolverV13 {
  constructor(private schemas: Schema[], private context: Context) {}

  resolveUnion(): Schema | null {
    if (this.schemas.length === 0) {
      return null;
    }

    // 1. Check for explicit union definitions (Simplified check for demonstration)
    // In a real scenario, schemas might contain a specific 'oneOf' or 'anyOf' structure.
    // We assume if any schema explicitly defines a union structure, we prioritize that.
    const hasExplicitUnion = this.schemas.some(schema =>
      schema.properties && typeof schema.properties['oneOf'] === 'object'
    );

    if (hasExplicitUnion) {
      // If explicit union exists, we'd ideally merge them according to JSON Schema rules.
      // For this implementation, we'll just return the first one found if it signals a union.
      console.log("Resolver detected explicit union definition.");
      return this.schemas[0];
    }

    // 2. Fallback: Robust, context-aware union logic
    return this.mergeSchemas(this.schemas);
  }

  private mergeSchemas(schemas: Schema[]): Schema {
    const mergedProperties: Record<string, any> = {};
    const mergedRequiredSet = new Set<string>();

    for (const schema of schemas) {
      const properties = schema.properties || {};
      const required = schema.required || [];

      for (const [key, propSchema] of Object.entries(properties)) {
        if (mergedProperties[key] === undefined) {
          // First time seeing this key, adopt its schema
          mergedProperties[key] = propSchema;
        } else {
          // Conflict resolution: Merge or prioritize.
          // Simple strategy: If types conflict, use the most general type (e.g., object over string).
          // For simplicity here, we'll just merge properties if they are objects,
          // otherwise, we'll keep the first one encountered.
          if (typeof propSchema === 'object' && propSchema !== null &&
              typeof mergedProperties[key] === 'object' && mergedProperties[key] !== null) {
            // Deep merge logic placeholder
            mergedProperties[key] = {
              ...mergedProperties[key],
              ...propSchema,
            };
          } else {
            // Type conflict or simple overwrite (keeping the first one is safer)
            // For this resolver, we prioritize the first definition encountered.
          }
        }
      }

      required.forEach(key => {
        mergedRequiredSet.add(key);
      });
    }

    const mergedSchema: Schema = {
      name: "MergedToolOutput",
      description: "A union of multiple tool output schemas.",
      properties: mergedProperties,
      required: Array.from(mergedRequiredSet),
    };

    return mergedSchema;
  }
}
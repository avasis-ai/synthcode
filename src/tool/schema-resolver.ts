import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Schema = Record<string, any>;

interface SchemaSource {
  schema: Schema;
  priority: number;
  sourceName: string;
}

interface ResolvedSchema {
  schema: Schema;
  isValid: boolean;
}

class SchemaResolver {
  private sources: SchemaSource[];

  constructor(sources: SchemaSource[]) {
    this.sources = sources;
  }

  private mergeSchemas(base: Schema, newSchema: Schema): Schema {
    const merged: Schema = { ...base };
    for (const key in newSchema) {
      if (Object.prototype.hasOwnProperty.call(newSchema, key)) {
        const value = newSchema[key];
        if (typeof value === 'object' && value !== null && typeof base[key] === 'object' && base[key] !== null) {
          // Simple recursive merge for object properties
          merged[key] = {
            ...(base[key] as Record<string, any>),
            ...(value as Record<string, any>),
          };
        } else {
          // Overwrite or set primitive/array types
          merged[key] = value;
        }
      }
    }
    return merged;
  }

  public resolve(): ResolvedSchema {
    if (this.sources.length === 0) {
      return { schema: {}, isValid: false };
    }

    // Sort by priority: higher number means higher priority (later in the list)
    const sortedSources = [...this.sources].sort((a, b) => a.priority - b.priority);

    let finalSchema: Schema = {};

    // Strategy: Merge schemas sequentially, allowing later (higher priority) sources to override earlier ones.
    for (const source of sortedSources) {
      finalSchema = this.mergeSchemas(finalSchema, source.schema);
    }

    // Basic validation check (can be expanded significantly)
    const isValid = this.validateSchema(finalSchema);

    return {
      schema: finalSchema,
      isValid: isValid,
    };
  }

  private validateSchema(schema: Schema): boolean {
    // Placeholder for complex JSON Schema validation logic.
    // For this implementation, we assume if we successfully merged, it's 'valid enough'.
    return Object.keys(schema).length > 0;
  }
}

export { SchemaResolver };
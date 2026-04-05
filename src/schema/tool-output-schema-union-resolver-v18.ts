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

type Schema = Record<string, any>;

export class ToolOutputSchemaUnionResolverV18 {
  private schemas: Schema[];

  constructor(schemas: Schema[]) {
    this.schemas = schemas;
  }

  public resolveUnionSchema(): Schema {
    if (this.schemas.length === 0) {
      return {};
    }

    let mergedSchema: Schema = {};

    for (const schema of this.schemas) {
      this.mergeSchema(mergedSchema, schema);
    }

    return mergedSchema;
  }

  private mergeSchema(target: Schema, source: Schema): void {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {
          if (typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
            // Recursively merge object properties
            this.mergeSchema(targetValue as Schema, sourceValue as Schema);
          } else {
            // Overwrite or set new object property
            target[key] = { ...sourceValue, description: sourceValue.description || "" };
          }
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          // Handle array merging (simplified: assume union of types or overwrite)
          // For simplicity in this context, we'll just merge descriptions if they exist
          if (typeof sourceValue[0] === 'object' && sourceValue[0] !== null) {
            // If arrays contain schemas, we might need a specialized union resolver here.
            // For now, we treat it as an overwrite or union of definitions.
            target[key] = sourceValue;
          } else {
            target[key] = sourceValue;
          }
        } else {
          // Primitive type conflict resolution: Source wins, but we try to merge descriptions.
          const mergedType = typeof sourceValue === 'string' ? 'string' : typeof targetValue === 'string' ? 'string' : typeof sourceValue;
          target[key] = {
            ...sourceValue,
            description: (targetValue as any)?.description || sourceValue.description || "Merged property",
          };
        }
      }
    }
  }
}
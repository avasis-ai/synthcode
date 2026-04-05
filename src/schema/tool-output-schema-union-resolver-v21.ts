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

interface SchemaResolver {
  resolve(schemas: any[]): any;
}

export class ToolOutputSchemaUnionResolverV21 implements SchemaResolver {
  resolve(schemas: any[]): any {
    if (!schemas || schemas.length === 0) {
      return {};
    }

    const mergedSchema: Record<string, any> = {};

    for (const schema of schemas) {
      if (typeof schema !== 'object' || schema === null) continue;

      for (const key in schema) {
        if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;

        const currentSchema = schema[key];
        const existingSchema = mergedSchema[key];

        if (!existingSchema) {
          mergedSchema[key] = currentSchema;
          continue;
        }

        if (typeof currentSchema !== 'object' || currentSchema === null || typeof existingSchema !== 'object' || existingSchema === null) {
          // Simple type conflict, prefer the more complex/defined one or merge if possible
          mergedSchema[key] = currentSchema;
          continue;
        }

        // Handle Union Merging Logic
        if (Array.isArray(currentSchema) && Array.isArray(existingSchema)) {
          mergedSchema[key] = this.mergeUnionSchemas(existingSchema, currentSchema);
        } else if (typeof currentSchema === 'object' && typeof existingSchema === 'object') {
          // Deep merge for object properties
          mergedSchema[key] = { ...existingSchema, ...currentSchema };
        } else {
          // Type conflict on non-object, prefer existing or throw/log in a real system
          mergedSchema[key] = currentSchema;
        }
      }
    }

    return mergedSchema;
  }

  private mergeUnionSchemas(union1: any[], union2: any[]): any[] {
    const combined: any[] = [...union1];
    const newUnions: any[] = [];
    const seenTypes = new Set<string>();

    for (const schema of union2) {
      if (typeof schema !== 'object' || schema === null) continue;

      for (const key in schema) {
        if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;
        const value = schema[key];

        if (typeof value === 'object' && value !== null && Array.isArray(value)) {
          // Recursively merge array/union types if necessary (simplified for this scope)
          const mergedArray = this.mergeUnionSchemas(
            (seenTypes.has(key) ? [seenTypes.get(key)] : []).concat(union1.filter(s => s[key])),
            value
          );
          newUnions.push({ [key]: mergedArray });
          seenTypes.delete(key);
        } else {
          const newSchemaItem: Record<string, any> = {};
          newSchemaItem[key] = value;

          // Check for mutual exclusivity or type promotion conflict
          let conflict = false;
          for (const existingSchema of union1) {
            if (existingSchema[key] && typeof existingSchema[key] !== 'undefined') {
              // Basic conflict detection: if types are fundamentally different (e.g., string vs number)
              if (typeof existingSchema[key] !== typeof value) {
                // In a real resolver, this would involve complex type union logic.
                // Here, we just ensure the union contains both definitions.
              }
            }
          }
          newUnions.push(newSchemaItem);
        }
      }
    }

    // Simple deduplication and flattening of the resulting union array
    const finalUnion: any[] = [];
    const uniqueKeys = new Set<string>();

    for (const item of [...union1, ...union2]) {
      if (typeof item !== 'object' || item === null) continue;
      for (const key in item) {
        if (!Object.prototype.hasOwnProperty.call(item, key)) continue;
        if (!uniqueKeys.has(key)) {
          finalUnion.push({ [key]: item[key] });
          uniqueKeys.add(key);
        }
      }
    }

    return finalUnion;
  }
}
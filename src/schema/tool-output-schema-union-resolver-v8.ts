import { BaseSchemaResolver } from "./base-schema-resolver";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface Schema {
  type: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  oneOf?: Schema[];
  allOf?: Schema[];
  description?: string;
}

export class ToolOutputSchemaUnionResolverV8 extends BaseSchemaResolver {
  resolveUnion(schemas: Schema[], context: Record<string, unknown>): Schema {
    if (!schemas || schemas.length === 0) {
      throw new Error("Cannot resolve union of zero schemas.");
    }

    let mergedSchema: Schema = { type: "object", properties: {}, required: [] };

    for (const schema of schemas) {
      if (schema.type !== "object") {
        throw new Error(`V8 Resolver only supports object union merging for now. Found type: ${schema.type}`);
      }

      const currentProperties = schema.properties || {};
      const currentRequired = schema.required || [];

      for (const key in currentProperties) {
        if (Object.prototype.hasOwnProperty.call(currentProperties, key)) {
          const propSchema = currentProperties[key];
          const existingPropSchema = mergedSchema.properties?.[key];

          if (existingPropSchema) {
            // Structural conflict resolution for nested properties
            const mergedProp = this.mergeSchemas(existingPropSchema, propSchema, context);
            mergedSchema.properties![key] = mergedProp;
            
            // Update required status if either schema requires it
            if (!currentRequired.includes(key) && !existingPropSchema.required?.includes(key)) {
                // This logic is complex; for simplicity, we assume if it exists in any, it's potentially required
            }
          } else {
            mergedSchema.properties![key] = propSchema;
            mergedSchema.required![key] = true; // Assume presence if defined in any schema
          }
        }
      }
    }

    // Finalize required fields based on all inputs
    const allRequired: Set<string> = new Set<string>();
    for (const schema of schemas) {
        if (schema.required) {
            schema.required.forEach(key => allRequired.add(key));
        }
    }
    mergedSchema.required = Array.from(allRequired);

    return mergedSchema;
  }

  private mergeSchemas(schema1: Schema, schema2: Schema, context: Record<string, unknown>): Schema {
    const merged: Partial<Schema> = {};

    // Simple merge for properties and required arrays
    const mergeProperties = (p1: Record<string, Schema>, p2: Record<string, Schema>): Record<string, Schema> => {
        const result: Record<string, Schema> = { ...p1 };
        for (const key in p2) {
            if (Object.prototype.hasOwnProperty.call(p2, key)) {
                const keySchema = p2[key];
                const existingSchema = p1[key];
                if (existingSchema) {
                    result[key] = this.mergeSchemas(existingSchema, keySchema, context);
                } else {
                    result[key] = keySchema;
                }
            }
        }
        return result;
    };

    merged.properties = mergeProperties(schema1.properties || {}, schema2.properties || {});
    
    // For required, we take the union of all required fields
    const combinedRequired = new Set<string>();
    if (schema1.required) schema1.required.forEach(r => combinedRequired.add(r));
    if (schema2.required) schema2.required.forEach(r => combinedRequired.add(r));
    merged.required = Array.from(combinedRequired);

    // Type promotion/union handling (simplified)
    if (schema1.oneOf || schema2.oneOf) {
        merged.oneOf = [...(schema1.oneOf || []), ...(schema2.oneOf || [])];
    } else {
        merged.oneOf = undefined;
    }

    return {
        type: "object",
        properties: merged.properties as Record<string, Schema>,
        required: merged.required as string[] | undefined,
        oneOf: merged.oneOf as Schema[] | undefined,
        description: schema1.description || schema2.description || undefined
    };
  }
}

export const createToolOutputSchemaUnionResolverV8 = (): ToolOutputSchemaUnionResolverV8 => {
    return new ToolOutputSchemaUnionResolverV8();
};
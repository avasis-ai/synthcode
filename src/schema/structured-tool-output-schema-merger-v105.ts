import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
  properties?: Record<string, SchemaField>;
}

export interface StructuredSchema {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
}

export enum ConflictResolutionStrategy {
  LATEST_WINS,
  UNION_OF_TYPES,
  CUSTOM_RESOLVER,
}

export class StructuredToolOutputSchemaMerger {
  private schemas: StructuredSchema[];

  constructor(schemas: StructuredSchema[]) {
    this.schemas = schemas;
  }

  public merge(strategy: ConflictResolutionStrategy): StructuredSchema {
    if (!this.schemas || this.schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    let mergedProperties: Record<string, SchemaField> = {};
    let mergedRequired: Set<string> = new Set();

    for (const schema of this.schemas) {
      this.mergeSchema(schema, mergedProperties, mergedRequired, strategy);
    }

    const finalRequired = Array.from(mergedRequired);

    return {
      type: "object",
      properties: mergedProperties,
      required: finalRequired,
    };
  }

  private mergeSchema(
    schema: StructuredSchema,
    mergedProperties: Record<string, SchemaField>,
    mergedRequired: Set<string>,
    strategy: ConflictResolutionStrategy
  ): void {
    for (const [key, field] of Object.entries(schema.properties || {})) {
      const existingField = mergedProperties[key];

      if (!existingField) {
        mergedProperties[key] = field;
        if (field.required) {
          mergedRequired.add(key);
        }
        return;
      }

      if (strategy === ConflictResolutionStrategy.LATEST_WINS) {
        mergedProperties[key] = field;
        if (field.required) {
          mergedRequired.add(key);
        }
      } else if (strategy === ConflictResolutionStrategy.UNION_OF_TYPES) {
        const mergedField = this.resolveUnion(existingField, field);
        mergedProperties[key] = mergedField;
        if (field.required) {
          mergedRequired.add(key);
        }
      } else if (strategy === ConflictResolutionStrategy.CUSTOM_RESOLVER) {
        const resolvedField = this.resolveCustom(existingField, field);
        mergedProperties[key] = resolvedField;
        if (field.required) {
          mergedRequired.add(key);
        }
      }
    }
  }

  private resolveUnion(
    existing: SchemaField,
    newField: SchemaField
  ): SchemaField {
    const union: Record<string, SchemaField> = {};
    const allProperties = { ...existing.properties, ...newField.properties };

    for (const [key, prop] of Object.entries(allProperties)) {
      if (prop.properties) {
        union[key] = {
          type: "object",
          properties: prop.properties,
          required: [],
        } as SchemaField;
      } else {
        union[key] = prop;
      }
    }

    return {
      type: "object",
      properties: union,
      required: [],
    } as SchemaField;
  }

  private resolveCustom(
    existing: SchemaField,
    newField: SchemaField
  ): SchemaField {
    // Simple fallback: prefer the structure of the new field, but merge required status
    const mergedProperties: Record<string, SchemaField> = { ...existing.properties, ...newField.properties };
    const mergedRequired: Set<string> = new Set([...existing.required, ...newField.required]);

    return {
      type: "object",
      properties: mergedProperties,
      required: Array.from(mergedRequired),
    };
  }
}
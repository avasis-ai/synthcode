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

export type SchemaDiff = {
  path: string;
  diff: {
    added?: {
      name: string;
      type: string;
      description?: string;
      required?: boolean;
    };
    removed?: {
      name: string;
      type: string;
      description?: string;
      required?: boolean;
    };
    modified?: {
      field: string;
      oldType: string;
      newType: string;
      oldRequired: boolean;
      newRequired: boolean;
    };
    nestedDiff?: SchemaDiff;
  };
};

export type SchemaDefinition = Record<string, {
  type: string;
  description?: string;
  required?: boolean;
  properties?: Record<string, SchemaDefinition>;
  items?: {
    type: string;
    properties?: Record<string, SchemaDefinition>;
  };
}>;

interface DiffReport {
  diffs: SchemaDiff[];
}

export function calculateSchemaDiff(
  schemaA: SchemaDefinition,
  schemaB: SchemaDefinition,
  currentPath: string = ""
): SchemaDiff {
  const diff: SchemaDiff = {
    path: currentPath,
    diff: {},
  };

  const keysA = Object.keys(schemaA.properties || {});
  const keysB = Object.keys(schemaB.properties || {});
  const allKeys = new Set([...keysA, ...keysB]);

  const diffProperties: Record<string, any> = {};

  for (const key of allKeys) {
    const propA = schemaA.properties?.[key];
    const propB = schemaB.properties?.[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (!propA && propB) {
      diffProperties[key] = {
        diff: {
          added: {
            name: key,
            type: propB.type,
            description: propB.description,
            required: propB.required ?? false,
          },
        },
      };
    } else if (propA && !propB) {
      diffProperties[key] = {
        diff: {
          removed: {
            name: key,
            type: propA.type,
            description: propA.description,
            required: propA.required ?? false,
          },
        },
      };
    } else if (propA && propB) {
      let propertyDiff: any = {};
      const typeChanged = propA.type !== propB.type;
      const requiredChanged = (propA.required ?? false) !== (propB.required ?? false);

      if (typeChanged || requiredChanged) {
        propertyDiff.diff = {
          modified: {
            field: key,
            oldType: propA.type,
            newType: propB.type,
            oldRequired: propA.required ?? false,
            newRequired: propB.required ?? false,
          },
        };
      }

      if (propA.properties && propB.properties) {
        const nestedDiff = calculateSchemaDiff(
          propA as unknown as SchemaDefinition,
          propB as unknown as SchemaDefinition,
          newPath
        );
        propertyDiff.diff.nestedDiff = nestedDiff;
      } else if (propA.items && propB.items) {
        // Handle array item schema comparison (simplified for this scope)
        const itemDiff = calculateSchemaDiff(
          { properties: { any: propA.items } } as unknown as SchemaDefinition,
          { properties: { any: propB.items } } as unknown as SchemaDefinition,
          newPath
        );
        propertyDiff.diff.nestedDiff = itemDiff;
      } else if (propA.properties || propB.properties) {
        // Fallback for nested object comparison if items isn't used
        const nestedDiff = calculateSchemaDiff(
          propA as unknown as SchemaDefinition,
          propB as unknown as SchemaDefinition,
          newPath
        );
        propertyDiff.diff.nestedDiff = nestedDiff;
      } else {
        propertyDiff.diff = {
          nestedDiff: undefined,
        };
      }
      
      diffProperties[key] = propertyDiff;
    }
  }

  // Consolidate the final diff structure
  const finalDiff: Record<string, any> = {};
  for (const key of allKeys) {
    const propA = schemaA.properties?.[key];
    const propB = schemaB.properties?.[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (!propA && propB) {
      finalDiff[key] = {
        diff: {
          added: {
            name: key,
            type: propB.type,
            description: propB.description,
            required: propB.required ?? false,
          },
        },
      };
    } else if (propA && !propB) {
      finalDiff[key] = {
        diff: {
          removed: {
            name: key,
            type: propA.type,
            description: propA.description,
            required: propA.required ?? false,
          },
        },
      };
    } else if (propA && propB) {
      let propertyDiff: any = {};
      const typeChanged = propA.type !== propB.type;
      const requiredChanged = (propA.required ?? false) !== (propB.required ?? false);

      if (typeChanged || requiredChanged) {
        propertyDiff.diff = {
          modified: {
            field: key,
            oldType: propA.type,
            newType: propB.type,
            oldRequired: propA.required ?? false,
            newRequired: propB.required ?? false,
          },
        };
      }

      if (propA.properties && propB.properties) {
        const nestedDiff = calculateSchemaDiff(
          propA as unknown as SchemaDefinition,
          propB as unknown as SchemaDefinition,
          newPath
        );
        propertyDiff.diff.nestedDiff = nestedDiff;
      } else if (propA.items && propB.items) {
        const nestedDiff = calculateSchemaDiff(
          { properties: { any: propA.items } } as unknown as SchemaDefinition,
          { properties: { any: propB.items } } as unknown as SchemaDefinition,
          newPath
        );
        propertyDiff.diff.nestedDiff = nestedDiff;
      } else {
        propertyDiff.diff = {
          nestedDiff: undefined,
        };
      }
      finalDiff[key] = propertyDiff;
    }
  }

  return {
    path: currentPath,
    diff: finalDiff,
  };
}
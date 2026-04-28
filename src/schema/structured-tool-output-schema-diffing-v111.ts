import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  description?: string;
  required?: boolean;
  items?: SchemaField;
  properties?: Record<string, SchemaField>;
}

export interface SchemaDiff {
  path: string;
  changeType: 'TYPE_CHANGE' | 'FIELD_ADDED' | 'FIELD_REMOVED' | 'REQUIRED_STATUS_CHANGE' | 'NESTED_CHANGE' | 'TYPE_MISMATCH';
  details: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type SchemaDiffingResult = SchemaDiff[];

export class SchemaDiffer {
  static diffSchemas(schemaA: SchemaField, schemaB: SchemaField): SchemaDiffingResult {
    const diffs: SchemaDiffingResult = [];
    SchemaDiffer._compareFields(schemaA, schemaB, "", diffs);
    return diffs;
  }

  private static _compareFields(
    schemaA: SchemaField,
    schemaB: SchemaField,
    currentPath: string,
    diffs: SchemaDiffingResult
  ): SchemaDiffingResult {
    const results: SchemaDiffingResult = [];

    // 1. Check for type changes and required status changes at the current level
    if (schemaA.type !== schemaB.type) {
      results.push({
        path: currentPath,
        changeType: 'TYPE_CHANGE',
        details: {
          from: schemaA.type,
          to: schemaB.type,
        },
        severity: 'HIGH',
      });
    }

    const aIsRequired = schemaA.required === true;
    const bIsRequired = schemaB.required === true;
    if (aIsRequired !== bIsRequired) {
      results.push({
        path: currentPath,
        changeType: 'REQUIRED_STATUS_CHANGE',
        details: {
          wasRequired: aIsRequired,
          isRequired: bIsRequired,
        },
        severity: 'MEDIUM',
      });
    }

    // 2. Handle Object Properties
    if (schemaA.type === 'object' && schemaB.type === 'object') {
      const propsA = schemaA.properties || {};
      const propsB = schemaB.properties || {};
      const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)]);

      for (const key of allKeys) {
        const path = currentPath ? `${currentPath}.${key}` : key;
        const propA = propsA[key];
        const propB = propsB[key];

        if (propA && !propB) {
          results.push({
            path: path,
            changeType: 'FIELD_REMOVED',
            details: {
              originalSchema: propA,
            },
            severity: 'MEDIUM',
          });
        } else if (!propA && propB) {
          results.push({
            path: path,
            changeType: 'FIELD_ADDED',
            details: {
              newSchema: propB,
            },
            severity: 'LOW',
          });
        } else {
          // Both exist, recurse
          SchemaDiffer._compareFields(propA, propB, path, results);
        }
      }
    }

    // 3. Handle Array Items
    if (schemaA.type === 'array' && schemaB.type === 'array') {
      if (schemaA.items && schemaB.items) {
        const arrayPath = currentPath;
        SchemaDiffer._compareFields(schemaA.items, schemaB.items, arrayPath, results);
      }
    }

    return results;
  }
}
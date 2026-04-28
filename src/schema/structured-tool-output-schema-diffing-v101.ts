import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDiffReport {
  addedFields: {
    [key: string]: {
      description: string;
      type: any;
    };
  };
  removedFields: {
    [key: string]: {
      description: string;
      type: any;
    };
  };
  modifiedFields: {
    [key: string]: {
      oldType: any;
      newType: any;
      description: string;
      changes: string[];
    };
  };
  // Add more specific change types if necessary (e.g., renamed, constraintChange)
}

interface SchemaDefinition {
  type: string;
  properties?: {
    [key: string]: SchemaDefinition;
  };
  required?: string[];
  description?: string;
  // Add other JSON Schema keywords as needed for full fidelity
}

export class SchemaDiffer {
  public static calculateDiff(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition
  ): SchemaDiffReport {
    const report: SchemaDiffReport = {
      addedFields: {},
      removedFields: {},
      modifiedFields: {},
    };

    const oldProps = oldSchema.properties || {};
    const newProps = newSchema.properties || {};

    const allKeys = new Set<string>([
      ...Object.keys(oldProps),
      ...Object.keys(newProps),
    ]);

    for (const key of allKeys) {
      const oldProp = oldProps[key];
      const newProp = newProps[key];

      if (!oldProp && newProp) {
        report.addedFields[key] = {
          description: newProp.description || "",
          type: newProp,
        };
      } else if (oldProp && !newProp) {
        report.removedFields[key] = {
          description: oldProp.description || "",
          type: oldProp,
        };
      } else if (oldProp && newProp) {
        const diff = SchemaDiffer.diffProperties(key, oldProp, newProp);
        if (diff) {
          report.modifiedFields[key] = diff;
        }
      }
    }

    return report;
  }

  private static diffProperties(
    key: string,
    oldProp: SchemaDefinition,
    newProp: SchemaDefinition
  ): {
    oldType: any;
    newType: any;
    description: string;
    changes: string[];
  } | null {
    const changes: string[] = [];

    // 1. Type Change Detection
    const oldType = oldProp.type;
    const newType = newProp.type;

    if (oldType !== newType) {
      changes.push(`Type changed from '${oldType}' to '${newType}'`);
    }

    // 2. Description Change Detection
    const oldDesc = oldProp.description || "";
    const newDesc = newProp.description || "";
    if (oldDesc !== newDesc) {
      changes.push(`Description changed: '${oldDesc}' -> '${newDesc}'`);
    }

    // 3. Recursive Property Diffing (Handling nested objects)
    const oldProps = oldProp.properties || {};
    const newProps = newProp.properties || {};

    const allKeys = new Set<string>([
      ...Object.keys(oldProps),
      ...Object.keys(newProps),
    ]);

    for (const propKey of allKeys) {
      const oldNestedProp = oldProps[propKey];
      const newNestedProp = newProps[propKey];

      if (!oldNestedProp && newNestedProp) {
        changes.push(`Added nested property: ${propKey}`);
      } else if (oldNestedProp && !newNestedProp) {
        changes.push(`Removed nested property: ${propKey}`);
      } else if (oldNestedProp && newNestedProp) {
        const nestedDiff = SchemaDiffer.diffProperties(
          propKey,
          oldNestedProp,
          newNestedProp
        );
        if (nestedDiff) {
          changes.push(`Nested changes in '${propKey}': ${JSON.stringify(nestedDiff)}`);
        }
      }
    }

    if (changes.length > 0) {
      return {
        oldType: oldType,
        newType: newType,
        description: oldProp.description || newProp.description || "",
        changes: changes,
      };
    }

    return null;
  }
}

export { SchemaDiffer };
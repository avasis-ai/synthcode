import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDiff {
  field: string;
  diff: {
    added: { [key: string]: any };
    removed: { [key: string]: any };
    modified: {
      type: string;
      description: string;
      details: {
        old: any;
        new: any;
      };
    };
  };
}

export interface SchemaDiffReport {
  diffs: SchemaDiff[];
  summary: {
    addedFields: number;
    removedFields: number;
    modifiedFields: number;
  };
}

interface JsonSchema {
  type?: string;
  properties?: {
    [key: string]: JsonSchema;
  };
  required?: string[];
  items?: JsonSchema;
  description?: string;
  [key: string]: any;
}

export class SchemaDiffer {
  private schemaA: JsonSchema;
  private schemaB: JsonSchema;

  constructor(schemaA: JsonSchema, schemaB: JsonSchema) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
  }

  public diffSchemas(): SchemaDiffReport {
    const diffs: SchemaDiff[] = [];
    const { diffs: fieldDiffs, summary: summaryA } = this.compareObjectSchemas(
      this.schemaA.properties || {} as Record<string, JsonSchema>,
      this.schemaB.properties || {} as Record<string, JsonSchema>
    );
    diffs.push(...fieldDiffs);

    return {
      diffs,
      summary: {
        addedFields: summaryA.addedFields,
        removedFields: summaryA.removedFields,
        modifiedFields: summaryA.modifiedFields,
      },
    };
  }

  private compareObjectSchemas(
    schemaA: Record<string, JsonSchema>,
    schemaB: Record<string, JsonSchema>
  ): {
    diffs: SchemaDiff[];
    summary: {
      addedFields: number;
      removedFields: number;
      modifiedFields: number;
    };
  } {
    const diffs: SchemaDiff[] = [];
    const summary: {
      addedFields: number;
      removedFields: number;
      modifiedFields: number;
    } = {
      addedFields: 0,
      removedFields: 0,
      modifiedFields: 0,
    };

    const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);

    for (const key of allKeys) {
      const propA = schemaA[key];
      const propB = schemaB[key];

      if (!propA && propB) {
        const diff = this.createFieldDiff(key, null, propB, 'Added');
        diffs.push(diff);
        summary.addedFields++;
      } else if (propA && !propB) {
        const diff = this.createFieldDiff(key, propA, null, 'Removed');
        diffs.push(diff);
        summary.removedFields++;
      } else if (propA && propB) {
        const { diffs: subDiffs, summary: subSummary } = this.compareObjectSchemas(
          schemaA[key].properties || {} as Record<string, JsonSchema>,
          schemaB[key].properties || {} as Record<string, JsonSchema>
        );
        const fieldDiff = this.createFieldDiff(key, propA, propB, 'Modified');
        fieldDiff.diff.modified.details.details = {
          old: propA,
          new: propB,
        };
        fieldDiff.diff.modified.details.description =
          this.getStructuralChangeDescription(propA, propB);
        diffs.push(fieldDiff);
        summary.modifiedFields++;
      }
    }

    return { diffs, summary };
  }

  private createFieldDiff(
    field: string,
    oldSchema: JsonSchema | null,
    newSchema: JsonSchema | null,
    changeType: 'Added' | 'Removed' | 'Modified'
  ): SchemaDiff {
    const diff: {
      added: { [key: string]: any };
      removed: { [key: string]: any };
      modified: {
        type: string;
        description: string;
        details: {
          old: any;
          new: any;
        };
      };
    } = {
      added: {},
      removed: {},
      modified: {
        type: 'N/A',
        description: 'No structural change detected.',
        details: {
          old: null,
          new: null,
        },
      },
    };

    if (changeType === 'Added') {
      diff.added = { [field]: newSchema };
    } else if (changeType === 'Removed') {
      diff.removed = { [field]: oldSchema };
    } else if (changeType === 'Modified') {
      diff.modified = {
        type: 'Schema Modification',
        description: 'Schema structure or constraints have changed.',
        details: {
          old: oldSchema,
          new: newSchema,
        },
      };
    }

    return {
      field,
      diff,
    };
  }

  private getStructuralChangeDescription(
    oldSchema: JsonSchema,
    newSchema: JsonSchema
  ): string {
    const typeChanged = oldSchema.type !== newSchema.type;
    const requiredChanged =
      JSON.stringify(oldSchema.required || []) !== JSON.stringify(newSchema.required || []);

    if (typeChanged) {
      return `Type changed from ${oldSchema.type} to ${newSchema.type}.`;
    }

    if (requiredChanged) {
      return 'Required fields list has changed.';
    }

    if (oldSchema.properties && newSchema.properties) {
      const oldProps = Object.keys(oldSchema.properties);
      const newProps = Object.keys(newSchema.properties);
      const addedProps = newProps.filter(
        (key) => !oldProps.includes(key)
      );
      const removedProps = oldProps.filter((key) => !newProps.includes(key));

      if (addedProps.length > 0 || removedProps.length > 0) {
        return `Field set changed. Added: ${addedProps.join(', ')}. Removed: ${removedProps.join(', ')}.`;
      }
    }

    return 'Schema structure appears consistent.';
  }
}
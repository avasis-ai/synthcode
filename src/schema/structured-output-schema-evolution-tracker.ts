import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Schema = Record<string, any>;

interface SchemaChange {
  context: string;
  timestamp: number;
  addedFields: string[];
  removedFields: string[];
  changedTypes: {
    field: string;
    oldType: any;
    newType: any;
  }[];
}

interface EvolutionReport {
  summary: string;
  changes: SchemaChange[];
  compatibilityRisks: string[];
  suggestedMigrations: string[];
}

export class SchemaEvolutionTracker {
  private history: Map<string, SchemaChange> = new Map();
  private lastSchema: Schema | null = null;

  constructor(initialSchema: Schema, initialContext: string) {
    this.lastSchema = initialSchema;
    this.history.set(initialContext, {
      context: initialContext,
      timestamp: Date.now(),
      addedFields: [],
      removedFields: [],
      changedTypes: [],
    });
  }

  private compareSchemas(oldSchema: Schema, newSchema: Schema): {
    addedFields: string[];
    removedFields: string[];
    changedTypes: {
      field: string;
      oldType: any;
      newType: any;
    }[];
  } {
    const addedFields: string[] = [];
    const removedFields: string[] = [];
    const changedTypes: {
      field: string;
      oldType: any;
      newType: any;
    }[] = [];

    const oldKeys = Object.keys(oldSchema);
    const newKeys = Object.keys(newSchema);

    // Check for added and changed fields
    for (const key of newKeys) {
      if (!oldSchema.hasOwnProperty(key)) {
        addedFields.push(key);
      } else {
        const oldValue = oldSchema[key];
        const newValue = newSchema[key];
        if (typeof oldValue !== typeof newValue) {
          changedTypes.push({
            field: key,
            oldType: typeof oldValue,
            newType: typeof newValue,
          });
        }
      }
    }

    // Check for removed fields
    for (const key of oldKeys) {
      if (!newSchema.hasOwnProperty(key)) {
        removedFields.push(key);
      }
    }

    return {
      addedFields,
      removedFields,
      changedTypes,
    };
  }

  recordSchema(newSchema: Schema, context: string): void {
    if (!this.lastSchema) {
      throw new Error("Tracker must be initialized with an initial schema.");
    }

    const changes = this.compareSchemas(this.lastSchema, newSchema);

    const newChange: SchemaChange = {
      context: context,
      timestamp: Date.now(),
      addedFields: changes.addedFields,
      removedFields: changes.removedFields,
      changedTypes: changes.changedTypes,
    };

    this.history.set(context, newChange);
    this.lastSchema = newSchema;
  }

  generateEvolutionReport(): EvolutionReport {
    const changes: SchemaChange[] = Array.from(this.history.values());
    const risks: string[] = [];
    const migrations: string[] = [];

    if (changes.length === 0) {
      return {
        summary: "No schema changes recorded.",
        changes: [],
        compatibilityRisks: [],
        suggestedMigrations: [],
      };
    }

    let riskCount = 0;
    let migrationCount = 0;

    for (let i = 1; i < changes.length; i++) {
      const current = changes[i];
      const previous = changes[i - 1];

      if (current.addedFields.length > 0) {
        risks.push(
          `Added fields in context '${current.context}': ${current.addedFields.join(', ')}. Consumers must handle these new fields.`
        );
        riskCount++;
      }
      if (current.removedFields.length > 0) {
        risks.push(
          `Removed fields in context '${current.context}': ${current.removedFields.join(', ')}. Consumers relying on these fields will fail.`
        );
        riskCount++;
      }
      if (current.changedTypes.length > 0) {
        risks.push(
          `Type changes in context '${current.context}': ${current.changedTypes.map(c => `${c.field}: ${c.oldType} -> ${c.newType}`).join('; ')}. Consumers must update type handling.`
        );
        migrationCount++;
      }
    }

    const summary = `Schema evolution tracked across ${changes.length} versions. Detected ${riskCount} potential compatibility risks and ${migrationCount} type changes.`;

    return {
      summary: summary,
      changes: changes,
      compatibilityRisks: risks,
      suggestedMigrations: [
        "Review all removed fields and deprecate usage in consuming services.",
        "Implement runtime type checking or default values for newly added fields.",
        "For type changes, consider versioning the output schema explicitly."
      ],
    };
  }
}
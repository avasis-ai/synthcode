export type SchemaDefinition = Record<string, { type: string; description?: string; required?: boolean }>;

export interface SchemaDiff {
  added: string[];
  removed: string[];
  modified: {
    field: string;
    oldType: string;
    newType: string;
  }[];
  // Could potentially add: typeChanges: { field: string, oldType: string, newType: string }[]
}

export class StructuredOutputSchemaDiffer {
  calculateDiff(schemaA: SchemaDefinition, schemaB: SchemaDefinition): SchemaDiff {
    const allKeys = new Set<string>([
      ...Object.keys(schemaA),
      ...Object.keys(schemaB)
    ]);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: {
      field: string;
      oldType: string;
      newType: string;
    }[] = [];

    for (const key of allKeys) {
      const inA = schemaA.hasOwnProperty(key);
      const inB = schemaB.hasOwnProperty(key);

      if (!inA && inB) {
        added.push(key);
        continue;
      }

      if (inA && !inB) {
        removed.push(key);
        continue;
      }

      if (inA && inB) {
        const schemaAValue = schemaA[key];
        const schemaBValue = schemaB[key];

        if (schemaAValue.type !== schemaBValue.type) {
          modified.push({
            field: key,
            oldType: schemaAValue.type,
            newType: schemaBValue.type,
          });
        }
        // Future enhancement: Compare constraints, descriptions, etc.
      }
    }

    return {
      added,
      removed,
      modified,
    };
  }
}
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

export type SchemaDiffReport = {
  summary: {
    compatible: boolean;
    totalChanges: number;
    fieldChanges: {
      added: string[];
      removed: string[];
      typeChanges: {
        field: string;
        from: string;
        to: string;
      }[];
    };
    structuralIssues: string[];
  };
  details: {
    [key: string]: any;
  };
};

export type SchemaDefinition = Record<string, any>;

export class SchemaDiffer {
  private schemaA: SchemaDefinition;
  private schemaB: SchemaDefinition;

  constructor(schemaA: SchemaDefinition, schemaB: SchemaDefinition) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
  }

  public diffSchemas(): SchemaDiffReport {
    const report: SchemaDiffReport = {
      summary: {
        compatible: true,
        totalChanges: 0,
        fieldChanges: {
          added: [],
          removed: [],
          typeChanges: [],
        },
        structuralIssues: [],
      },
      details: {},
    };

    const { fieldChanges, structuralIssues } = this.compareFields(
      this.schemaA,
      this.schemaB,
      "",
      report.summary
    );

    report.summary.fieldChanges = fieldChanges;
    report.summary.structuralIssues = structuralIssues;

    const totalChanges = fieldChanges.added.length + fieldChanges.removed.length + fieldChanges.typeChanges.length;
    report.summary.totalChanges = totalChanges;

    if (totalChanges > 0) {
      report.summary.compatible = false;
    }

    return report;
  }

  private compareFields(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    path: string,
    summary: SchemaDiffReport['summary']
  ): {
    fieldChanges: {
      added: string[];
      removed: string[];
      typeChanges: {
        field: string;
        from: string;
        to: string;
      }[];
    };
    structuralIssues: string[];
  } {
    const fieldChanges: {
      added: string[];
      removed: string[];
      typeChanges: {
        field: string;
        from: string;
        to: string;
      }[];
    } = {
      added: [],
      removed: [],
      typeChanges: [],
    };
    const structuralIssues: string[] = [];

    const keysA = Object.keys(schemaA);
    const keysB = Object.keys(schemaB);

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const valA = schemaA[key];
      const valB = schemaB[key];

      const existsA = schemaA.hasOwnProperty(key);
      const existsB = schemaB.hasOwnProperty(key);

      if (existsA && !existsB) {
        fieldChanges.removed.push(key);
        structuralIssues.push(`Field '${currentPath}' was removed.`);
      } else if (!existsA && existsB) {
        fieldChanges.added.push(key);
        structuralIssues.push(`Field '${currentPath}' was added.`);
      } else if (existsA && existsB) {
        if (typeof valA === 'object' && valA !== null && !Array.isArray(valA) && typeof valB === 'object' && valB !== null && !Array.isArray(valB)) {
          const nestedDiff = this.compareFields(
            valA,
            valB,
            currentPath,
            summary
          );
          fieldChanges.typeChanges.push(...nestedDiff.fieldChanges.typeChanges);
          structuralIssues.push(...nestedDiff.structuralIssues);
        } else if (typeof valA !== typeof valB) {
          fieldChanges.typeChanges.push({
            field: key,
            from: typeof valA,
            to: typeof valB,
          });
          structuralIssues.push(`Type mismatch for field '${currentPath}': changed from ${typeof valA} to ${typeof valB}.`);
        } else if (typeof valA === 'string' && valA !== valB) {
          // Simple value change detection for non-object fields
          fieldChanges.typeChanges.push({
            field: key,
            from: String(valA),
            to: String(valB),
          });
        }
      }
    }

    return {
      fieldChanges,
      structuralIssues,
    };
  }
}
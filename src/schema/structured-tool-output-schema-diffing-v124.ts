import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type SchemaDiffReport = {
  addedFields: { [key: string]: any };
  removedFields: { [key: string]: any };
  modifiedFields: {
    [key: string]: {
      old: any;
      new: any;
      diff: string;
    };
  };
  typeConflicts: {
    [key: string]: {
      oldType: any;
      newType: any;
      description: string;
    };
  };
  diffSummary: {
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    conflictCount: number;
  };
};

export type Schema = Record<string, any>;

interface DiffContext {
  report: SchemaDiffReport;
}

const createInitialReport = (): SchemaDiffReport => ({
  addedFields: {},
  removedFields: {},
  modifiedFields: {},
  typeConflicts: {},
  diffSummary: {
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    conflictCount: 0,
  },
});

const updateReportSummary = (report: SchemaDiffReport, key: keyof SchemaDiffReport['diffSummary'] | 'addedFields' | 'removedFields' | 'modifiedFields' | 'typeConflicts') => {
  if (key === 'addedFields') {
    report.diffSummary.addedCount = Object.keys(report.addedFields).length;
  } else if (key === 'removedFields') {
    report.diffSummary.removedCount = Object.keys(report.removedFields).length;
  } else if (key === 'modifiedFields') {
    report.diffSummary.modifiedCount = Object.keys(report.modifiedFields).length;
  } else if (key === 'typeConflicts') {
    report.diffSummary.conflictCount = Object.keys(report.typeConflicts).length;
  }
};

const compareSchemas = (
  schemaV1: Schema,
  schemaV2: Schema,
  context: DiffContext
): SchemaDiffReport => {
  const report = context.report;
  const allKeys = new Set<string>([
    ...Object.keys(schemaV1),
    ...Object.keys(schemaV2),
  ]);

  for (const key of allKeys) {
    const v1Exists = schemaV1.hasOwnProperty(key);
    const v2Exists = schemaV2.hasOwnProperty(key);

    if (!v1Exists && v2Exists) {
      report.addedFields[key] = schemaV2[key];
      report.diffSummary.addedCount++;
    } else if (v1Exists && !v2Exists) {
      report.removedFields[key] = schemaV1[key];
      report.diffSummary.removedCount++;
    } else if (v1Exists && v2Exists) {
      const v1 = schemaV1[key];
      const v2 = schemaV2[key];

      // Simple type check for demonstration (assuming basic JSON Schema structure)
      const v1Type = typeof v1;
      const v2Type = typeof v2;

      if (v1Type !== v2Type) {
        report.typeConflicts[key] = {
          oldType: v1,
          newType: v2,
          description: `Type mismatch detected for field '${key}'.`,
        };
        report.diffSummary.conflictCount++;
      } else if (typeof v1 === 'object' && v1 !== null && typeof v2 === 'object' && v2 !== null) {
        // Recursive comparison for complex objects (assuming nested schemas)
        const nestedContext: DiffContext = { report: report };
        compareSchemas(v1 as Schema, v2 as Schema, nestedContext);
      } else if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        // Simple value change detection
        report.modifiedFields[key] = {
          old: v1,
          new: v2,
          diff: `Value changed from ${JSON.stringify(v1)} to ${JSON.stringify(v2)}`,
        };
        report.diffSummary.modifiedCount++;
      }
    }
  }

  return report;
};

export const diffStructuredToolOutputSchema = (
  schemaV1: Schema,
  schemaV2: Schema
): SchemaDiffReport => {
  const context: DiffContext = { report: createInitialReport() };
  return compareSchemas(schemaV1, schemaV2, context).diffSummary;
};
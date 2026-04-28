import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Schema = Record<string, any>;

interface DiffReport {
  added: Record<string, any>;
  removed: Record<string, any>;
  modified: Record<string, {
    old: any;
    new: any;
    diff: string;
  }>;
}

type SchemaDiffingService = {
  calculateDiff: (schemaA: Schema, schemaB: Schema) => DiffReport;
  generateReport: (diff: DiffReport) => string;
};

export const StructuredToolOutputSchemaDiffingService: SchemaDiffingService = {
  calculateDiff: (schemaA: Schema, schemaB: Schema): DiffReport => {
    const diff: DiffReport = {
      added: {},
      removed: {},
      modified: {},
    };

    const allKeys = new Set<string>([
      ...Object.keys(schemaA),
      ...Object.keys(schemaB),
    ]);

    for (const key of allKeys) {
      const hasA = Object.prototype.hasOwnProperty.call(schemaA, key);
      const hasB = Object.prototype.hasOwnProperty.call(schemaB, key);

      if (hasA && !hasB) {
        diff.removed[key] = schemaA[key];
      } else if (!hasA && hasB) {
        diff.added[key] = schemaB[key];
      } else if (hasA && hasB) {
        const diffKey = key as keyof Schema;
        const result = compareFields(schemaA[key], schemaB[key], key);
        if (result) {
          diff.modified[key] = result;
        }
      }
    }
    return diff;
  },

  generateReport: (diff: DiffReport): string => {
    let report = "--- Schema Diff Report ---\n\n";

    const formatSection = (title: string, content: Record<string, any>): string => {
      if (Object.keys(content).length === 0) {
        return "";
      }
      let section = `[${title} (${Object.keys(content).length} items)]\n`;
      for (const [key, value] of Object.entries(content)) {
        section += `  - ${key}: ${JSON.stringify(value).substring(0, 100)}...\n`;
      }
      return section + "\n";
    };

    report += "--- ADDED FIELDS ---\n" + formatSection("Added", diff.added);

    report += "--- REMOVED FIELDS ---\n" + formatSection("Removed", diff.removed);

    report += "--- MODIFIED FIELDS ---\n";
    for (const [key, mod] of Object.entries(diff.modified)) {
      report += `  * ${key}:\n`;
      report += `    Change Detected: ${mod.diff}\n`;
      report += `    Old Value: ${JSON.stringify(mod.old).substring(0, 100)}...\n`;
      report += `    New Value: ${JSON.stringify(mod.new).substring(0, 100)}...\n`;
    }

    return report.trim();
  },
};

const compareFields = (
  fieldA: any,
  fieldB: any,
  fieldName: string
): {
  old: any;
  new: any;
  diff: string;
} | null => {
  if (typeof fieldA !== typeof fieldB) {
    return {
      old: fieldA,
      new: fieldB,
      diff: `Type changed from ${typeof fieldA} to ${typeof fieldB}.`,
    };
  }

  if (typeof fieldA === 'object' && fieldA !== null && fieldB !== null) {
    if (Array.isArray(fieldA) && Array.isArray(fieldB)) {
      if (fieldA.length !== fieldB.length) {
        return {
          old: fieldA,
          new: fieldB,
          diff: `Array length changed from ${fieldA.length} to ${fieldB.length}.`,
        };
      }
      // Simple array comparison for demonstration; deep diffing arrays is complex.
      if (fieldA.some((item: any, index: number) => JSON.stringify(item) !== JSON.stringify(fieldB[index]))) {
        return {
          old: fieldA,
          new: fieldB,
          diff: "Array content changed (elements differ).",
        };
      }
      return null;
    }

    if (typeof fieldA === 'object' && fieldA !== null && typeof fieldB === 'object' && fieldB !== null) {
      const schemaA = fieldA as Schema;
      const schemaB = fieldB as Schema;

      const diff = StructuredToolOutputSchemaDiffingService.calculateDiff(schemaA, schemaB);

      if (Object.keys(diff.added).length > 0 || Object.keys(diff.removed).length > 0 || Object.keys(diff.modified).length > 0) {
        return {
          old: fieldA,
          new: fieldB,
          diff: `Schema structure changed. Added: ${Object.keys(diff.added).length}, Removed: ${Object.keys(diff.removed).length}, Modified: ${Object.keys(diff.modified).length}.`,
        };
      }
      return null;
    }
  }

  if (JSON.stringify(fieldA) !== JSON.stringify(fieldB)) {
    return {
      old: fieldA,
      new: fieldB,
      diff: "Value changed.",
    };
  }

  return null;
};
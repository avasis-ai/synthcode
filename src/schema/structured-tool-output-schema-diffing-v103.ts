import {
  SchemaDiffReport,
  SchemaDiffResult,
} from "./schema-diff-types";

type Schema = Record<string, unknown>;

interface FieldDiff {
  diffType: "added" | "removed" | "changed";
  details: Record<string, unknown>;
}

type SchemaDiffFunction = (
  schemaV1: Schema;
  schemaV2: Schema;
) => SchemaDiffReport;

export const calculateSchemaDiff = (
  schemaV1: Schema;
  schemaV2: Schema;
): SchemaDiffReport => {
  const keysV1 = Object.keys(schemaV1);
  const keysV2 = Object.keys(schemaV2);

  const allKeys = new Set([...keysV1, ...keysV2]);

  const fieldDiffs: Record<string, FieldDiff> = {};

  for (const key of allKeys) {
    const inV1 = (key in schemaV1);
    const inV2 = (key in schemaV2);

    if (inV1 && !inV2) {
      fieldDiffs[key] = {
        diffType: "removed",
        details: {
          originalSchema: schemaV1[key],
        },
      };
    } else if (!inV1 && inV2) {
      fieldDiffs[key] = {
        diffType: "added",
        details: {
          newSchema: schemaV2[key],
        },
      };
    } else if (inV1 && inV2) {
      const diff = compareFields(key, schemaV1[key], schemaV2[key]);
      if (diff) {
        fieldDiffs[key] = diff;
      }
    }
  }

  return {
    diffReport: fieldDiffs,
    summary: summarizeDiff(fieldDiffs),
  };
};

const compareFields = (
  key: string;
  schemaV1: unknown;
  schemaV2: unknown;
): FieldDiff | null => {
  if (typeof schemaV1 !== 'object' || schemaV1 === null || typeof schemaV2 !== 'object' || schemaV2 === null) {
    return null;
  }

  const v1 = schemaV1 as Schema;
  const v2 = schemaV2 as Schema;

  const keysV1 = Object.keys(v1);
  const keysV2 = Object.keys(v2);

  const allKeys = new Set([...keysV1, ...keysV2]);

  const fieldDiffs: Record<string, FieldDiff> = {};
  let hasChange = false;

  for (const subKey of allKeys) {
    const inV1 = (subKey in v1);
    const inV2 = (subKey in v2);

    if (inV1 && !inV2) {
      fieldDiffs[subKey] = {
        diffType: "removed",
        details: {
          originalSchema: v1[subKey],
        },
      };
      hasChange = true;
    } else if (!inV1 && inV2) {
      fieldDiffs[subKey] = {
        diffType: "added",
        details: {
          newSchema: v2[subKey],
        },
      };
      hasChange = true;
    } else if (inV1 && inV2) {
      const subDiff = compareFields(subKey, v1[subKey], v2[subKey]);
      if (subDiff) {
        fieldDiffs[subKey] = subDiff;
        hasChange = true;
      }
    }
  }

  if (!hasChange) {
    return null;
  }

  return {
    diffType: "changed",
    details: {
      fieldDiffs: fieldDiffs,
    },
  };
};

const summarizeDiff = (
  fieldDiffs: Record<string, FieldDiff>
): SchemaDiffResult => {
  let addedCount = 0;
  let removedCount = 0;
  let changedCount = 0;

  for (const key in fieldDiffs) {
    const diff = fieldDiffs[key];
    if (diff.diffType === "added") {
      addedCount++;
    } else if (diff.diffType === "removed") {
      removedCount++;
    } else if (diff.diffType === "changed") {
      changedCount++;
    }
  }

  return {
    added: addedCount,
    removed: removedCount,
    changed: changedCount,
    totalChanges: addedCount + removedCount + changedCount,
  };
};

export {
  calculateSchemaDiff,
};
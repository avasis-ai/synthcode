import {
  SchemaDiffReport,
  SchemaDiffResult,
  SchemaDiffSeverity,
} from "./schema-diff-types";

type JsonSchema = Record<string, unknown>;

interface SchemaDiffingService {
  diffSchemas(oldSchema: JsonSchema, newSchema: JsonSchema): SchemaDiffReport;
}

export class StructuredToolOutputSchemaDiffingV118 implements SchemaDiffingService {
  diffSchemas(oldSchema: JsonSchema, newSchema: JsonSchema): SchemaDiffReport {
    const report: SchemaDiffReport = {
      diffs: [],
      summary: {
        totalChanges: 0,
        typeChanges: 0,
        requiredChanges: 0,
        structuralChanges: 0,
      },
    };

    const compare = (
      path: string,
      oldSchema: JsonSchema,
      newSchema: JsonSchema,
    ): void => {
      const diffs: SchemaDiffResult[] = [];
      let totalChanges = 0;
      let typeChanges = 0;
      let requiredChanges = 0;
      let structuralChanges = 0;

      // 1. Compare properties (object structure)
      const oldProperties = oldSchema?.properties as Record<string, JsonSchema> | undefined;
      const newProperties = newSchema?.properties as Record<string, JsonSchema> | undefined;

      if (oldProperties && newProperties) {
        const allKeys = new Set([...Object.keys(oldProperties), ...Object.keys(newProperties)]);

        for (const key of allKeys) {
          const oldProp = oldProperties[key];
          const newProp = newProperties[key];
          const currentPath = `${path}.properties.${key}`;

          if (oldProp && newProp) {
            // Key exists in both: Recurse
            compare(currentPath, oldProp, newProp);
          } else if (oldProp && !newProp) {
            // Key removed
            diffs.push({
              path: currentPath,
              severity: SchemaDiffSeverity.REMOVED,
              message: `Property '${key}' was removed.`,
              oldValue: oldProp,
              newValue: undefined,
            });
            totalChanges++;
            structuralChanges++;
          } else if (!oldProp && newProp) {
            // Key added
            diffs.push({
              path: currentPath,
              severity: SchemaDiffSeverity.ADDED,
              message: `Property '${key}' was added.`,
              oldValue: undefined,
              newValue: newProp,
            });
            totalChanges++;
            structuralChanges++;
          }
        }
      }

      // 2. Compare required fields
      const oldRequired = oldSchema?.required as string[] | undefined;
      const newRequired = newSchema?.required as string[] | undefined;

      if (oldRequired && newRequired) {
        const oldSet = new Set(oldRequired);
        const newSet = new Set(newRequired);

        // Check for removed required fields
        for (const key of oldRequired) {
          if (!newSet.has(key)) {
            diffs.push({
              path: `${path}.required.${key}`,
              severity: SchemaDiffSeverity.REQUIRED_CHANGE,
              message: `Field '${key}' was no longer required.`,
              oldValue: true,
              newValue: false,
            });
            totalChanges++;
            requiredChanges++;
          }
        }

        // Check for added required fields
        for (const key of newRequired) {
          if (!oldSet.has(key)) {
            diffs.push({
              path: `${path}.required.${key}`,
              severity: SchemaDiffSeverity.REQUIRED_CHANGE,
              message: `Field '${key}' is now required.`,
              oldValue: false,
              newValue: true,
            });
            totalChanges++;
            requiredChanges++;
          }
        }
      }

      // 3. Compare Type (Simplified check for demonstration)
      const oldType = oldSchema?.type as string | undefined;
      const newType = newSchema?.type as string | undefined;

      if (oldType && newType && oldType !== newType) {
        diffs.push({
          path: `${path}.type`,
          severity: SchemaDiffSeverity.TYPE_CHANGE,
          message: `Type changed from '${oldType}' to '${newType}'.`,
          oldValue: oldType,
          newValue: newType,
        });
        totalChanges++;
        typeChanges++;
      }

      // 4. Aggregate results
      if (diffs.length > 0) {
        report.diffs.push(...diffs);
        report.summary.totalChanges += diffs.length;
        report.summary.typeChanges += typeChanges;
        report.summary.requiredChanges += requiredChanges;
        report.summary.structuralChanges += (
          (oldProperties && newProperties) ? Object.keys(oldProperties).length + Object.keys(newProperties).length : 0
        );
      }
    };

    // Start comparison from the root
    compare("root", oldSchema, newSchema);

    return report;
  }
}
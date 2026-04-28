import {
  SchemaDiffReport,
  SchemaDiffResult,
  SchemaDiffSeverity,
} from "./schema-diff-types";

export class StructuredToolOutputSchemaDiffer {
  compareSchemas(
    schemaV1: Record<string, any>,
    schemaV2: Record<string, any>
  ): SchemaDiffReport {
    const report: SchemaDiffReport = {
      diffs: [],
      summary: {
        added: 0,
        removed: 0,
        typeChanges: 0,
        requiredChanges: 0,
        structuralChanges: 0,
      },
    };

    const diffs = this.compareObject(
      schemaV1,
      schemaV2,
      "root",
      report.diffs
    );

    report.diffs.push(...diffs);

    return report;
  }

  private compareObject(
    schemaV1: Record<string, any>,
    schemaV2: Record<string, any>,
    path: string,
    diffs: SchemaDiffResult[]
  ): SchemaDiffResult[] {
    const keysV1 = Object.keys(schemaV1);
    const keysV2 = Object.keys(schemaV2);

    const allKeys = new Set([...keysV1, ...keysV2]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const valV1 = schemaV1[key];
      const valV2 = schemaV2[key];

      if (schemaV1.hasOwnProperty(key) && !schemaV2.hasOwnProperty(key)) {
        diffs.push(this.createDiff(
          key,
          currentPath,
          "removed",
          valV1,
          null
        ));
        continue;
      }

      if (!schemaV1.hasOwnProperty(key) && schemaV2.hasOwnProperty(key)) {
        diffs.push(this.createDiff(
          key,
          currentPath,
          "added",
          null,
          valV2
        ));
        continue;
      }

      if (typeof valV1 === 'object' && valV1 !== null && typeof valV2 === 'object' && valV2 !== null) {
        if (Array.isArray(valV1) || Array.isArray(valV2)) {
          continue; // Skip array comparison for simplicity in this context
        }

        const nestedDiffs = this.compareObject(
          valV1,
          valV2,
          currentPath,
          diffs
        );
        diffs.push(...nestedDiffs);
      } else if (valV1 !== valV2) {
        this.checkPrimitiveDiff(
          key,
          currentPath,
          valV1,
          valV2,
          diffs
        );
      }
    }
    return diffs;
  }

  private checkPrimitiveDiff(
    key: string,
    path: string,
    valV1: any,
    valV2: any,
    diffs: SchemaDiffResult[]
  ): void {
    const diff: SchemaDiffResult = {
      key,
      path,
      severity: SchemaDiffSeverity.INFO,
      changes: [],
    };

    // Type Check
    const typeV1 = typeof valV1;
    const typeV2 = typeof valV2;
    if (typeV1 !== typeV2) {
      diff.changes.push({
        type: "type",
        description: `Type changed from ${typeV1} to ${typeV2}.`,
        severity: SchemaDiffSeverity.WARNING,
      });
    }

    // Required Status Check (Assuming 'required' property exists and is boolean)
    const isRequiredV1 = (valV1 as any)?.required === true;
    const isRequiredV2 = (valV2 as any)?.required === true;
    if (isRequiredV1 !== isRequiredV2) {
      diff.changes.push({
        type: "required",
        description: `Required status changed from ${isRequiredV1 ? "true" : "false"} to ${isRequiredV2 ? "true" : "false"}.`,
        severity: SchemaDiffSeverity.WARNING,
      });
    }

    // Simple value change check (e.g., default value change)
    if (valV1 !== valV2) {
      diff.changes.push({
        type: "value",
        description: `Value changed. V1: ${JSON.stringify(valV1)}, V2: ${JSON.stringify(valV2)}.`,
        severity: SchemaDiffSeverity.INFO,
      });
    }

    if (diff.changes.length > 0) {
      diffs.push(diff);
    }
  }

  private createDiff(
    key: string,
    path: string,
    changeType: "added" | "removed",
    valV1: any | null,
    valV2: any | null
  ): SchemaDiffResult {
    const diff: SchemaDiffResult = {
      key,
      path,
      severity: SchemaDiffSeverity.MAJOR,
      changes: [],
    };

    if (changeType === "added") {
      diff.changes.push({
        type: "added",
        description: `Field '${key}' was added in the new schema.`,
        severity: SchemaDiffSeverity.MAJOR,
      });
    } else if (changeType === "removed") {
      diff.changes.push({
        type: "removed",
        description: `Field '${key}' was removed from the schema.`,
        severity: SchemaDiffSeverity.MAJOR,
      });
    }

    return diff;
  }
}
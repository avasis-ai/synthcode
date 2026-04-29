import {
  SchemaDiffReport,
  SchemaDiffResult,
} from "./schema-diff-types";

export class StructuredToolOutputSchemaDiffer {
  static diffSchemas(
    oldSchema: Record<string, any>,
    newSchema: Record<string, any>
  ): SchemaDiffReport {
    const report: SchemaDiffReport = {
      differences: [],
    };

    const compare = (
      path: string,
      oldNode: any,
      newNode: any
    ): void => {
      if (typeof oldNode !== "object" || oldNode === null || typeof newNode !== "object" || newNode === null) {
        return;
      }

      const oldProperties = Object.keys(oldNode);
      const newProperties = Object.keys(newNode);

      // 1. Check for removed properties
      for (const prop of oldProperties) {
        if (!newProperties.includes(prop)) {
          report.differences.push({
            path: `${path}.${prop}`,
            change: "property_removed",
            old: oldNode[prop],
            new: undefined,
          });
        } else {
          const oldPropSchema = oldNode[prop];
          const newPropSchema = newNode[prop];

          // 2. Check for modified properties (recursively)
          if (typeof oldPropSchema === "object" && oldPropSchema !== null && typeof newPropSchema === "object" && newPropSchema !== null) {
            compare(`${path}.${prop}`, oldPropSchema, newPropSchema);
          } else {
            // Simple type/constraint change detection for leaf properties
            const diff = this.compareProperty(
              `${path}.${prop}`,
              oldPropSchema,
              newPropSchema
            );
            if (diff) {
              report.differences.push(diff);
            }
          }
        }
      }

      // 3. Check for added properties
      for (const prop of newProperties) {
        if (!oldProperties.includes(prop)) {
          report.differences.push({
            path: `${path}.${prop}`,
            change: "property_added",
            old: undefined,
            new: newNode[prop],
          });
        }
      }
    };

    compare("root", oldSchema, newSchema);
    return report;
  }

  private static compareProperty(
    path: string,
    oldSchema: any,
    newSchema: any
  ): SchemaDiffResult | null {
    const diff: SchemaDiffResult = {
      path: path,
      change: null,
      old: undefined,
      new: undefined,
    };

    if (oldSchema === newSchema) {
      return null;
    }

    // Type change detection (simplified check)
    const oldType = oldSchema?.type || "unknown";
    const newType = newSchema?.type || "unknown";

    if (oldType !== newType) {
      diff.change = "type_changed";
      diff.old = oldType;
      diff.new = newType;
      return diff;
    }

    // Required field change detection
    const oldRequired = oldSchema?.required ? oldSchema.required.includes("some_field") : false;
    const newRequired = newSchema?.required ? newSchema.required.includes("some_field") : false;

    if (oldRequired !== newRequired) {
      diff.change = "required_status_changed";
      diff.old = oldRequired ? "required" : "optional";
      diff.new = newRequired ? "required" : "optional";
      return diff;
    }

    // Constraint change detection (e.g., minLength, pattern)
    const oldMinLength = oldSchema?.minLength;
    const newMinLength = newSchema?.minLength;

    if (oldMinLength !== newMinLength) {
      diff.change = "constraint_changed";
      diff.old = `minLength:${oldMinLength}`;
      diff.new = `minLength:${newMinLength}`;
      return diff;
    }

    return null;
  }
}
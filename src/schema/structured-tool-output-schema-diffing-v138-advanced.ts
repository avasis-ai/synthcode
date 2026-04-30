import {
  SchemaDiffReport,
  SchemaDiffOptions,
  SchemaDiffContext,
} from "./types";

type Schema = Record<string, SchemaDefinition>;

interface SchemaDefinition {
  type: "object" | "string" | "array" | "boolean" | "number" | "integer" | "object";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
  description?: string;
}

class SchemaDiffContext {
  private readonly schemaA: Schema;
  private readonly schemaB: Schema;
  private readonly options: SchemaDiffOptions;

  constructor(schemaA: Schema, schemaB: Schema, options: SchemaDiffOptions) {
    this.schemaA = schemaA;
    this.schemaB = schemaB;
    this.options = options;
  }

  public getSchemaA(): Schema {
    return this.schemaA;
  }

  public getSchemaB(): Schema {
    return this.schemaB;
  }

  public getOptions(): SchemaDiffOptions {
    return this.options;
  }
}

function compareTypes(typeA: SchemaDefinition["type"], typeB: SchemaDefinition["type"]): {
  isCompatible: boolean;
  reason: string;
} {
  if (typeA === typeB) {
    return { isCompatible: true, reason: "Types match." };
  }
  if (typeA === "object" && typeB === "object") {
    return { isCompatible: true, reason: "Both are objects (requires deeper check)." };
  }
  if (typeA === "string" && typeB === "string") {
    return { isCompatible: true, reason: "Both are strings." };
  }
  return { isCompatible: false, reason: `Type mismatch: ${typeA} vs ${typeB}.` };
}

function diffObject(
  context: SchemaDiffContext,
  propA: string,
  propB: string,
  schemaA: SchemaDefinition,
  schemaB: SchemaDefinition,
  report: SchemaDiffReport
): void {
  const keysA = Object.keys(schemaA.properties || {}) as string[];
  const keysB = Object.keys(schemaB.properties || {}) as string[];

  const allKeys = new Set([...keysA, ...keysB]);

  for (const key of allKeys) {
    const hasA = allKeys.has(key);
    const hasB = allKeys.has(key);

    if (hasA && !hasB) {
      report.removedFields.push({
        field: key,
        reason: `Field '${key}' present in Schema A but missing in Schema B.`,
        detailsA: schemaA.properties![key],
      });
      continue;
    }

    if (!hasA && hasB) {
      report.addedFields.push({
        field: key,
        reason: `Field '${key}' present in Schema B but missing in Schema A.`,
        detailsB: schemaB.properties![key],
      });
      continue;
    }

    if (hasA && hasB) {
      const propSchemaA = schemaA.properties![key];
      const propSchemaB = schemaB.properties![key];

      const typeComparison = compareTypes(
        propSchemaA.type,
        propSchemaB.type
      );

      if (!typeComparison.isCompatible) {
        report.changedFields.push({
          field: key,
          reason: `Type incompatibility detected: ${typeComparison.reason}`,
          detailsA: propSchemaA,
          detailsB: propSchemaB,
        });
        continue;
      }

      if (propSchemaA.type === "object" && propSchemaB.type === "object") {
        diffObject(
          context,
          propA,
          propB,
          propSchemaA,
          propSchemaB,
          report
        );
      }
    }
  }
}

function diffSchema(
  context: SchemaDiffContext,
  schemaA: Schema,
  schemaB: Schema,
  report: SchemaDiffReport
): SchemaDiffReport {
  report.addedFields = [];
  report.removedFields = [];
  report.changedFields = [];
  report.incompatibleFields = [];

  const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)]);

  for (const key of allKeys) {
    const schemaADef = schemaA[key];
    const schemaBDef = schemaB[key];

    if (!schemaADef && schemaBDef) {
      report.addedFields.push({
        field: key,
        reason: `Field '${key}' added in Schema B.`,
        detailsB: schemaBDef,
      });
      continue;
    }

    if (schemaADef && !schemaBDef) {
      report.removedFields.push({
        field: key,
        reason: `Field '${key}' removed from Schema B.`,
        detailsA: schemaADef,
      });
      continue;
    }

    if (schemaADef && schemaBDef) {
      const typeComparison = compareTypes(
        schemaADef.type,
        schemaBDef.type
      );

      if (!typeComparison.isCompatible) {
        report.incompatibleFields.push({
          field: key,
          reason: `Top-level type mismatch: ${typeComparison.reason}`,
          detailsA: schemaADef,
          detailsB: schemaBDef,
        });
        continue;
      }

      if (schemaADef.type === "object" && schemaBDef.type === "object") {
        diffObject(
          context,
          key,
          key,
          schemaADef as SchemaDefinition,
          schemaBDef as SchemaDefinition,
          report
        );
      }
    }
  }

  return report;
}

export const diffStructuredToolOutputSchema = (
  schemaA: Schema,
  schemaB: Schema,
  options: SchemaDiffOptions = {}
): SchemaDiffReport => {
  const context = new SchemaDiffContext(schemaA, schemaB, options);
  return diffSchema(context, schemaA, schemaB, {
    addedFields: [],
    removedFields: [],
    changedFields: [],
    incompatibleFields: [],
  });
};
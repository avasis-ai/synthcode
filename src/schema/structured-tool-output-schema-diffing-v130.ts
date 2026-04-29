import {
  SchemaDefinition,
  FieldSchema,
  SchemaDiffReport,
  SchemaComparisonOptions,
} from "./types";

export class StructuredToolOutputSchemaDiffer {
  static diffSchemas(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    options: SchemaComparisonOptions = {}
  ): SchemaDiffReport {
    const {
      report: report,
      options: effectiveOptions
    } = StructuredToolOutputSchemaDiffer.diffSchemasInternal(
      schemaA,
      schemaB,
      options
    );
    return report;
  }

  private static diffSchemasInternal(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    options: SchemaComparisonOptions
  ): {
    report: SchemaDiffReport;
    options: SchemaComparisonOptions;
  } {
    const report: SchemaDiffReport = {
      added: [],
      removed: [],
      modified: [],
      type_migration: [],
    };

    const diff = StructuredToolOutputSchemaDiffer.compareSchemasRecursive(
      schemaA,
      schemaB,
      [],
      report
    );

    return {
      report: report,
      options: options
    };
  }

  private static compareSchemasRecursive(
    schemaA: SchemaDefinition,
    schemaB: SchemaDefinition,
    path: string[],
    report: SchemaDiffReport
  ): void {
    const keysA = Object.keys(schemaA.properties || {}).filter(
      (key) => key !== "__typename"
    );
    const keysB = Object.keys(schemaB.properties || {}).filter(
      (key) => key !== "__typename"
    );

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = [...path, key];
      const schemaAField = schemaA.properties?.[key] as FieldSchema | undefined;
      const schemaBField = schemaB.properties?.[key] as FieldSchema | undefined;

      if (!schemaAField && !schemaBField) {
        continue;
      }

      if (!schemaAField) {
        report.added.push({
          path: currentPath.join("."),
          field: key,
          type: schemaBField.type,
          description: schemaBField.description,
        });
        continue;
      }

      if (!schemaBField) {
        report.removed.push({
          path: currentPath.join("."),
          field: key,
          type: schemaAField.type,
          description: schemaAField.description,
        });
        continue;
      }

      if (schemaAField.type !== schemaBField.type) {
        report.type_migration.push({
          path: currentPath.join("."),
          field: key,
          from_type: schemaAField.type,
          to_type: schemaBField.type,
          description: `${schemaAField.description} changed from ${schemaAField.type} to ${schemaBField.type}`,
        });
      }

      if (schemaAField.required !== schemaBField.required) {
        report.modified.push({
          path: currentPath.join("."),
          field: key,
          message: `Required status changed: ${schemaAField.required ? "true" : "false"} -> ${schemaBField.required ? "true" : "false"}`,
        });
      }

      if (schemaAField.properties && schemaBField.properties) {
        StructuredToolOutputSchemaDiffer.compareSchemasRecursive(
          schemaAField as SchemaDefinition,
          schemaBField as SchemaDefinition,
          currentPath,
          report
        );
      } else if (schemaAField.type === "object" && schemaBField.type === "object") {
        StructuredToolOutputSchemaDiffer.compareSchemasRecursive(
          schemaAField as SchemaDefinition,
          schemaBField as SchemaDefinition,
          currentPath,
          report
        );
      }
    }
  }
}
import {
  SchemaDefinition,
  FieldSchema,
  SchemaDiffReport,
  SchemaDiffingService,
} from "./schema-types";

export class StructuredToolOutputSchemaDiffingV129 {
  static generateDiffReport(
    schemaV1: SchemaDefinition,
    schemaV2: SchemaDefinition
  ): SchemaDiffReport {
    const report: SchemaDiffReport = {
      addedFields: [] as { field: string; schema: FieldSchema }[],
      removedFields: [] as { field: string; originalSchema: FieldSchema }[],
      typeChanges: [] as { field: string; from: string; to: string }[],
      structuralChanges: [] as { field: string; description: string }[],
    };

    const diffingService = new SchemaDiffingService();
    return diffingService.diff(schemaV1, schemaV2);
  }
}
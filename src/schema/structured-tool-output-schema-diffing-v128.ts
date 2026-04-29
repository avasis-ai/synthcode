import {
  SchemaDiffReport,
  SchemaDefinition,
  FieldDiff,
} from "./types";

type Schema = Record<string, SchemaDefinition>;

interface SchemaDiffingService {
  compareSchemas(
    schemaV1: Schema,
    schemaV2: Schema
  ): SchemaDiffReport;
}

export class StructuredToolOutputSchemaDiffingV128 implements SchemaDiffingService {
  compareSchemas(
    schemaV1: Schema,
    schemaV2: Schema
  ): SchemaDiffReport {
    const allKeys = new Set<string>([
      ...Object.keys(schemaV1),
      ...Object.keys(schemaV2)
    ]);

    const diff: Record<string, FieldDiff> = {};

    for (const key of allKeys) {
      const fieldV1 = schemaV1[key];
      const fieldV2 = schemaV2[key];

      if (!fieldV1 && fieldV2) {
        diff[key] = {
          status: "added",
          diff: {
            description: `Field '${key}' was added.`,
            details: fieldV2,
          }
        };
      } else if (fieldV1 && !fieldV2) {
        diff[key] = {
          status: "removed",
          diff: {
            description: `Field '${key}' was removed.`,
            details: fieldV1,
          }
        };
      } else if (fieldV1 && fieldV2) {
        diff[key] = this.compareFields(key, fieldV1, fieldV2);
      }
    }

    return {
      added: Object.values(diff).filter(d => d.status === "added"),
      removed: Object.values(diff).filter(d => d.status === "removed"),
      modified: Object.values(diff).filter(d => d.status === "modified"),
      unchanged: Object.values(diff).filter(d => d.status === "unchanged"),
    };
  }

  private compareFields(
    key: string,
    fieldV1: SchemaDefinition,
    fieldV2: SchemaDefinition
  ): FieldDiff {
    const typeChanged = fieldV1.type !== fieldV2.type;
    const requiredChanged = fieldV1.required !== fieldV2.required;
    const descriptionChanged = fieldV1.description !== fieldV2.description;

    let isModified = typeChanged || requiredChanged || descriptionChanged;
    let diffDetails: Record<string, any> = {
      typeChanged,
      requiredChanged,
      descriptionChanged,
    };

    if (fieldV1.properties && fieldV2.properties) {
      const propDiff = this.compareProperties(
        fieldV1.properties,
        fieldV2.properties
      );
      diffDetails.propertiesDiff = propDiff;
    } else if (fieldV1.properties || fieldV2.properties) {
      diffDetails.propertiesDiff = {
        status: "structure_changed",
        details: "One or both schemas contain properties but not both.",
      };
      isModified = true;
    }

    if (isModified) {
      return {
        status: "modified",
        diff: {
          description: `Field '${key}' was modified.`,
          details: diffDetails,
        }
      };
    } else {
      return {
        status: "unchanged",
        diff: {
          description: `Field '${key}' is unchanged.`,
          details: {},
        }
      };
    }
  }

  private compareProperties(
    propsV1: Record<string, SchemaDefinition>,
    propsV2: Record<string, SchemaDefinition>
  ): {
    status: "structure_changed";
    details: Record<string, any>;
  } {
    const allKeys = new Set<string>([
      ...Object.keys(propsV1),
      ...Object.keys(propsV2)
    ]);

    const propDiffs: Record<string, FieldDiff> = {};

    for (const key of allKeys) {
      const fieldV1 = propsV1[key];
      const fieldV2 = propsV2[key];

      if (!fieldV1 && fieldV2) {
        propDiffs[key] = {
          status: "added",
          diff: {
            description: `Property '${key}' was added.`,
            details: fieldV2,
          }
        };
      } else if (fieldV1 && !fieldV2) {
        propDiffs[key] = {
          status: "removed",
          diff: {
            description: `Property '${key}' was removed.`,
            details: fieldV1,
          }
        };
      } else if (fieldV1 && fieldV2) {
        propDiffs[key] = this.compareFields(
          key,
          fieldV1,
          fieldV2
        );
      }
    }

    const addedProps = Object.values(propDiffs).filter(d => d.status === "added");
    const removedProps = Object.values(propDiffs).filter(d => d.status === "removed");
    const modifiedProps = Object.values(propDiffs).filter(d => d.status === "modified");
    const unchangedProps = Object.values(propDiffs).filter(d => d.status === "unchanged");

    return {
      status: "structure_changed",
      details: {
        added: addedProps,
        removed: removedProps,
        modified: modifiedProps,
        unchanged: unchangedProps,
      }
    };
  }
}
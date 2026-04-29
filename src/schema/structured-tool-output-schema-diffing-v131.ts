import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type SchemaField = {
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
  properties?: Record<string, SchemaField>;
};

export type Schema = {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
};

export type DiffReport = {
  added: {
    field: string;
    diff: {
      type: string;
      description: string;
    };
  }[];
  removed: {
    field: string;
    diff: {
      type: string;
      description: string;
    };
  }[];
  modified: {
    field: string;
    diff: {
      type: "type" | "constraints" | "description";
      value: string;
    };
  }[];
  conflicts: {
    field: string;
    diff: {
      type: "conflict";
      message: string;
    };
    suggestions: {
      action: "use_v1" | "use_v2" | "merge";
      reason: string;
    }[];
  }[];
};

type SchemaDiffingService = {
  compareSchemas(schemaV1: Schema, schemaV2: Schema): DiffReport;
};

export class StructuredToolOutputSchemaDiffingService implements SchemaDiffingService {
  compareSchemas(schemaV1: Schema, schemaV2: Schema): DiffReport {
    const report: DiffReport = {
      added: [],
      removed: [],
      modified: [],
      conflicts: [],
    };

    const fieldsV1 = schemaV1.properties || {} as Record<string, SchemaField>;
    const fieldsV2 = schemaV2.properties || {} as Record<string, SchemaField>;
    const allFields = new Set([...Object.keys(fieldsV1), ...Object.keys(fieldsV2)]);

    for (const fieldName of allFields) {
      const fieldV1 = fieldsV1[fieldName];
      const fieldV2 = fieldsV2[fieldName];

      if (!fieldV1 && fieldV2) {
        report.added.push({
          field: fieldName,
          diff: {
            type: "added",
            description: `Field '${fieldName}' exists only in Schema V2.`,
          },
        });
      } else if (fieldV1 && !fieldV2) {
        report.removed.push({
          field: fieldName,
          diff: {
            type: "removed",
            description: `Field '${fieldName}' was present in Schema V1 but is missing in Schema V2.`,
          },
        });
      } else if (fieldV1 && fieldV2) {
        const comparison = this.compareFields(fieldName, fieldV1, fieldV2);
        if (comparison) {
          if (comparison.type === "conflict") {
            report.conflicts.push({
              field: fieldName,
              diff: {
                type: "conflict",
                message: `Field '${fieldName}' has significant structural differences between versions.`,
              },
              suggestions: comparison.suggestions,
            });
          } else if (comparison.type === "modified") {
            report.modified.push({
              field: fieldName,
              diff: {
                type: "type",
                value: `Type changed from ${fieldV1.type} to ${fieldV2.type}.`,
              },
            });
            if (fieldV1.required !== fieldV2.required) {
              report.modified.push({
                field: fieldName,
                diff: {
                  type: "constraints",
                  value: `Required status changed from ${fieldV1.required ? "true" : "false"} to ${fieldV2.required ? "true" : "false"}.`,
                },
              });
            }
          }
        }
      }
    }

    return report;
  }

  private compareFields(
    fieldName: string,
    fieldV1: SchemaField,
    fieldV2: SchemaField
  ): {
    type: "conflict" | "modified" | "unchanged";
    suggestions?: {
      action: "use_v1" | "use_v2" | "merge";
      reason: string;
    }[];
    diff?: {
      type: "type" | "constraints" | "description";
      value: string;
    };
  } | null {
    const typeChanged = fieldV1.type !== fieldV2.type;
    const requiredChanged = fieldV1.required !== fieldV2.required;
    const descriptionChanged = fieldV1.description !== fieldV2.description;

    if (typeChanged || requiredChanged || descriptionChanged) {
      if (typeChanged && fieldV1.properties && fieldV2.properties) {
        return this.handleComplexTypeComparison(fieldName, fieldV1, fieldV2);
      }
      if (typeChanged || requiredChanged || descriptionChanged) {
        return {
          type: "modified",
          diff: {
            type: "type",
            value: `Type changed from ${fieldV1.type} to ${fieldV2.type}.`,
          },
        };
      }
    }

    return null;
  }

  private handleComplexTypeComparison(
    fieldName: string,
    fieldV1: SchemaField,
    fieldV2: SchemaField
  ): {
    type: "conflict" | "modified";
    suggestions: {
      action: "use_v1" | "use_v2" | "merge";
      reason: string;
    }[];
  } {
    const propertiesV1 = fieldV1.properties || {} as Record<string, SchemaField>;
    const propertiesV2 = fieldV2.properties || {} as Record<string, SchemaField>;
    const allProps = new Set([...Object.keys(propertiesV1), ...Object.keys(propertiesV2)]);

    const suggestions: {
      action: "use_v1" | "use_v2" | "merge";
      reason: string;
    }[] = [];

    let hasConflict = false;

    for (const propName of allProps) {
      const propV1 = propertiesV1[propName];
      const propV2 = propertiesV2[propName];

      if (!propV1 && propV2) {
        suggestions.push({
          action: "use_v2",
          reason: `Property '${propName}' added in V2. Consider adopting it.`
        });
      } else if (propV1 && !propV2) {
        suggestions.push({
          action: "use_v1",
          reason: `Property '${propName}' removed in V2. Consider keeping it if necessary.`
        });
      } else if (propV1 && propV2) {
        const propComparison = this.compareFields(
          `${fieldName}.${propName}`,
          propV1,
          propV2
        );

        if (propComparison) {
          if (propComparison.type === "conflict") {
            hasConflict = true;
            suggestions.push({
              action: "merge",
              reason: `Deep conflict detected in property '${propName}'. Manual review required.`
            });
          } else if (propComparison.type === "modified") {
            suggestions.push({
              action: "merge",
              reason: `Property '${propName}' modified. Review changes for best fit.`
            });
          }
        }
      }
    }

    if (hasConflict) {
      return {
        type: "conflict",
        suggestions: suggestions,
      };
    }

    return {
      type: "modified",
      suggestions: suggestions,
    };
  }
}
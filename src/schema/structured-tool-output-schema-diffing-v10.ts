import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaDiff {
  added: Record<string, SchemaDiff>;
  removed: Record<string, SchemaDiff>;
  modified: Record<string, SchemaDiff>;
}

export interface FieldDiff {
  type: "type_change" | "required_change" | "structure_change";
  details: any;
}

export interface SchemaFieldDiff {
  diffs: Record<string, FieldDiff>;
  is_modified: boolean;
}

export interface SchemaDiffResult {
  diff: SchemaDiff;
}

type Schema = Record<string, {
  type: string;
  required?: boolean;
  description?: string;
  properties?: Record<string, Schema>;
}>;

export function calculateSchemaDiff(
  schemaA: Schema,
  schemaB: Schema
): SchemaDiffResult {
  const diff: SchemaDiff = {
    added: {},
    removed: {},
    modified: {},
  };

  const allKeys = new Set<string>([
    ...Object.keys(schemaA),
    ...Object.keys(schemaB),
  ]);

  for (const key of allKeys) {
    const schemaAValue = schemaA[key];
    const schemaBValue = schemaB[key];

    const inA = schemaA.hasOwnProperty(key);
    const inB = schemaB.hasOwnProperty(key);

    if (inA && !inB) {
      diff.removed[key] = {
        diffs: {
          type: "removed",
          details: {
            original_schema: schemaAValue,
          },
        },
      };
    } else if (!inA && inB) {
      diff.added[key] = {
        diffs: {
          type: "added",
          details: {
            new_schema: schemaBValue,
          },
        },
      };
    } else {
      if (typeof schemaAValue !== "undefined" && typeof schemaBValue !== "undefined") {
        const fieldDiff = compareFields(
          key,
          schemaAValue,
          schemaBValue
        );
        if (Object.keys(fieldDiff.diffs).length > 0) {
          if (fieldDiff.diffs.type === "removed") {
            diff.removed[key] = {
              diffs: {
                type: "removed",
                details: {
                  original_schema: schemaAValue,
                },
              },
            };
          } else if (fieldDiff.diffs.type === "added") {
            diff.added[key] = {
              diffs: {
                type: "added",
                details: {
                  new_schema: schemaBValue,
                },
              },
            };
          } else {
            diff.modified[key] = {
              diffs: {
                type: "modified",
                details: {
                  field_diff: fieldDiff,
                },
              },
            };
          }
        }
      }
    }
  }

  return { diff: diff };
}

function compareFields(
  key: string,
  schemaA: {
    type: string;
    required?: boolean;
    description?: string;
    properties?: Record<string, Schema>;
  },
  schemaB: {
    type: string;
    required?: boolean;
    description?: string;
    properties?: Record<string, Schema>;
  }
): {
  diffs: {
    type: "modified" | "added" | "removed";
    details: any;
  };
} {
  const fieldDiffs: Record<string, FieldDiff> = {};
  const allKeys = new Set<string>([
    ...Object.keys(schemaA.properties || {}),
    ...Object.keys(schemaB.properties || {}),
  ]);

  for (const propKey of allKeys) {
    const propA = schemaA.properties?.[propKey];
    const propB = schemaB.properties?.[propKey];

    const inA = schemaA.properties?.hasOwnProperty(propKey);
    const inB = schemaB.properties?.hasOwnProperty(propKey);

    if (inA && !inB) {
      fieldDiffs[propKey] = {
        type: "removed",
        details: {
          original_schema: propA,
        },
      };
    } else if (!inA && inB) {
      fieldDiffs[propKey] = {
        type: "added",
        details: {
          new_schema: propB,
        },
      };
    } else {
      if (propA && propB) {
        const nestedDiff = compareFields(
          propKey,
          propA,
          propB
        );

        if (Object.keys(nestedDiff.diffs).length > 0) {
          fieldDiffs[propKey] = {
            type: "structure_change",
            details: {
              nested_diff: nestedDiff,
            },
          };
        } else {
          fieldDiffs[propKey] = {
            type: "no_change",
            details: {},
          };
        }
      }
    }
  }

  let diffType: "modified" | "added" | "removed" = "modified";
  let details: any = {};

  if (Object.keys(fieldDiffs).length === 0) {
    return {
      diffs: {
        type: "no_change",
        details: {},
      },
    };
  }

  const hasChanges = Object.values(fieldDiffs).some(
    (diff) =>
      diff.type === "removed" ||
      diff.type === "added" ||
      diff.type === "structure_change"
  );

  if (!hasChanges) {
    return {
      diffs: {
        type: "no_change",
        details: {},
      },
    };
  }

  const finalDiffs: Record<string, FieldDiff> = {};
  for (const key of Object.keys(fieldDiffs)) {
    const field = fieldDiffs[key];
    if (field.type === "removed") {
      finalDiffs[key] = {
        type: "removed",
        details: {
          original_schema: field.details.original_schema,
        },
      };
    } else if (field.type === "added") {
      finalDiffs[key] = {
        type: "added",
        details: {
          new_schema: field.details.new_schema,
        },
      };
    } else {
      // Check for required status change
      const requiredA = schemaA.properties?.[key]?.required;
      const requiredB = schemaB.properties?.[key]?.required;
      if (requiredA !== requiredB) {
        fieldDiffs[key] = {
          type: "required_change",
          details: {
            from: requiredA,
            to: requiredB,
          },
        };
      }
      // Check for type change (simplified check)
      if (schemaA.properties?.[key]?.type !== schemaB.properties?.[key]?.type) {
        fieldDiffs[key] = {
          type: "type_change",
          details: {
            from: schemaA.properties?.[key]?.type,
            to: schemaB.properties?.[key]?.type,
          },
        };
      }
      // If structure changed, it's already captured above, otherwise, it's modified
      if (!fieldDiffs[key] || fieldDiffs[key].type === "no_change") {
        fieldDiffs[key] = {
          type: "modified",
          details: {
            description: "General modification detected",
          },
        };
      }
    }
  }

  return {
    diffs: {
      type: "modified",
      details: {
        field_diff: finalDiffs,
      },
    },
  };
}
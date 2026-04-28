import { z, ZodSchema } from "zod";

export type SchemaDiff = {
  path: string;
  diff: {
    added: { [key: string]: any };
    removed: { [key: string]: any };
    modified: {
      field: string;
      oldType: any;
      newType: any;
      details?: any;
    } | null;
  };
};

type SchemaDiffReport = SchemaDiff[];

export class StructuredToolOutputSchemaDiffer {
  private readonly zSchema: ZodSchema<any>;
  private readonly otherZSchema: ZodSchema<any>;

  constructor(zSchema: ZodSchema<any>, otherZSchema: ZodSchema<any>) {
    this.zSchema = zSchema;
    this.otherZSchema = otherZSchema;
  }

  public diffSchemas(): SchemaDiffReport {
    const diff: SchemaDiffReport = [];
    this.recursiveDiff(this.zSchema, this.otherZSchema, "", diff);
    return diff;
  }

  private recursiveDiff(
    schemaA: ZodSchema<any>,
    schemaB: ZodSchema<any>,
    currentPath: string,
    diff: SchemaDiffReport
  ): void {
    const keysA = Object.keys(schemaA.shape);
    const keysB = Object.keys(schemaB.shape);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const path = currentPath ? `${currentPath}.${key}` : key;
      const schemaAKey = key as keyof typeof schemaA.shape;
      const schemaBKey = key as keyof typeof schemaB.shape;

      const schemaAExists = (schemaA.shape as any)[schemaAKey];
      const schemaBExists = (schemaB.shape as any)[schemaBKey];

      if (!schemaAExists && schemaBExists) {
        diff.push({
          path: path,
          diff: {
            added: { [key]: schemaBExists.description || "Schema added" },
            removed: {},
            modified: null,
          },
        });
        continue;
      }

      if (schemaAExists && !schemaBExists) {
        diff.push({
          path: path,
          diff: {
            added: {},
            removed: { [key]: schemaAExists.description || "Schema removed" },
            modified: null,
          },
        });
        continue;
      }

      if (!schemaAExists && !schemaBExists) {
        continue;
      }

      if (schemaAExists && schemaBExists) {
        const diffEntry = this.compareFields(
          schemaAExists,
          schemaBExists,
          path
        );
        if (diffEntry) {
          diff.push({
            path: path,
            diff: diffEntry,
          });
        }
      }
    }
  }

  private compareFields(
    schemaA: ZodSchema<any>,
    schemaB: ZodSchema<any>,
    path: string
  ): SchemaDiff = {
    path: path,
    diff: {
      added: {},
      removed: {},
      modified: null,
    },
  };

  private compareFields(
    schemaA: ZodSchema<any>,
    schemaB: ZodSchema<any>,
    path: string
  ): SchemaDiff {
    const diff: SchemaDiff = {
      path: path,
      diff: {
        added: {},
        removed: {},
        modified: null,
      },
    };

    const shapeA = schemaA.shape;
    const shapeB = schemaB.shape;

    const keysA = Object.keys(shapeA);
    const keysB = Object.keys(shapeB);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const schemaAKey = key as keyof typeof shapeA;
      const schemaBKey = key as keyof typeof shapeB;

      const schemaAExists = (shapeA as any)[schemaAKey];
      const schemaBExists = (shapeB as any)[schemaBKey];

      if (!schemaAExists && schemaBExists) {
        diff.diff.added[key] = schemaBExists.description || "Schema added";
        continue;
      }

      if (schemaAExists && !schemaBExists) {
        diff.diff.removed[key] = schemaAExists.description || "Schema removed";
        continue;
      }

      if (schemaAExists && schemaBExists) {
        const fieldDiff = this.compareFieldSchemas(
          schemaAExists,
          schemaBExists,
          currentPath
        );

        if (fieldDiff) {
          if (fieldDiff.diff.added[key] || fieldDiff.diff.removed[key] || fieldDiff.diff.modified) {
            // Merge field-level diff into the current path's diff
            if (fieldDiff.diff.added[key]) {
              diff.diff.added[key] = fieldDiff.diff.added[key];
            }
            if (fieldDiff.diff.removed[key]) {
              diff.diff.removed[key] = fieldDiff.diff.removed[key];
            }
            if (fieldDiff.diff.modified) {
              // For simplicity, we only report the most significant modification at the field level
              if (!diff.diff.modified) {
                diff.diff.modified = fieldDiff.diff.modified;
              }
            }
          }
        }
      }
    }

    return diff;
  }

  private compareFieldSchemas(
    schemaA: ZodSchema<any>,
    schemaB: ZodSchema<any>,
    path: string
  ): SchemaDiff | null {
    const diff: SchemaDiff = {
      path: path,
      diff: {
        added: {},
        removed: {},
        modified: null,
      },
    };

    const shapeA = schemaA.shape;
    const shapeB = schemaB.shape;

    const keysA = Object.keys(shapeA);
    const keysB = Object.keys(shapeB);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const schemaAKey = key as keyof typeof shapeA;
      const schemaBKey = key as keyof typeof shapeB;

      const schemaAExists = (shapeA as any)[schemaAKey];
      const schemaBExists = (shapeB as any)[schemaBKey];

      if (!schemaAExists && schemaBExists) {
        diff.diff.added[key] = schemaBExists.description || "Schema added";
        continue;
      }

      if (schemaAExists && !schemaBExists) {
        diff.diff.removed[key] = schemaAExists.description || "Schema removed";
        continue;
      }

      if (schemaAExists && schemaBExists) {
        if (schemaAExists.zodType !== schemaBExists.zodType) {
          diff.diff.modified = {
            field: key,
            oldType: schemaAExists.description || "Unknown",
            newType: schemaBExists.description || "Unknown",
            details: {
              typeChange: true,
            }
          };
        } else if (schemaAExists.isOptional() !== schemaBExists.isOptional()) {
          diff.diff.modified = {
            field: key,
            oldType: "Optional",
            newType: "Required",
            details: {
              optionalityChange: true,
            }
          };
        } else if (schemaAExists.zodType.constructor.name !== schemaBExists.zodType.constructor.name) {
          diff.diff.modified = {
            field: key,
            oldType: schemaAExists.zodType.constructor.name,
            newType: schemaBExists.zodType.constructor.name,
            details: {
              typeChange: true,
            }
          };
        } else if (schemaAExists.isObject() && schemaBExists.isObject()) {
          const nestedDiff = this.compareFieldSchemas(
            schemaAExists as ZodSchema<any>,
            schemaBExists as ZodSchema<any>,
            currentPath
          );
          if (nestedDiff) {
            // Merge nested diff into the current field's modification report
            if (!diff.diff.modified) {
              diff.diff.modified = {
                field: key,
                oldType: "Object",
                newType: "Object",
                details: {
                  nestedDiff: nestedDiff.diff.modified ? nestedDiff.diff.modified : {
                    nested: nestedDiff.diff,
                  },
                },
              };
            }
            // For simplicity, we only keep the deepest/most recent nested diff structure
          }
        }
      }
    }

    if (Object.keys(diff.diff.added).length > 0 ||
      Object.keys(diff.diff.removed).length > 0 ||
      diff.diff.modified) {
      return diff;
    }
    return null;
  }
}
import { z } from "zod";

export type SchemaDiff = {
  path: string;
  changes: {
    type: "fieldAdded" | "fieldRemoved" | "typeChanged" | "requiredChanged" | "structureChanged";
    details: any;
  }[];
};

export interface SchemaDiffService {
  diffSchemas(schemaV1: z.ZodTypeAny, schemaV2: z.ZodTypeAny): SchemaDiff;
}

class StructuredToolOutputSchemaDiffingV107 implements SchemaDiffService {
  diffSchemas(schemaV1: z.ZodTypeAny, schemaV2: z.ZodTypeAny): SchemaDiff {
    const diff: SchemaDiff = [];
    const v1Fields = schemaV1._def.shape;
    const v2Fields = schemaV2._def.shape;

    const allKeys = new Set([...Object.keys(v1Fields), ...Object.keys(v2Fields)]);

    for (const key of allKeys) {
      const v1Schema = v1Fields[key as keyof typeof v1Fields];
      const v2Schema = v2Fields[key as keyof typeof v2Fields];
      const currentPath = key;

      if (!v1Schema && v2Schema) {
        diff.push({
          path: currentPath,
          changes: [{
            type: "fieldAdded",
            details: { from: undefined, to: v2Schema.description || "N/A" },
          }],
        });
        continue;
      }

      if (v1Schema && !v2Schema) {
        diff.push({
          path: currentPath,
          changes: [{
            type: "fieldRemoved",
            details: { from: v1Schema.description || "N/A", to: undefined },
          }],
        });
        continue;
      }

      if (v1Schema && v2Schema) {
        const typeChanged = this.compareTypes(v1Schema, v2Schema, currentPath);
        if (typeChanged) {
          diff.push({
            path: currentPath,
            changes: [{
              type: "typeChanged",
              details: { from: v1Schema.constructor.name, to: v2Schema.constructor.name },
            }],
          });
        }

        const requiredChanged = this.compareRequired(v1Schema, v2Schema, currentPath);
        if (requiredChanged) {
          diff.push({
            path: currentPath,
            changes: [{
              type: "requiredChanged",
              details: { from: v1Schema.required ? "true" : "false", to: v2Schema.required ? "true" : "false" },
            }],
          });
        }

        if (v1Schema.constructor.name === "ZodObject" && v2Schema.constructor.name === "ZodObject") {
          const objectDiff = this.diffObjectSchemas(v1Schema as z.ZodObject<any>, v2Schema as z.ZodObject<any>, currentPath);
          if (objectDiff.length > 0) {
            diff.push({
              path: currentPath,
              changes: objectDiff,
            });
          }
        }
      }
    }

    return diff;
  }

  private compareTypes(v1: z.ZodTypeAny, v2: z.ZodTypeAny, path: string): boolean {
    const v1Name = v1.constructor.name;
    const v2Name = v2.constructor.name;

    if (v1Name !== v2Name) {
      return true;
    }

    if (v1Name === "ZodString" && v2Name === "ZodString") {
      return false;
    }

    if (v1Name === "ZodNumber" && v2Name === "ZodNumber") {
      return false;
    }

    if (v1Name === "ZodBoolean" && v2Name === "ZodBoolean") {
      return false;
    }

    if (v1Name === "ZodObject" && v2Name === "ZodObject") {
      return false;
    }

    return true;
  }

  private compareRequired(v1: z.ZodTypeAny, v2: z.ZodTypeAny, path: string): boolean {
    const v1Required = (v1 as any).required;
    const v2Required = (v2 as any).required;

    return v1Required !== v2Required;
  }

  private diffObjectSchemas(v1: z.ZodObject<any>, v2: z.ZodObject<any>, parentPath: string): SchemaDiff {
    const objectDiff: SchemaDiff = [];
    const v1Fields = v1.shape;
    const v2Fields = v2.shape;

    const allKeys = new Set([...Object.keys(v1Fields), ...Object.keys(v2Fields)]);

    for (const key of allKeys) {
      const currentPath = `${parentPath}.${key}`.replace(/^\./, '');
      const v1Schema = v1Fields[key as keyof typeof v1Fields];
      const v2Schema = v2Fields[key as keyof typeof v2Fields];

      if (!v1Schema && v2Schema) {
        objectDiff.push({
          path: currentPath,
          changes: [{
            type: "fieldAdded",
            details: { from: undefined, to: v2Schema.description || "N/A" },
          }],
        });
        continue;
      }

      if (v1Schema && !v2Schema) {
        objectDiff.push({
          path: currentPath,
          changes: [{
            type: "fieldRemoved",
            details: { from: v1Schema.description || "N/A", to: undefined },
          }],
        });
        continue;
      }

      if (v1Schema && v2Schema) {
        const typeChanged = this.compareTypes(v1Schema, v2Schema, currentPath);
        if (typeChanged) {
          objectDiff.push({
            path: currentPath,
            changes: [{
              type: "typeChanged",
              details: { from: v1Schema.constructor.name, to: v2Schema.constructor.name },
            }],
          });
        }

        const requiredChanged = this.compareRequired(v1Schema, v2Schema, currentPath);
        if (requiredChanged) {
          objectDiff.push({
            path: currentPath,
            changes: [{
              type: "requiredChanged",
              details: { from: v1Schema.required ? "true" : "false", to: v2Schema.required ? "true" : "false" },
            }],
          });
        }

        if (v1Schema.constructor.name === "ZodObject" && v2Schema.constructor.name === "ZodObject") {
          const nestedDiff = this.diffObjectSchemas(v1Schema as z.ZodObject<any>, v2Schema as z.ZodObject<any>, currentPath);
          if (nestedDiff.length > 0) {
            objectDiff.push({
              path: currentPath,
              changes: nestedDiff,
            });
          }
        }
      }
    }

    return objectDiff;
  }
}

export const structuredToolOutputSchemaDiffingService: SchemaDiffService = new StructuredToolOutputSchemaDiffingV107();
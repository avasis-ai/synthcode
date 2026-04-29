import { z } from "zod";

export type SchemaDiff = {
  path: string;
  diffType: "MISSING" | "ADDED" | "TYPE_CHANGE" | "REQUIRED_CHANGE" | "DEFAULT_CHANGE" | "STRUCTURAL_CHANGE";
  message: string;
  details?: any;
};

export interface DiffReport {
  schemaA: z.ZodTypeAny;
  schemaB: z.ZodTypeAny;
  differences: SchemaDiff[];
}

export class SchemaDiffingAdvanced {
  private readonly report: SchemaDiff[] = [];

  constructor() {}

  public static diff(schemaA: z.ZodTypeAny, schemaB: z.ZodTypeAny): DiffReport {
    const instance = new SchemaDiffingAdvanced();
    instance.traverse(schemaA, schemaB, "$");
    return {
      schemaA,
      schemaB,
      differences: instance.report,
    };
  }

  private traverse(schemaA: z.ZodTypeAny, schemaB: z.ZodTypeAny, path: string): void {
    if (schemaA instanceof z.ZodObject && schemaB instanceof z.ZodObject) {
      const keysA = Object.keys(schemaA.shape);
      const keysB = Object.keys(schemaB.shape);

      const allKeys = new Set([...keysA, ...keysB]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const schemaAField = schemaA.shape[key];
        const schemaBField = schemaB.shape[key];

        if (!schemaAField && schemaBField) {
          this.report.push({
            path: currentPath,
            diffType: "ADDED",
            message: `Field '${key}' added in Schema B.`,
          });
        } else if (schemaAField && !schemaBField) {
          this.report.push({
            path: currentPath,
            diffType: "MISSING",
            message: `Field '${key}' removed from Schema B.`,
          });
        } else if (schemaAField && schemaBField) {
          this.compareFields(schemaAField, schemaBField, currentPath);
        }
      }
    } else if (schemaA instanceof z.ZodArray && schemaB instanceof z.ZodArray) {
      this.report.push({
        path: path,
        diffType: "STRUCTURAL_CHANGE",
        message: "Array structure changed (e.g., item type or constraints).",
        details: {
          schemaAItem: schemaA.element.safeParse("dummy").success ? "Defined" : "Unknown",
          schemaBItem: schemaB.element.safeParse("dummy").success ? "Defined" : "Unknown",
        },
      });
    } else if (schemaA instanceof z.ZodString && schemaB instanceof z.ZodString) {
      this.comparePrimitive(schemaA, schemaB, path, "string");
    } else if (schemaA instanceof z.ZodNumber && schemaB instanceof z.ZodNumber) {
      this.comparePrimitive(schemaA, schemaB, path, "number");
    } else if (schemaA instanceof z.ZอดBoolean && schemaB instanceof z.ZodBoolean) {
      this.comparePrimitive(schemaA, schemaB, path, "boolean");
    } else if (schemaA instanceof z.ZodObject && schemaB instanceof z.ZodObject) {
      this.traverse(schemaA, schemaB, path);
    } else {
      this.report.push({
        path: path,
        diffType: "TYPE_CHANGE",
        message: `Type mismatch detected. Schema A is ${schemaA.constructor.name} while Schema B is ${schemaB.constructor.name}.`,
        details: {
          schemaA: schemaA.constructor.name,
          schemaB: schemaB.constructor.name,
        },
      });
    }
  }

  private compareFields(schemaA: z.ZodTypeAny, schemaB: z.ZodTypeAny, path: string): void {
    if (schemaA.constructor.name !== schemaB.constructor.name) {
      this.report.push({
        path: path,
        diffType: "TYPE_CHANGE",
        message: `Field type changed from ${schemaA.constructor.name} to ${schemaB.constructor.name}.`,
      });
    }

    if (schemaA instanceof z.ZodObject && schemaB instanceof z.ZodObject) {
      this.traverse(schemaA, schemaB, path);
    } else if (schemaA instanceof z.ZodArray && schemaB instanceof z.ZodArray) {
      this.report.push({
        path: path,
        diffType: "STRUCTURAL_CHANGE",
        message: "Array element schema changed.",
        details: {
          elementA: schemaA.element.constructor.name,
          elementB: schemaB.element.constructor.name,
        },
      });
    } else if (schemaA instanceof z.ZodString && schemaB instanceof z.ZodString) {
      this.comparePrimitive(schemaA, schemaB, path, "string");
    } else if (schemaA instanceof z.ZodNumber && schemaB instanceof z.ZodNumber) {
      this.comparePrimitive(schemaA, schemaB, path, "number");
    } else if (schemaA instanceof z.ZodBoolean && schemaB instanceof z.ZodBoolean) {
      this.comparePrimitive(schemaA, schemaB, path, "boolean");
    } else {
      this.report.push({
        path: path,
        diffType: "TYPE_CHANGE",
        message: `Incompatible types: ${schemaA.constructor.name} vs ${schemaB.constructor.name}.`,
      });
    }
  }

  private comparePrimitive(schemaA: z.ZodTypeAny, schemaB: z.ZodTypeAny, path: string, type: string): void {
    const requiredA = schemaA.required();
    const requiredB = schemaB.required();

    if (requiredA !== requiredB) {
      this.report.push({
        path: path,
        diffType: "REQUIRED_CHANGE",
        message: `Required status changed. Schema A: ${requiredA}, Schema B: ${requiredB}.`,
      });
    }

    if (schemaA.default !== undefined && schemaB.default !== undefined) {
      if (schemaA.default !== schemaB.default) {
        this.report.push({
          path: path,
          diffType: "DEFAULT_CHANGE",
          message: `Default value changed. Schema A: ${JSON.stringify(schemaA.default)}, Schema B: ${JSON.stringify(schemaB.default)}.`,
        });
      }
    } else if (schemaA.default !== undefined && schemaB.default === undefined) {
      this.report.push({
        path: path,
        diffType: "DEFAULT_CHANGE",
        message: `Default value removed. Schema A had default: ${JSON.stringify(schemaA.default)}.`,
      });
    } else if (schemaA.default === undefined && schemaB.default !== undefined) {
      this.report.push({
        path: path,
        diffType: "DEFAULT_CHANGE",
        message: `Default value added. Schema B has default: ${JSON.stringify(schemaB.default)}.`,
      });
    }
  }
}
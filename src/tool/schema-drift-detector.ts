import { JSONSchemaType } from "ajv";

export interface SchemaDeviation {
  path: string;
  description: string;
  severity: "Warning" | "Error";
}

export interface DriftReport {
  confidenceScore: number;
  deviations: SchemaDeviation[];
}

export class SchemaDriftDetector {
  private schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  private validateType(value: unknown, expectedType: any): { valid: boolean; message: string } {
    if (value === null || value === undefined) {
      return { valid: true, message: "Skipped (null/undefined)" };
    }

    const actualType = typeof value;

    if (expectedType === "string") {
      return { valid: actualType === "string", message: actualType === "string" ? "" : `Expected string, got ${actualType}` };
    }
    if (expectedType === "number") {
      return { valid: actualType === "number" && !isNaN(value), message: actualType === "number" ? "" : `Expected number, got ${actualType}` };
    }
    if (expectedType === "boolean") {
      return { valid: actualType === "boolean", message: actualType === "boolean" ? "" : `Expected boolean, got ${actualType}` };
    }
    if (expectedType === "object") {
      if (actualType !== "object" || Array.isArray(value)) {
        return { valid: false, message: `Expected object, got ${actualType}` };
      }
      return { valid: true, message: "" };
    }
    // Simple handling for enum check (assuming schema defines enums)
    if (Array.isArray(expectedType) && expectedType.every(t => typeof t === 'string')) {
        const allowedValues = expectedType as string[];
        if (typeof value === 'string' && allowedValues.includes(value)) {
            return { valid: true, message: "" };
        }
        return { valid: false, message: `Expected one of [${allowedValues.join(', ')}], got ${typeof value}` };
    }

    return { valid: true, message: "" };
  }

  private checkObject(
    sample: Record<string, unknown>,
    schema: any,
    path: string,
    deviations: SchemaDeviation[]
  ): void {
    const requiredProps = schema.properties || {};

    // 1. Check for missing required properties
    const requiredPropsKeys = schema.required || [];
    for (const prop of requiredPropsKeys) {
      if (!(prop in sample) || sample[prop] === undefined || sample[prop] === null) {
        deviations.push({
          path: `${path}.${prop}`,
          description: `Missing required property '${prop}'.`,
          severity: "Error",
        });
      }
    }

    // 2. Check properties present in sample against schema
    for (const key in sample) {
      if (Object.prototype.hasOwnProperty.call(sample, key)) {
        const value = sample[key];
        const propSchema = requiredProps[key];
        const currentPath = `${path}.${key}`;

        if (!propSchema) {
          // Drift detected: Field exists in sample but not in schema properties
          deviations.push({
            path: currentPath,
            description: `Unexpected field found. Schema does not define '${key}'.`,
            severity: "Warning",
          });
          continue;
        }

        // Type checking
        const expectedType = propSchema.type;
        const typeCheck = this.validateType(value, expectedType);

        if (!typeCheck.valid) {
          deviations.push({
            path: currentPath,
            description: `Type mismatch: ${typeCheck.message}`,
            severity: "Error",
          });
        }

        // Recursive check for nested objects
        if (expectedType === "object" && typeof value === "object" && value !== null && !Array.isArray(value)) {
          this.checkObject(
            value as Record<string, unknown>,
            propSchema,
            currentPath,
            deviations
          );
        }
      }
    }
  }

  public detectDrift(schema: any, sample: Record<string, unknown>[]): DriftReport {
    if (!sample || sample.length === 0) {
      return { confidenceScore: 0.1, deviations: [{ path: "N/A", description: "No sample provided for comparison.", severity: "Error" }] };
    }

    const allDeviations: SchemaDeviation[] = [];
    let successfulChecks = 0;

    // Aggregate deviations across all samples
    for (const sampleItem of sample) {
      const sampleObject = sampleItem as Record<string, unknown>;
      this.checkObject(sampleObject, schema, "root", allDeviations);
      successfulChecks++;
    }

    const totalSamples = sample.length;
    const adherenceScore = totalSamples > 0 ? (successfulChecks / totalSamples) * 0.8 : 0;

    // Confidence is based on adherence and the number of checks performed
    const confidenceScore = Math.min(1.0, adherenceScore + (allDeviations.length === 0 ? 0.2 : 0));

    return {
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      deviations: allDeviations,
    };
  }
}
import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type ServiceResult = Record<string, unknown>;

export interface ContractField {
  required: boolean;
  type: "string" | "number" | "boolean" | "object";
  // Semantic constraints
  expectedValues?: string[] | (keyof ServiceResult)[] | ((value: unknown) => boolean);
  // If it's an object, define required nested fields
  properties?: Record<string, ContractField>;
}

export interface ServiceContract {
  [key: string]: ContractField;
}

export interface DriftReport {
  field: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  actualValue?: unknown;
}

export class ServiceContractDriftValidator {
  private readonly reports: DriftReport[] = [];

  private validateField(
    field: string,
    contract: ContractField,
    data: ServiceResult,
    path: string
  ): void {
    const value = data[field];

    // 1. Check for presence (Required)
    if (contract.required && value === undefined) {
      this.reports.push({
        field: field,
        severity: "CRITICAL",
        message: `Required field '${field}' is missing from the service response.`,
        actualValue: undefined,
      });
      return;
    }

    if (value === undefined) {
      return; // Not required and missing, which is acceptable
    }

    // 2. Check Type
    const actualType = typeof value;
    if (actualType !== "object" && contract.type !== "object") {
      if (contract.type === "string" && actualType !== "string") {
        this.reports.push({
          field: field,
          severity: "CRITICAL",
          message: `Type mismatch for '${field}'. Expected ${contract.type}, got ${actualType}.`,
          actualValue: value,
        });
        return;
      }
    }

    // 3. Check Semantic Constraints
    if (contract.expectedValues) {
      if (Array.isArray(contract.expectedValues)) {
        const expected = contract.expectedValues[0];
        if (typeof expected === "string") {
          const expectedStrings = contract.expectedValues as string[];
          if (!expectedStrings.includes(String(value))) {
            this.reports.push({
              field: field,
              severity: "WARNING",
              message: `Semantic drift detected. Value '${value}' is not in the expected set: ${expectedStrings.join(", ")}.`,
              actualValue: value,
            });
          }
        } else if (typeof expected === "function") {
          if (!(expected(value))) {
            this.reports.push({
              field: field,
              severity: "WARNING",
              message: `Semantic validation failed for '${field}'. Custom check failed.`,
              actualValue: value,
            });
          }
        }
      }
    }

    // 4. Handle Nested Objects
    if (contract.type === "object" && contract.properties) {
      if (typeof value === "object" && value !== null) {
        for (const propField in contract.properties) {
          const propContract = contract.properties[propField];
          this.validateField(
            propField,
            propContract,
            value as ServiceResult,
            `${field}.${propField}`
          );
        }
      } else if (contract.required) {
        this.reports.push({
          field: field,
          severity: "CRITICAL",
          message: `Expected object structure for '${field}', but received ${typeof value}.`,
          actualValue: value,
        });
      }
    }
  }

  /**
   * Validates a raw service result against a predefined contract.
   * @param result The actual payload received from the service.
   * @param contract The expected structure and constraints.
   * @returns A detailed DriftReport array.
   */
  validate(result: ServiceResult, contract: ServiceContract): DriftReport[] {
    this.reports = [];
    this.validateField("root", contract as ContractField, result, "root");
    return this.reports;
  }
}
import { Message } from "./types";

interface FieldSchema {
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description: string;
}

export interface Schema {
    [key: string]: FieldSchema;
}

export interface DriftReport {
    field: string;
    expectedType: string;
    observedType: string;
    severity: "warning" | "critical";
    suggestedAction: "coercion" | "defaulting" | "deprecation";
}

export class SchemaDriftPredictor {
    private readonly historicalData: Message[];

    constructor(historicalData: Message[]) {
        this.historicalData = historicalData;
    }

    predictDrift(expectedSchema: Schema, historicalData: Message[]): DriftReport[] {
        const driftReports: DriftReport[] = [];

        if (!expectedSchema || Object.keys(expectedSchema).length === 0) {
            return [];
        }

        const observedFields: Record<string, { types: Set<string>; count: number }> = {};

        for (const message of historicalData) {
            // Simplified simulation of extracting tool call inputs from historical data
            // In a real scenario, this would parse ToolUseBlock inputs.
            if (message.role === "tool" && message.content) {
                // Assume content contains JSON string representation of tool inputs for simulation
                try {
                    const input: Record<string, unknown> = JSON.parse(message.content);
                    for (const key in input) {
                        const value = input[key];
                        const observedType = typeof value;
                        if (!observedFields[key]) {
                            observedFields[key] = { types: new Set(), count: 0 };
                        }
                        observedFields[key].types.add(observedType);
                        observedFields[key].count++;
                    }
                } catch (e) {
                    // Ignore parsing errors for simplicity
                }
            }
        }

        for (const fieldName in expectedSchema) {
            const expectedField = expectedSchema[fieldName];
            const observed = observedFields[fieldName];

            if (!observed) {
                driftReports.push({
                    field: fieldName,
                    expectedType: expectedField.type,
                    observedType: "missing",
                    severity: "critical",
                    suggestedAction: "defaulting"
                });
                continue;
            }

            // Check for type drift
            const observedTypes = Array.from(observed.types);
            const expectedType = expectedField.type;

            if (observedTypes.length > 1 && !expectedField.type === "object") {
                driftReports.push({
                    field: fieldName,
                    expectedType: expectedType,
                    observedType: observedTypes.join(", "),
                    severity: "warning",
                    suggestedAction: "coercion"
                });
            }

            // Check for required field deprecation (if observed count is low)
            if (expectedField.required && observed.count < 5) {
                driftReports.push({
                    field: fieldName,
                    expectedType: expectedField.type,
                    observedType: "present but inconsistent",
                    severity: "warning",
                    suggestedAction: "deprecation"
                });
            }
        }

        return driftReports;
    }

    generateAdaptiveContract(driftReport: DriftReport[]): Record<string, any> {
        const contract: Record<string, any> = {
            _adaptive_contract_active: true,
            _warnings: []
        };

        for (const report of driftReport) {
            if (report.severity === "critical") {
                contract[`fallback_${report.field}`] = (value: unknown): unknown => {
                    console.warn(`[ADAPTER WARNING] Field ${report.field} is missing or critically drifted. Applying fallback logic.`);
                    if (report.suggestedAction === "defaulting") {
                        return null; // Defaulting to null/safe value
                    }
                    return value;
                };
                contract._warnings.push(`Critical drift detected for ${report.field}. Using fallback contract.`);
            } else if (report.severity === "warning") {
                contract[`coercer_${report.field}`] = (value: unknown): unknown => {
                    console.warn(`[ADAPTER WARNING] Field ${report.field} type drift detected. Attempting coercion from ${report.observedType} to ${report.expectedType}.`);
                    // Simple coercion logic simulation
                    if (report.expectedType === "number" && typeof value === "string") {
                        return parseFloat(value);
                    }
                    return value;
                };
                contract._warnings.push(`Warning detected for ${report.field}. Using adaptive contract.`);
            }
        }

        return contract;
    }
}

export { SchemaDriftPredictor };
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type Version = string;

interface EndpointSchema {
    name: string;
    expectedParameters: Record<string, unknown>;
    requiredFields: string[];
    deprecated: boolean;
}

interface ServiceContract {
    version: Version;
    description: string;
    endpoints: Record<string, EndpointSchema>;
}

interface CompatibilityIssue {
    endpointName: string;
    issueType: "MissingField" | "ChangedParameter" | "DeprecatedEndpoint" | "SchemaMismatch";
    details: string;
}

interface AdaptationPlan {
    isCompatible: boolean;
    issues: CompatibilityIssue[];
    suggestedAdjustments: string[];
}

export class ServiceContractVersionManager {
    private registeredContracts: Map<string, ServiceContract> = new Map();

    registerContract(contract: ServiceContract): void {
        const key = `${contract.description}:${contract.version}`;
        this.registeredContracts.set(key, contract);
    }

    getContract(description: string, version: Version): ServiceContract | undefined {
        return this.registeredContracts.get(`${description}:${version}`);
    }

    compareVersions(contractA: ServiceContract, contractB: ServiceContract): {
        differences: CompatibilityIssue[];
        isCompatible: boolean;
    } {
        const differences: CompatibilityIssue[] = [];
        let isCompatible = true;

        const endpointsA = contractA.endpoints;
        const endpointsB = contractB.endpoints;

        // Check for missing/changed endpoints
        for (const [name, schemaA] of Object.entries(endpointsA)) {
            const schemaB = endpointsB[name];

            if (!schemaB) {
                differences.push({
                    endpointName: name,
                    issueType: "DeprecatedEndpoint",
                    details: `Endpoint '${name}' exists in v${contractA.version} but is missing in v${contractB.version}.`,
                });
                isCompatible = false;
                continue;
            }

            // Check for parameter changes or missing required fields
            const missingFields = schemaA.requiredFields.filter(field => !schemaB.expectedParameters[field]);
            if (missingFields.length > 0) {
                differences.push({
                    endpointName: name,
                    issueType: "MissingField",
                    details: `Required fields missing in v${contractB.version}: ${missingFields.join(', ')}.`,
                });
                isCompatible = false;
            }

            // Simple check for parameter structure change (placeholder logic)
            if (Object.keys(schemaA.expectedParameters).length !== Object.keys(schemaB.expectedParameters).length) {
                differences.push({
                    endpointName: name,
                    issueType: "ChangedParameter",
                    details: `Parameter count mismatch. v${contractA.version} has ${Object.keys(schemaA.expectedParameters).length} params, v${contractB.version} has ${Object.keys(schemaB.expectedParameters).length} params.`,
                });
                isCompatible = false;
            }
        }

        // Check for new endpoints in B that might be unexpected (optional)
        for (const [name, schemaB] of Object.entries(endpointsB)) {
            if (!endpointsA[name] && !schemaB.deprecated) {
                // This is usually fine, but we note it for completeness
            }
        }

        return { differences, isCompatible };
    }

    resolveCompatibility(contractA: ServiceContract, contractB: ServiceContract): AdaptationPlan {
        const { differences } = this.compareVersions(contractA, contractB);

        const isCompatible = differences.every(d => d.issueType !== "MissingField" && d.issueType !== "ChangedParameter");

        const suggestedAdjustments: string[] = [];

        if (differences.length > 0) {
            suggestedAdjustments.push("Review the 'MissingField' issues to ensure default values or fallback logic is implemented.");
            suggestedAdjustments.push("If 'ChangedParameter' issues exist, update the calling logic to handle the new parameter structure.");
        } else {
            suggestedAdjustments.push("No major structural changes detected. Compatibility is high.");
        }

        return {
            isCompatible: isCompatible,
            issues: differences,
            suggestedAdjustments: suggestedAdjustments,
        };
    }
}
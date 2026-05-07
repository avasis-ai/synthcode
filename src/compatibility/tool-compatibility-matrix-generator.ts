import { type Message } from "../types/message";

interface ToolSchema {
    [key: string]: unknown;
}

interface Capability {
    name: string;
    description: string;
}

interface ToolDefinition {
    name: string;
    description: string;
    inputs: ToolSchema;
    outputs: ToolSchema;
    requiredCapabilities: Capability[];
    resourceUsage: string;
}

type CompatibilityStatus = "Compatible" | "Warning: Resource Overlap" | "Conflict: Schema Mismatch" | "Conflict: Capability Conflict";

interface CompatibilityResult {
    toolA: string;
    toolB: string;
    status: CompatibilityStatus;
    details: string;
}

export class ToolCompatibilityMatrixGenerator {
    private tools: ToolDefinition[];

    constructor(tools: ToolDefinition[]) {
        this.tools = tools;
    }

    private checkSchemaCompatibility(toolA: ToolDefinition, toolB: ToolDefinition): CompatibilityStatus {
        const inputMismatch = Object.keys(toolA.inputs).some(key => !(key in toolB.inputs));
        const outputMismatch = Object.keys(toolA.outputs).some(key => !(key in toolB.outputs));

        if (inputMismatch || outputMismatch) {
            return "Conflict: Schema Mismatch";
        }
        return "Compatible";
    }

    private checkCapabilityConflict(toolA: ToolDefinition, toolB: ToolDefinition): CompatibilityStatus {
        const requiredA = new Set(toolA.requiredCapabilities.map(c => c.name));
        const requiredB = new Set(toolB.requiredCapabilities.map(c => c.name));

        for (const capA of requiredA) {
            for (const capB of requiredB) {
                if (capA === capB) {
                    return "Conflict: Capability Conflict";
                }
            }
        }
        return "Compatible";
    }

    private checkResourceOverlap(toolA: ToolDefinition, toolB: ToolDefinition): CompatibilityStatus {
        if (toolA.resourceUsage === toolB.resourceUsage) {
            return "Warning: Resource Overlap";
        }
        return "Compatible";
    }

    public generateMatrix(): CompatibilityResult[] {
        const results: CompatibilityResult[] = [];
        const n = this.tools.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const toolA = this.tools[i];
                const toolB = this.tools[j];

                let status: CompatibilityStatus = "Compatible";
                let details: string = "";

                // Check 1: Schema Compatibility
                const schemaStatus = this.checkSchemaCompatibility(toolA, toolB);
                if (schemaStatus !== "Compatible") {
                    status = schemaStatus;
                    details = `Schema mismatch detected.`;
                }

                // Check 2: Capability Conflict (Only check if schema is okay, or if it's the first conflict)
                if (status === "Compatible") {
                    const capabilityStatus = this.checkCapabilityConflict(toolA, toolB);
                    if (capabilityStatus !== "Compatible") {
                        status = capabilityStatus;
                        details = `Capability conflict detected.`;
                    }
                }

                // Check 3: Resource Overlap (Highest priority warning)
                const resourceStatus = this.checkResourceOverlap(toolA, toolB);
                if (resourceStatus !== "Compatible" && status === "Compatible") {
                    status = resourceStatus;
                    details = `Resource overlap detected.`;
                }

                results.push({
                    toolA: toolA.name,
                    toolB: toolB.name,
                    status: status,
                    details: details,
                });
            }
        }
        return results;
    }
}
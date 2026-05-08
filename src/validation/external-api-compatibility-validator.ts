interface ApiCall {
    endpoint: string;
    version: string;
    payload: Record<string, unknown>;
    headers: Record<string, string>;
    params: Record<string, unknown>;
}

interface Contract {
    endpoint: string;
    version: string;
    schema: Record<string, { required: boolean; type: string }>;
    requiredHeaders: Record<string, string>;
    allowedParams: Record<string, boolean>;
}

interface CompatibilityReport {
    isCompatible: boolean;
    issues: string[];
}

class ExternalApiCompatibilityValidator {
    validate(call: ApiCall, contract: Contract): CompatibilityReport {
        const issues: string[] = [];

        // 1. Version Check
        if (call.version !== contract.version) {
            issues.push(`Version mismatch. Call uses v${call.version}, but contract requires v${contract.version}.`);
        }

        // 2. Endpoint Check (Basic check)
        if (call.endpoint !== contract.endpoint) {
            issues.push(`Endpoint mismatch. Call targets ${call.endpoint}, but contract is for ${contract.endpoint}.`);
        }

        // 3. Payload Schema Validation
        const payloadIssues = this.validatePayload(call.payload, contract.schema);
        issues.push(...payloadIssues);

        // 4. Required Headers Validation
        const headerIssues = this.validateHeaders(call.headers, contract.requiredHeaders);
        issues.push(...headerIssues);

        // 5. Parameter Validation
        const paramIssues = this.validateParameters(call.params, contract.allowedParams);
        issues.push(...paramIssues);

        return {
            isCompatible: issues.length === 0,
            issues: issues
        };
    }

    private validatePayload(payload: Record<string, unknown>, schema: Record<string, { required: boolean; type: string }>): string[] {
        const issues: string[] = [];

        for (const key in schema) {
            const fieldSchema = schema[key];
            const value = payload[key];

            if (fieldSchema.required && value === undefined) {
                issues.push(`Payload missing required field: "${key}".`);
            } else if (value !== undefined) {
                // Basic type check simulation
                const actualType = typeof value;
                if (fieldSchema.type === "string" && actualType !== "string") {
                    issues.push(`Payload field "${key}" expected type string, but got ${actualType}.`);
                } else if (fieldSchema.type === "number" && actualType !== "number") {
                    issues.push(`Payload field "${key}" expected type number, but got ${actualType}.`);
                }
            }
        }
        return issues;
    }

    private validateHeaders(actualHeaders: Record<string, string>, requiredHeaders: Record<string, string>): string[] {
        const issues: string[] = [];
        for (const headerName in requiredHeaders) {
            if (!(headerName in actualHeaders)) {
                issues.push(`Missing required header: "${headerName}".`);
            }
        }
        return issues;
    }

    private validateParameters(actualParams: Record<string, unknown>, allowedParams: Record<string, boolean>): string[] {
        const issues: string[] = [];
        const actualKeys = Object.keys(actualParams);
        const allowedKeys = Object.keys(allowedParams);

        // Check for unknown/unsupported parameters
        for (const key of actualKeys) {
            if (!allowedParams[key]) {
                issues.push(`Unsupported parameter provided: "${key}".`);
            }
        }
        return issues;
    }
}

export { ExternalApiCompatibilityValidator };
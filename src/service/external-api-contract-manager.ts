import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types";

interface VersionRange {
    min: number;
    max: number;
}

interface ServiceContract {
    endpoint: string;
    schema: (payload: Record<string, unknown>) => { isValid: boolean; errors: string[] };
    versionRange: VersionRange;
    fallback: (payload: Record<string, unknown>) => Record<string, unknown>;
}

export class ExternalApiContractManager {
    private contracts: Map<string, ServiceContract> = new Map();

    registerContract(contract: ServiceContract): void {
        if (!contract.endpoint || !contract.schema || !contract.versionRange) {
            throw new Error("Invalid contract provided: endpoint, schema, and versionRange are required.");
        }
        this.contracts.set(contract.endpoint, contract);
    }

    validateCall(endpoint: string, payload: Record<string, unknown>, requiredVersion: number): { isValid: boolean; payload: Record<string, unknown>; fallback?: Record<string, unknown>; } {
        const contract = this.contracts.get(endpoint);

        if (!contract) {
            return { isValid: false, payload: payload };
        }

        const versionSupported = requiredVersion >= contract.versionRange.min && requiredVersion <= contract.versionRange.max;

        if (!versionSupported) {
            return { isValid: false, payload: payload };
        }

        const validationResult = contract.schema(payload);

        if (!validationResult.isValid) {
            return { isValid: false, payload: payload, fallback: contract.fallback(payload) };
        }

        return { isValid: true, payload: payload };
    }

    resolveDependency(endpoint: string, payload: Record<string, unknown>, requiredVersion: number): { isValid: boolean; payload: Record<string, unknown>; fallback?: Record<string, unknown>; } {
        const validationResult = this.validateCall(endpoint, payload, requiredVersion);

        if (validationResult.isValid) {
            return validationResult;
        }

        if (validationResult.fallback) {
            return { isValid: false, payload: payload, fallback: validationResult.fallback };
        }

        return { isValid: false, payload: payload };
    }
}
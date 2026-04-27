import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export class IncompatibleCapabilityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "IncompatibleCapabilityError";
    }
}

export interface CapabilityVersion {
    versionId: string;
    schemaHash: string;
    compatibleWith: string[];
}

export interface ToolCapabilityRegistration {
    toolName: string;
    requiredVersion: string;
    capabilityVersions: CapabilityVersion[];
}

export class CapabilityVersioningManager {
    private toolRegistrations: Map<string, ToolCapabilityRegistration> = new Map();
    private contextVersions: Map<string, Set<string>> = new Map();

    registerTool(toolName: string, requiredVersion: string, capabilityVersions: CapabilityVersion[]): void {
        if (this.toolRegistrations.has(toolName)) {
            throw new Error(`Tool ${toolName} is already registered.`);
        }
        this.toolRegistrations.set(toolName, {
            toolName,
            requiredVersion,
            capabilityVersions
        });
    }

    setContextCompatibility(toolName: string, compatibleVersionIds: string[]): void {
        this.contextVersions.set(toolName, new Set(compatibleVersionIds));
    }

    getToolRegistration(toolName: string): ToolCapabilityRegistration | undefined {
        return this.toolRegistrations.get(toolName);
    }

    validateToolInvocation(toolName: string, requestedVersionId: string): void {
        const registration = this.getToolRegistration(toolName);

        if (!registration) {
            throw new Error(`Tool ${toolName} is not registered.`);
        }

        const contextCompatible = this.contextVersions.get(toolName);

        if (!contextCompatible || !contextCompatible.has(requestedVersionId)) {
            throw new IncompatibleCapabilityError(
                `Tool ${toolName} requested version ${requestedVersionId}, but the current context only supports versions: ${Array.from(contextCompatible).join(', ')}.`
            );
        }

        const isVersionRegistered = registration.capabilityVersions.some(
            cv => cv.versionId === requestedVersionId
        );

        if (!isVersionRegistered) {
            throw new IncompatibleCapabilityError(
                `Tool ${toolName} requested version ${requestedVersionId}, but this version is not defined for the tool.`
            );
        }
    }
}

export { CapabilityVersioningManager, IncompatibleCapabilityError, CapabilityVersion, ToolCapabilityRegistration };
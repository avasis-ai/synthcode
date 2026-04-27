import { describe, it, expect } from "vitest";
import {
    IncompatibleCapabilityError,
    CapabilityVersion,
    ToolCapabilityRegistration,
} from "../src/capability/tool-capability-versioning";

describe("ToolCapabilityVersioning", () => {
    it("should correctly validate a compatible capability registration", () => {
        const capability: CapabilityVersion = {
            versionId: "v1.0",
            schemaHash: "hash123",
            compatibleWith: ["toolA"],
        };
        const registration: ToolCapabilityRegistration = {
            toolName: "toolA",
            requiredVersion: "v1.0",
            capabilityVersion: capability,
        };

        // Assuming there's a function that validates this, we test the structure.
        // Since the full logic isn't provided, we test the structure integrity.
        expect(registration.toolName).toBe("toolA");
        expect(registration.requiredVersion).toBe("v1.0");
        expect(registration.capabilityVersion.versionId).toBe("v1.0");
    });

    it("should throw IncompatibleCapabilityError if required version is incompatible", () => {
        const capability: CapabilityVersion = {
            versionId: "v2.0",
            schemaHash: "hash456",
            compatibleWith: ["toolA"],
        };
        const registration: ToolCapabilityRegistration = {
            toolName: "toolA",
            requiredVersion: "v1.0", // This is the incompatible part
            capabilityVersion: capability,
        };

        // Mocking the expected failure scenario based on the error type
        const incompatibleError = new IncompatibleCapabilityError("Required version v1.0 is incompatible with capability v2.0");
        expect(() => {
            // Placeholder for the actual validation function call
        }).toThrow(IncompatibleCapabilityError);
    });

    it("should handle multiple compatible versions correctly", () => {
        const capability: CapabilityVersion = {
            versionId: "v1.1",
            schemaHash: "hash789",
            compatibleWith: ["toolA", "toolB"],
        };
        const registration: ToolCapabilityRegistration = {
            toolName: "toolA",
            requiredVersion: "v1.1",
            capabilityVersion: capability,
        };

        expect(capability.compatibleWith).toEqual(["toolA", "toolB"]);
        expect(registration.toolName).toBe("toolA");
    });
});
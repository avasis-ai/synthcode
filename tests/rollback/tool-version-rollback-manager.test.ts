import { describe, it, expect } from "vitest";
import { ToolVersionRollbackManager } from "../../../src/rollback/tool-version-rollback-manager.js";

describe("ToolVersionRollbackManager", () => {
    it("should initialize correctly and manage versions", async () => {
        const manager = new ToolVersionRollbackManager();
        expect(manager).toBeDefined();

        const initialVersion = await manager.setVersion("v1.0.0");
        expect(initialVersion).toBe("v1.0.0");

        const newVersion = await manager.updateVersion("v1.1.0");
        expect(newVersion).toBe("v1.1.0");
    });

    it("should rollback to a previous version when requested", async () => {
        const manager = new ToolVersionRollbackManager();
        await manager.setVersion("v1.0.0");
        await manager.updateVersion("v1.1.0");
        await manager.updateVersion("v1.2.0");

        const rolledBackVersion = await manager.rollbackTo("v1.0.0");
        expect(rolledBackVersion).toBe("v1.0.0");

        const currentVersion = await manager.getCurrentVersion();
        expect(currentVersion).toBe("v1.0.0");
    });

    it("should handle rollback when no previous version exists", async () => {
        const manager = new ToolVersionRollbackManager();
        await manager.setVersion("v1.0.0");

        const rolledBackVersion = await manager.rollbackTo("non-existent-version");
        expect(rolledBackVersion).toBeNull();

        const currentVersion = await manager.getCurrentVersion();
        expect(currentVersion).toBe("v1.0.0");
    });
});
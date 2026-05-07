import { describe, it, expect, vi } from "vitest";
import { PluginHostManager } from "../src/plugin/plugin-host-manager.js";

describe("PluginHostManager", () => {
  it("should initialize correctly and manage plugins", async () => {
    const manager = new PluginHostManager();
    expect(manager).toBeDefined();

    // Simulate adding a plugin
    const mockPlugin = {
      name: "test-plugin",
      execute: vi.fn(),
    };
    await manager.addPlugin(mockPlugin);

    // Check if the plugin was added
    expect(manager.getPlugin("test-plugin")).toEqual(mockPlugin);
  });

  it("should execute a plugin and handle results", async () => {
    const manager = new PluginHostManager();
    const mockPlugin = {
      name: "test-plugin",
      execute: vi.fn().mockResolvedValue("Plugin executed successfully"),
    };
    await manager.addPlugin(mockPlugin);

    const result = await manager.executePlugin("test-plugin", "input data");

    // Check if the plugin was executed
    expect(mockPlugin.execute).toHaveBeenCalledWith("input data");
    // Check the returned result
    expect(result).toBe("Plugin executed successfully");
  });

  it("should handle execution failure gracefully", async () => {
    const manager = new PluginHostManager();
    const mockPlugin = {
      name: "failing-plugin",
      execute: vi.fn().mockRejectedValue(new Error("Plugin failed")),
    };
    await manager.addPlugin(mockPlugin);

    const result = await manager.executePlugin("failing-plugin", "input data");

    // Check if the plugin was executed
    expect(mockPlugin.execute).toHaveBeenCalled();
    // Check that the error was propagated or handled as expected (assuming it throws or returns null/error indicator)
    await expect(result).rejects.toThrow("Plugin failed");
  });
});
import { describe, it, expect } from "vitest";
import { ToolCapability, ToolDefinition } from "../src/tool/capability-registry";

describe("ToolCapabilityRegistry", () => {
  it("should correctly register a tool with all required fields", () => {
    const mockTool: ToolDefinition = {
      name: "weather_api",
      description: "Gets the current weather for a given location.",
      capability: {
        name: "get_weather",
        description: "Retrieves weather data.",
        requiredPermissions: ["weather:read"],
        expectedOutputSchema: {
          location: "string",
          temperature: "number",
        },
        failureModes: ["API_DOWN", "INVALID_LOCATION"],
        rateLimit: { limit: 10, windowMs: 60000 },
      },
    };
    const registry = new (require("../src/tool/capability-registry").CapabilityRegistry)();
    registry.registerTool(mockTool);

    const retrievedTool = registry.getTool("weather_api");
    expect(retrievedTool).toBeDefined();
    expect(retrievedTool?.capability.name).toBe("get_weather");
    expect(retrievedTool?.capability.requiredPermissions).toEqual(["weather:read"]);
  });

  it("should handle registration of tools without rate limiting", () => {
    const mockTool: ToolDefinition = {
      name: "calculator",
      description: "Performs mathematical calculations.",
      capability: {
        name: "calculate",
        description: "Performs math.",
        requiredPermissions: ["math:execute"],
        expectedOutputSchema: { result: "number" },
        failureModes: ["MATH_ERROR"],
      },
    };
    const registry = new (require("../src/tool/capability-registry").CapabilityRegistry)();
    registry.registerTool(mockTool);

    const retrievedTool = registry.getTool("calculator");
    expect(retrievedTool).toBeDefined();
    expect(retrievedTool?.capability.rateLimit).toBeUndefined();
  });

  it("should return undefined for a non-existent tool name", () => {
    const registry = new (require("../src/tool/capability-registry").CapabilityRegistry)();
    const nonExistentTool = registry.getTool("unknown_tool");
    expect(nonExistentTool).toBeUndefined();
  });
});
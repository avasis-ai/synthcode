import { describe, it, expect } from "vitest";
import { SchemaRegistry } from "../src/validation/structured-tool-input-schema-resolver-v1";

describe("SchemaRegistry", () => {
  it("should return an empty array for getToolSchemas when no tools are found", async () => {
    const mockRegistry: SchemaRegistry = {
      getToolSchemas: async (toolName: string) => {
        if (toolName === "nonExistentTool") {
          return [];
        }
        return [{ name: "tool", version: "1.0", description: "", inputSchema: {}, requiredFields: [] }];
      },
      getLatestSchemaVersion: async (toolName: string) => null,
    };

    const schemas = await mockRegistry.getToolSchemas("nonExistentTool");
    expect(schemas).toEqual([]);
  });

  it("should return the correct list of schemas for an existing tool", async () => {
    const mockRegistry: SchemaRegistry = {
      getToolSchemas: async (toolName: string) => {
        if (toolName === "existingTool") {
          return [
            { name: "existingTool", version: "1.0", description: "", inputSchema: {}, requiredFields: [] },
            { name: "existingTool", version: "2.0", description: "", inputSchema: {}, requiredFields: [] },
          ];
        }
        return [];
      },
      getLatestSchemaVersion: async (toolName: string) => "2.0",
    };

    const schemas = await mockRegistry.getToolSchemas("existingTool");
    expect(schemas.length).toBe(2);
    expect(schemas[1].version).toBe("2.0");
  });

  it("should return null for getLatestSchemaVersion when the tool does not exist", async () => {
    const mockRegistry: SchemaRegistry = {
      getToolSchemas: async (toolName: string) => [],
      getLatestSchemaVersion: async (toolName: string) => {
        if (toolName === "unknownTool") {
          return null;
        }
        return "1.0";
      },
    };

    const version = await mockRegistry.getLatestSchemaVersion("unknownTool");
    expect(version).toBeNull();
  });
});
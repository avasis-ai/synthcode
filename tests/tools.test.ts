import { describe, it, expect, vi } from "vitest";
import { defineTool } from "../src/tools/tool.js";
import { z } from "zod";
import { ToolRegistry } from "../src/tools/registry.js";

const mockTool = defineTool({
  name: "mock_tool",
  description: "A mock tool for testing",
  inputSchema: z.object({
    value: z.string(),
    count: z.number().optional(),
  }),
  isReadOnly: true,
  execute: async ({ value, count = 1 }) => `Result: ${value} x${count}`,
});

const mockTool2 = defineTool({
  name: "mock_tool_2",
  description: "Another mock tool",
  inputSchema: z.object({
    enabled: z.boolean(),
  }),
  isReadOnly: false,
  isConcurrencySafe: true,
  execute: async ({ enabled }) => `Enabled: ${enabled}`,
});

describe("defineTool", () => {
  it("creates a tool with correct properties", () => {
    expect(mockTool.name).toBe("mock_tool");
    expect(mockTool.description).toBe("A mock tool for testing");
    expect(mockTool.isReadOnly).toBe(true);
    expect(mockTool.isConcurrencySafe).toBe(false);
  });

  it("defaults isReadOnly and isConcurrencySafe to false", () => {
    const tool = defineTool({
      name: "defaults_test",
      description: "test",
      inputSchema: z.object({}),
      execute: async () => "ok",
    });
    expect(tool.isReadOnly).toBe(false);
    expect(tool.isConcurrencySafe).toBe(false);
  });

  it("with Zod input schema validates input correctly", async () => {
    const result = await mockTool.execute({ value: "hello", count: 3 }, { cwd: "/tmp", env: {} });
    expect(result).toBe("Result: hello x3");
  });

  it("with Zod input schema uses optional default", async () => {
    const result = await mockTool.execute({ value: "hello" }, { cwd: "/tmp", env: {} });
    expect(result).toBe("Result: hello x1");
  });

  it("with invalid input fails safeParse", () => {
    const parseResult = mockTool.inputSchema.safeParse({ value: 123 });
    expect(parseResult.success).toBe(false);
  });

  it("with missing required field fails safeParse", () => {
    const parseResult = mockTool.inputSchema.safeParse({});
    expect(parseResult.success).toBe(false);
  });

  it("toAPI() returns correct format with JSON Schema", () => {
    const api = mockTool.toAPI();
    expect(api.name).toBe("mock_tool");
    expect(api.description).toBe("A mock tool for testing");
    expect(api.input_schema).toEqual({
      type: "object",
      properties: {
        value: { type: "string" },
        count: { type: "number" },
      },
      required: ["value"],
    });
  });

  it("toAPI() marks optional fields as not required", () => {
    const tool = defineTool({
      name: "opt_test",
      description: "test",
      inputSchema: z.object({
        required_field: z.string(),
        optional_field: z.number().optional(),
      }),
      execute: async () => "ok",
    });
    const api = tool.toAPI();
    expect(api.input_schema.required).toEqual(["required_field"]);
    expect(api.input_schema.required).not.toContain("optional_field");
  });

  it("toString() formats correctly", () => {
    expect(mockTool.toString({ value: "hello", count: 3 })).toBe(
      'mock_tool({ value: "hello", count: 3 })'
    );
  });

  it("toString() handles undefined values", () => {
    expect(mockTool.toString({ value: "hello", count: undefined })).toBe(
      'mock_tool({ value: "hello", count: undefined })'
    );
  });

  it("toString() handles null values", () => {
    const tool = defineTool({
      name: "null_test",
      description: "test",
      inputSchema: z.object({ data: z.string().nullable() }),
      execute: async () => "ok",
    });
    expect(tool.toString({ data: null })).toBe("null_test({ data: null })");
  });

  it("execute returns string result", async () => {
    const result = await mockTool.execute({ value: "world" }, { cwd: "/", env: {} });
    expect(typeof result).toBe("string");
    expect(result).toBe("Result: world x1");
  });
});

describe("ToolRegistry", () => {
  it("add() adds tools", () => {
    const registry = new ToolRegistry();
    registry.add(mockTool);
    expect(registry.size).toBe(1);
  });

  it("get() returns tools by name", () => {
    const registry = new ToolRegistry([mockTool]);
    expect(registry.get("mock_tool")).toBe(mockTool);
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("has() checks existence", () => {
    const registry = new ToolRegistry([mockTool]);
    expect(registry.has("mock_tool")).toBe(true);
    expect(registry.has("nonexistent")).toBe(false);
  });

  it("getAll() returns all tools", () => {
    const registry = new ToolRegistry([mockTool, mockTool2]);
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.getAll()).toContain(mockTool);
    expect(registry.getAll()).toContain(mockTool2);
  });

  it("getAPI() returns sorted API definitions", () => {
    const registry = new ToolRegistry([mockTool2, mockTool]);
    const api = registry.getAPI();
    expect(api).toHaveLength(2);
    expect(api[0].name).toBe("mock_tool");
    expect(api[1].name).toBe("mock_tool_2");
  });

  it("deduplicates by name (first wins, warns on duplicate)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const duplicate = defineTool({
      name: "mock_tool",
      description: "Duplicate",
      inputSchema: z.object({}),
      execute: async () => "dup",
    });
    const registry = new ToolRegistry([mockTool, duplicate]);
    expect(registry.size).toBe(1);
    expect(registry.get("mock_tool")).toBe(mockTool);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate tool "mock_tool"')
    );
    warnSpy.mockRestore();
  });

  it("deduplicates via add() (first wins)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = new ToolRegistry([mockTool]);
    const duplicate = defineTool({
      name: "mock_tool",
      description: "Duplicate",
      inputSchema: z.object({}),
      execute: async () => "dup",
    });
    registry.add(duplicate);
    expect(registry.size).toBe(1);
    expect(registry.get("mock_tool")).toBe(mockTool);
    warnSpy.mockRestore();
  });

  it("handles empty tools", () => {
    const registry = new ToolRegistry();
    expect(registry.size).toBe(0);
    expect(registry.getAll()).toHaveLength(0);
    expect(registry.getAPI()).toHaveLength(0);
    expect(registry.has("anything")).toBe(false);
    expect(registry.get("anything")).toBeUndefined();
  });

  it("constructor accepts initial tools", () => {
    const registry = new ToolRegistry([mockTool, mockTool2]);
    expect(registry.size).toBe(2);
    expect(registry.has("mock_tool")).toBe(true);
    expect(registry.has("mock_tool_2")).toBe(true);
  });
});

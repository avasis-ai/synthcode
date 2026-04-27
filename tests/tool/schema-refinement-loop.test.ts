import { describe, it, expect, vi } from "vitest";
import { SchemaRefiner } from "../src/tool/schema-refinement-loop";
import { ToolOutputSchema, ValidationResult, Context } from "../src/tool/types";

describe("SchemaRefiner", () => {
  it("should call llmService.generateContent with correct prompt and schema when refinement is needed", async () => {
    const mockLlmService = {
      generateContent: vi.fn().mockResolvedValue("{\"field\": \"refined_value\"}"),
    };
    const initialSchema: ToolOutputSchema = { type: "object", properties: { id: { type: "string" } } };
    const context: Context = { history: [] };
    const validationResult: ValidationResult[] = [{ field: "id", message: "Missing required field" }];

    const refiner = new SchemaRefiner(mockLlmService);

    await refiner.refineSchema(initialSchema, validationResult, context);

    expect(mockLlmService.generateContent).toHaveBeenCalledTimes(1);
    const [prompt, schema] = mockLlmService.generateContent.mock.calls[0];
    expect(schema).toEqual(initialSchema);
    expect(prompt).toContain("Please refine the tool output based on the following errors:");
  });

  it("should return the initial schema if no validation errors are present", async () => {
    const mockLlmService = {
      generateContent: vi.fn(),
    };
    const initialSchema: ToolOutputSchema = { type: "object", properties: { name: { type: "string" } } };
    const context: Context = { history: [] };
    const validationResult: ValidationResult[] = [];

    const refiner = new SchemaRefiner(mockLlmService);

    const result = await refiner.refineSchema(initialSchema, validationResult, context);

    expect(mockLlmService.generateContent).not.toHaveBeenCalled();
    expect(result).toEqual(initialSchema);
  });

  it("should handle multiple validation errors correctly when building the prompt", async () => {
    const mockLlmService = {
      generateContent: vi.fn().mockResolvedValue("{}"),
    };
    const initialSchema: ToolOutputSchema = { type: "object", properties: { a: { type: "string" }, b: { type: "number" } } };
    const context: Context = { history: [] };
    const validationResult: ValidationResult[] = [
      { field: "a", message: "Field 'a' is too short." },
      { field: "b", message: "Field 'b' must be positive." },
    ];

    const refiner = new SchemaRefiner(mockLlmService);

    await refiner.refineSchema(initialSchema, validationResult, context);

    expect(mockLlmService.generateContent).toHaveBeenCalledTimes(1);
    const [prompt, _] = mockLlmService.generateContent.mock.calls[0];
    expect(prompt).toContain("Field 'a' is too short.");
    expect(prompt).toContain("Field 'b' must be positive.");
  });
});
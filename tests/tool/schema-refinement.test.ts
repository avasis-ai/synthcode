import { describe, it, expect } from "vitest";
import { SchemaRefiner } from "../src/tool/schema-refinement";

describe("SchemaRefiner", () => {
  it("should call llmClient.call with the correct prompt and schema", async () => {
    const mockLlmClient = {
      call: vi.fn().mockResolvedValue(JSON.stringify({ key: "value" })),
    };
    const refiner = new SchemaRefiner(mockLlmClient);

    const input = {
      rawOutput: "some raw output",
      originalSchema: { type: "object", properties: { id: { type: "string" } } },
      refinementPrompt: "Refine the output to match the schema.",
    };

    await refiner.refine(input);

    expect(mockLlmClient.call).toHaveBeenCalledTimes(1);
    const [prompt, schema] = mockLlmClient.call.mock.calls[0];
    expect(prompt).toContain("You are an expert JSON schema refiner.");
    expect(schema).toEqual(input.originalSchema);
  });

  it("should return the result from the llm client", async () => {
    const mockLlmClient = {
      call: vi.fn().mockResolvedValue(JSON.stringify({ success: true })),
    };
    const refiner = new SchemaRefiner(mockLlmClient);

    const input = {
      rawOutput: "some raw output",
      originalSchema: { type: "object", properties: {} },
      refinementPrompt: "Refine the output.",
    };

    const result = await refiner.refine(input);

    expect(result).toBe(JSON.stringify({ success: true }));
  });

  it("should handle empty inputs gracefully (though implementation might need refinement for real-world use)", async () => {
    const mockLlmClient = {
      call: vi.fn().mockResolvedValue("{}"),
    };
    const refiner = new SchemaRefiner(mockLlmClient);

    const input = {
      rawOutput: "",
      originalSchema: {},
      refinementPrompt: "",
    };

    const result = await refiner.refine(input);

    expect(mockLlmClient.call).toHaveBeenCalledTimes(1);
    expect(result).toBe("{}");
  });
});
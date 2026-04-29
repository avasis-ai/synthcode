import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV144 } from "../src/validation/structured-tool-output-validation-context-enricher-v144";
import { Message } from "../src/types";

describe("StructuredToolOutputValidationContextEnricherV144", () => {
  const enricher = new StructuredToolOutputValidationContextEnricherV144();

  it("should enrich context correctly with basic tool output", async () => {
    const rawToolOutput: Record<string, unknown> = {
      toolName: "someTool",
      output: {
        result: "success",
        data: [1, 2, 3],
      },
    };
    const currentContext: { messages: Message[]; state: Record<string, unknown> } = {
      messages: [{ role: "user", content: "Test" }],
      state: { initial: true },
    };
    const availableEnrichers: { name: string; enrich: (context: any) => any }[] = [];

    const enrichedContext = enricher.enrichContext(
      rawToolOutput,
      currentContext,
      availableEnrichers
    );

    expect(enrichedContext).toHaveProperty("toolOutput");
    expect(enrichedContext.toolOutput).toEqual(
      expect.objectContaining({
        toolName: "someTool",
        output: {
          result: "success",
          data: [1, 2, 3],
        },
      })
    );
    expect(enrichedContext).toHaveProperty("context");
    expect(enrichedContext.context).toEqual(
      expect.objectContaining({
        ...currentContext.state,
        toolOutput: rawToolOutput,
      })
    );
  });

  it("should handle empty raw tool output gracefully", async () => {
    const rawToolOutput: Record<string, unknown> = {};
    const currentContext: { messages: Message[]; state: Record<string, unknown> } = {
      messages: [{ role: "user", content: "Test" }],
      state: { initial: true },
    };
    const availableEnrichers: { name: string; enrich: (context: any) => any }[] = [];

    const enrichedContext = enricher.enrichContext(
      rawToolOutput,
      currentContext,
      availableEnrichers
    );

    expect(enrichedContext).toHaveProperty("toolOutput", {});
    expect(enrichedContext).toHaveProperty("context");
    expect(enrichedContext.context).toEqual(
      expect.objectContaining({
        initial: true,
        toolOutput: {},
      })
    );
  });

  it("should merge context state with tool output information", async () => {
    const rawToolOutput: Record<string, unknown> = {
      toolName: "dataFetcher",
      output: {
        userId: "user123",
        data: "fetched",
      },
    };
    const currentContext: { messages: Message[]; state: Record<string, unknown> } = {
      messages: [{ role: "user", content: "Fetch data" }],
      state: { userId: "initialUser", lastFetch: Date.now() },
    };
    const availableEnrichers: { name: string; enrich: (context: any) => any }[] = [];

    const enrichedContext = enricher.enrichContext(
      rawToolOutput,
      currentContext,
      availableEnrichers
    );

    expect(enrichedContext.context.userId).toBe("user123");
    expect(enrichedContext.context.lastFetch).toBe(
      currentContext.state.lastFetch
    );
    expect(enrichedContext.context).toHaveProperty("toolOutput");
  });
});
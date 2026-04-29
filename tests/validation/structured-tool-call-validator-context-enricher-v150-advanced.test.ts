import { describe, it, expect } from "vitest";
import { IContextProvider } from "../src/validation/structured-tool-call-validator-context-enricher-v150-advanced";

describe("IContextProvider", () => {
  it("should correctly enrich context when no conflicts exist", async () => {
    const mockProvider: IContextProvider = {
      name: "mockProvider",
      enrichContext: async (context, history) => ({
        context: { ...context, newKey: "newValue" },
        report: {
          source: "mockProvider",
          merged_data: { ...context, newKey: "newValue" },
          conflicts_resolved: {},
        },
      }),
    };

    const initialContext: Record<string, unknown> = { user_id: "123" };
    const history: Message[] = [{ role: "user", content: "Hi" }];

    const result = await mockProvider.enrichContext(initialContext, history);

    expect(result.context).toEqual({ user_id: "123", newKey: "newValue" });
    expect(result.report.source).toBe("mockProvider");
    expect(result.report.merged_data).toEqual({ user_id: "123", newKey: "newValue" });
    expect(result.report.conflicts_resolved).toEqual({});
  });

  it("should resolve conflicts and update context correctly", async () => {
    const mockProvider: IContextProvider = {
      name: "mockProvider",
      enrichContext: async (context, history) => ({
        context: { ...context, conflictingKey: "resolvedValue" },
        report: {
          source: "mockProvider",
          merged_data: { ...context, conflictingKey: "resolvedValue" },
          conflicts_resolved: {
            conflictingKey: { source_value: "originalValue", resolved_value: "resolvedValue" },
          },
        },
      }),
    };

    const initialContext: Record<string, unknown> = { conflictingKey: "originalValue" };
    const history: Message[] = [{ role: "assistant", content: "Response" }];

    const result = await mockProvider.enrichContext(initialContext, history);

    expect(result.context).toEqual({ conflictingKey: "resolvedValue" });
    expect(result.report.conflicts_resolved.conflictingKey).toBeDefined();
    expect(result.report.conflicts_resolved.conflictingKey!.source_value).toBe("originalValue");
    expect(result.report.conflicts_resolved.conflictingKey!.resolved_value).toBe("resolvedValue");
  });

  it("should handle empty context and history gracefully", async () => {
    const mockProvider: IContextProvider = {
      name: "mockProvider",
      enrichContext: async (context, history) => ({
        context: { ...context, newKey: "default" },
        report: {
          source: "mockProvider",
          merged_data: { ...context, newKey: "default" },
          conflicts_resolved: {},
        },
      }),
    };

    const initialContext: Record<string, unknown> = {};
    const history: Message[] = [];

    const result = await mockProvider.enrichContext(initialContext, history);

    expect(result.context).toEqual({ newKey: "default" });
    expect(result.report.merged_data).toEqual({ newKey: "default" });
    expect(result.report.conflicts_resolved).toEqual({});
  });
});
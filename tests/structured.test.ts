import { describe, it, expect } from "vitest";

// These tests verify the zod validation patterns used internally by Agent.structured() / Agent.structuredViaTool().
// Integration tests for those Agent methods require a real LLM provider and are not included here.
describe("Structured Output Pattern (zod validation)", () => {
  it("parses valid JSON", async () => {
    const z = await import("zod");
    const schema = z.object({ name: z.string(), age: z.number() });
    const json = '{"name": "Alice", "age": 30}';
    const result = schema.safeParse(JSON.parse(json));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(30);
  });

  it("handles parse failures gracefully", async () => {
    const z = await import("zod");
    const schema = z.object({ name: z.string(), age: z.number() });
    const json = '{"name": "Alice", "age": "thirty"}';
    const result = schema.safeParse(JSON.parse(json));
    expect(result.success).toBe(false);
  });

  it("retry with error feedback pattern", async () => {
    let attempts = 0;
    const z = await import("zod");
    const schema = z.object({ answer: z.number() });

    function tryParse(json: string): { success: boolean; data?: unknown; error?: string } {
      attempts++;
      const result = schema.safeParse(JSON.parse(json));
      if (result.success) return { success: true, data: result.data };
      const errors = result.error.issues.map((i: { path: (string | number)[]; message: string }) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return { success: false, error: errors };
    }

    const r1 = tryParse('{"answer": "not a number"}');
    expect(r1.success).toBe(false);

    const fixed = '{"answer": 42}';
    const r2 = tryParse(fixed);
    expect(r2.success).toBe(true);
    if (r2.success) expect((r2.data as { answer: number }).answer).toBe(42);
    expect(attempts).toBe(2);
  });
});

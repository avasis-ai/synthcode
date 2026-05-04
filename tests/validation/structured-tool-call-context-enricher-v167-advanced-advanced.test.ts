import { describe, it, expect } from "vitest";
import { StructuredToolCallContextEnricher } from "../src/validation/structured-tool-call-context-enricher-v167-advanced-advanced";

describe("StructuredToolCallContextEnricher", () => {
  it("should initialize with default weighted-average strategy", () => {
    const enricher = new StructuredToolCallContextEnricher();
    // We can't directly test private members, but we can test its behavior
    // by checking if it processes multiple sources.
    const sources: { context: Record<string, unknown>; weight: number }[] = [
      { context: { a: 1 }, weight: 1 },
      { context: { b: 2 }, weight: 1 },
    ];
    const result = enricher.fuseContext(sources);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("should correctly merge context using 'first-wins' strategy", () => {
    const enricher = new StructuredToolCallContextEnricher("first-wins");
    const sources: { context: Record<string, unknown>; weight: number }[] = [
      { context: { key: "first" }, weight: 1 },
      { context: { key: "second" }, weight: 1 },
    ];
    const result = enricher.fuseContext(sources);
    expect(result).toEqual({ key: "first" });
  });

  it("should correctly merge context using 'last-wins' strategy", () => {
    const enricher = new StructuredToolCallContextEnricher("last-wins");
    const sources: { context: Record<string, unknown>; weight: number }[] = [
      { context: { key: "first" }, weight: 1 },
      { context: { key: "second" }, weight: 1 },
    ];
    const result = enricher.fuseContext(sources);
    expect(result).toEqual({ key: "second" });
  });
});
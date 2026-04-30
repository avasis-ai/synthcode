import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v167-advanced-advanced";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should correctly validate context when all cross-field rules pass", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: AdvancedContextEnricherContext = {
      toolOutput: {
        name: "ProductA",
        price: 100,
        inStock: true,
      },
      history: [
        { role: "user", content: "Check product details" },
        { role: "assistant", content: "Product details retrieved." },
      ],
      crossFieldRules: [
        {
          field: "price",
          dependsOn: "name",
          validator: (currentValue: unknown, history: Message[]): boolean => {
            // Simple validation: price must be positive
            return typeof currentValue === "number" && currentValue > 0;
          },
        },
        {
          field: "inStock",
          dependsOn: "price",
          validator: (currentValue: unknown, history: Message[]): boolean => {
            // Simple validation: if price > 50, it must be in stock
            const price = 100; // Mocking dependency access for simplicity in test setup
            return (typeof currentValue === "boolean" && currentValue === true) || (typeof price !== "number" || price <= 50);
          },
        },
      ],
    };

    const result = enricher.enrich(mockContext);

    expect(result.isValid).toBe(true);
    expect(result.enrichedContext).toEqual(mockContext.toolOutput);
  });

  it("should mark context as invalid if a cross-field rule fails", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: AdvancedContextEnricherContext = {
      toolOutput: {
        name: "ProductB",
        price: -50, // Invalid price for the rule defined below
        inStock: true,
      },
      history: [
        { role: "user", content: "Check product details" },
      ],
      crossFieldRules: [
        {
          field: "price",
          dependsOn: "name",
          validator: (currentValue: unknown, history: Message[]): boolean => {
            // This rule will fail because -50 is not > 0
            return typeof currentValue === "number" && currentValue > 0;
          },
        },
      ],
    };

    const result = enricher.enrich(mockContext);

    expect(result.isValid).toBe(false);
    // The enriched context should still contain the original tool output, even if invalid
    expect(result.enrichedContext).toEqual(mockContext.toolOutput);
  });

  it("should handle empty cross-field rules gracefully", () => {
    const enricher = new StructuredToolOutputValidationContextEnricher();
    const mockContext: AdvancedContextEnricherContext = {
      toolOutput: {
        name: "ProductC",
        price: 10,
        inStock: false,
      },
      history: [],
      crossFieldRules: [], // Empty ruleset
    };

    const result = enricher.enrich(mockContext);

    expect(result.isValid).toBe(true);
    expect(result.enrichedContext).toEqual(mockContext.toolOutput);
  });
});
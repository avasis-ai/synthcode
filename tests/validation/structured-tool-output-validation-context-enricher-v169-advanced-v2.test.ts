import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricher } from "../src/validation/structured-tool-output-validation-context-enricher-v169-advanced-v2";

describe("StructuredToolOutputValidationContextEnricher", () => {
  it("should correctly enrich context when a condition is met", () => {
    const enricher: StructuredToolOutputValidationContextEnricher = {
      enrichSteps: [
        {
          name: "enricherA",
          condition: (context) => (context["someKey"] === "trigger"),
          enricher: (context, previousResult) => ({
            newKey: "enrichedValue",
            source: "enricherA",
          }),
        },
      ],
    };

    const context: any = { someKey: "trigger", initialData: "test" };
    const previousResult: any = { toolOutput: "some output" };

    const enrichedContext = enricher.enrichSteps.reduce(
      (acc, step) => {
        if (step.condition && step.condition(acc)) {
          return { ...acc, ...step.enricher(acc, previousResult) };
        }
        return acc;
      },
      { ...context }
    );

    expect(enrichedContext).toHaveProperty("newKey", "enrichedValue");
    expect(enrichedContext).toHaveProperty("source", "enricherA");
    expect(enrichedContext).toHaveProperty("initialData", "test");
  });

  it("should not enrich context when the condition is not met", () => {
    const enricher: StructuredToolOutputValidationContextEnricher = {
      enrichSteps: [
        {
          name: "enricherB",
          condition: (context) => (context["someKey"] === "other"),
          enricher: (context, previousResult) => ({
            newKey: "shouldNotBeAdded",
          }),
        },
      ],
    };

    const context: any = { someKey: "otherTrigger" };
    const previousResult: any = { toolOutput: "some output" };

    const enrichedContext = enricher.enrichSteps.reduce(
      (acc, step) => {
        if (step.condition && step.condition(acc)) {
          return { ...acc, ...step.enricher(acc, previousResult) };
        }
        return acc;
      },
      { ...context }
    );

    expect(enrichedContext).toEqual({ someKey: "otherTrigger" });
  });

  it("should process all enrichers sequentially and merge results", () => {
    const enricher: StructuredToolOutputValidationContextEnricher = {
      enrichSteps: [
        {
          name: "enricher1",
          condition: (context) => true,
          enricher: (context, previousResult) => ({
            key1: "value1",
          }),
        },
        {
          name: "enricher2",
          condition: (context) => true,
          enricher: (context, previousResult) => ({
            key2: "value2",
          }),
        },
      ],
    };

    const context: any = { initial: "context" };
    const previousResult: any = { toolOutput: "tool output" };

    const enrichedContext = enricher.enrichSteps.reduce(
      (acc, step) => {
        if (step.condition && step.condition(acc)) {
          return { ...acc, ...step.enricher(acc, previousResult) };
        }
        return acc;
      },
      { ...context }
    );

    expect(enrichedContext).toEqual({
      initial: "context",
      key1: "value1",
      key2: "value2",
    });
  });
});
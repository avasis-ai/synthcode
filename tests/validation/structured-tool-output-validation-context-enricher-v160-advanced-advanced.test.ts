import { describe, it, expect } from "vitest";
import { AdvancedValidationContext, AdvancedRule } from "../src/validation/structured-tool-output-validation-context-enricher-v160-advanced-advanced";
import { enrichContext } from "../src/validation/structured-tool-output-validation-context-enricher-v160-advanced-advanced";

describe("enrichContext", () => {
  it("should enrich context with derived state and flags based on rules", () => {
    const mockContext: AdvancedValidationContext = {
      baseContext: {
        messages: [
          { type: "user", content: "Hello" }
        ],
        history: [],
        graphData: {
          user: "test",
        }
      },
      enrichmentRules: [
        {
          name: "rule1",
          execute: (context: AdvancedValidationContext) => ({
            derivedState: {
              status: "processed",
            },
            flags: {
              hasUserMessage: true,
            }
          })
        }
      ],
      enrichedContext: {
        derivedState: {},
        flags: {}
      }
    };

    const result = enrichContext(mockContext);

    expect(result.enrichedContext.derivedState).toEqual({
      status: "processed",
    });
    expect(result.enrichedContext.flags).toEqual({
      hasUserMessage: true,
    });
  });

  it("should handle multiple rules and aggregate their results", () => {
    const mockContext: AdvancedValidationContext = {
      baseContext: {
        messages: [
          { type: "user", content: "Data to process" }
        ],
        history: [],
        graphData: {
          source: "api",
        }
      },
      enrichmentRules: [
        {
          name: "ruleA",
          execute: (context: AdvancedValidationContext) => ({
            derivedState: {
              source: "ruleA",
            },
            flags: {
              processedByA: true,
            }
          })
        },
        {
          name: "ruleB",
          execute: (context: AdvancedValidationContext) => ({
            derivedState: {
              source: "ruleB",
            },
            flags: {
              processedByB: true,
            }
          })
        }
      ],
      enrichedContext: {
        derivedState: {},
        flags: {}
      }
    };

    const result = enrichContext(mockContext);

    expect(result.enrichedContext.derivedState).toEqual({
      source: "ruleB",
    });
    expect(result.enrichedContext.flags).toEqual({
      processedByA: true,
      processedByB: true,
    });
  });

  it("should return the context structure even if no rules are present", () => {
    const mockContext: AdvancedValidationContext = {
      baseContext: {
        messages: [],
        history: [],
        graphData: {}
      },
      enrichmentRules: [],
      enrichedContext: {
        derivedState: {},
        flags: {}
      }
    };

    const result = enrichContext(mockContext);

    expect(result.enrichedContext.derivedState).toEqual({});
    expect(result.enrichedContext.flags).toEqual({});
  });
});
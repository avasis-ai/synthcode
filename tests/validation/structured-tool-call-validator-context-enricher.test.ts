import { describe, it, expect } from "vitest";
import {
  validateStructuredToolCall,
  EnrichmentContext,
  ValidationContext,
  ValidationResult,
} from "../src/validation/structured-tool-call-validator-context-enricher";

describe("validateStructuredToolCall", () => {
  it("should return isValid true for a valid structured tool call", async () => {
    const mockContext: ValidationContext = {
      message: {
        role: "user",
        content: [{ type: "text", content: "What is the weather?" }],
      },
      enrichmentContext: {
        resourceUsageMetrics: { cpuUsage: 0.1, memoryUsage: 0.2 },
        sessionConstraints: { maxTokens: 2000, requiredPermissions: ["weather:read"] },
        history: [],
      },
    };
    const mockToolCall = {
      name: "get_weather",
      arguments: JSON.stringify({ location: "New York" }),
    };

    const result: ValidationResult = validateStructuredToolCall(
      mockToolCall,
      mockContext
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.enrichedContext).toBeDefined();
  });

  it("should return isValid false and errors for missing tool call name", async () => {
    const mockContext: ValidationContext = {
      message: {
        role: "user",
        content: [{ type: "text", content: "Check the stock price." }],
      },
      enrichmentContext: {
        resourceUsageMetrics: { cpuUsage: 0.1, memoryUsage: 0.2 },
        sessionConstraints: { maxTokens: 2000, requiredPermissions: ["stock:read"] },
        history: [],
      },
    };
    const mockToolCall = {
      arguments: JSON.stringify({ ticker: "GOOGL" }),
    };

    const result: ValidationResult = validateStructuredToolCall(
      mockToolCall,
      mockContext
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Tool call name is required.");
    expect(result.enrichedContext).toBeDefined();
  });

  it("should return isValid false and errors for invalid arguments JSON", async () => {
    const mockContext: ValidationContext = {
      message: {
        role: "user",
        content: [{ type: "text", content: "Calculate the area." }],
      },
      enrichmentContext: {
        resourceUsageMetrics: { cpuUsage: 0.1, memoryUsage: 0.2 },
        sessionConstraints: { maxTokens: 2000, requiredPermissions: ["calculator:use"] },
        history: [],
      },
    };
    const mockToolCall = {
      name: "calculate_area",
      arguments: "{invalid json",
    };

    const result: ValidationResult = validateStructuredToolCall(
      mockToolCall,
      mockContext
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Arguments must be a valid JSON string.");
    expect(result.enrichedContext).toBeDefined();
  });
});
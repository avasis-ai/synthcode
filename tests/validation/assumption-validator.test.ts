import { describe, it, expect } from "vitest";
import { AssumptionValidator } from "../src/validation/assumption-validator.js";

describe("AssumptionValidator", () => {
  it("should correctly validate a set of assumptions when all are valid", () => {
    const mockContext = { user: "test", data: "valid" };
    const mockSources = { api: "ok", db: "ok" };

    const assumption1: Assumption = {
      key: "user_exists",
      source: "context",
      description: "User must be present in context",
      validator: (context, sources) => typeof context.user === "string" && context.user !== "",
    };

    const assumption2: Assumption = {
      key: "api_data_available",
      source: "external",
      description: "API must return data",
      validator: (context, sources) => typeof sources.api === "string" && sources.api !== "",
    };

    const validator = new AssumptionValidator([assumption1, assumption2]);
    const report = validator.validate(mockContext, mockSources);

    expect(report.isValid).toBe(true);
    expect(report.results.length).toBe(2);
    expect(report.results.every(r => r.isValid)).toBe(true);
  });

  it("should correctly identify invalid assumptions and provide messages", () => {
    const mockContext = { user: null, data: "invalid" };
    const mockSources = { api: undefined, db: "ok" };

    const assumption1: Assumption = {
      key: "user_exists",
      source: "context",
      description: "User must be present in context",
      validator: (context, sources) => typeof context.user === "string" && context.user !== "",
    };

    const assumption2: Assumption = {
      key: "api_data_available",
      source: "external",
      description: "API must return data",
      validator: (context, sources) => typeof sources.api === "string" && sources.api !== "",
    };

    const validator = new AssumptionValidator([assumption1, assumption2]);
    const report = validator.validate(mockContext, mockSources);

    expect(report.isValid).toBe(false);
    expect(report.results.length).toBe(2);
    expect(report.results.some(r => r.assumptionKey === "user_exists" && !r.isValid)).toBe(true);
    expect(report.results.some(r => r.assumptionKey === "api_data_available" && !r.isValid)).toBe(true);
  });

  it("should handle an empty list of assumptions gracefully", () => {
    const mockContext = {};
    const mockSources = {};
    const validator = new AssumptionValidator([]);
    const report = validator.validate(mockContext, mockSources);

    expect(report.isValid).toBe(true);
    expect(report.results).toEqual([]);
  });
});
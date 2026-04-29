import { describe, it, expect } from "vitest";
import { TemporalConstraintValidator } from "../src/validation/structured-tool-output-schema-validator-advanced";

describe("TemporalConstraintValidator", () => {
  it("should correctly validate a simple temporal constraint (e.g., start before end)", () => {
    type TestData = {
      startDate: string;
      endDate: string;
    };
    const validator = new TemporalConstraintValidator<TestData>([
      { key1: "startDate", key2: "endDate", check: (v1, v2) => new Date(v1) < new Date(v2) },
    ]);

    // Valid case
    const validData: TestData = { startDate: "2023-01-01", endDate: "2023-01-02" };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);

    // Invalid case (start after end)
    const invalidData: TestData = { startDate: "2023-01-03", endDate: "2023-01-02" };
    const resultInvalid = validator.validate(invalidData);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toHaveLength(1);
  });

  it("should handle multiple independent temporal constraints", () => {
    type TestData = {
      start: string;
      middle: string;
      end: string;
    };
    const validator = new TemporalConstraintValidator<TestData>([
      { key1: "start", key2: "middle", check: (v1, v2) => new Date(v1) <= new Date(v2) },
      { key1: "middle", key2: "end", check: (v1, v2) => new Date(v1) <= new Date(v2) },
    ]);

    // Valid case
    const validData: TestData = { start: "2023-01-01", middle: "2023-01-02", end: "2023-01-03" };
    const result = validator.validate(validData);
    expect(result.isValid).toBe(true);

    // Invalid case (middle before start)
    const invalidData: TestData = { start: "2023-01-03", middle: "2023-01-02", end: "2023-01-03" };
    const resultInvalid = validator.validate(invalidData);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toContain("start and middle: start must be before or same as middle");
  });

  it("should report all validation errors when multiple constraints fail", () => {
    type TestData = {
      a: string;
      b: string;
    };
    const validator = new TemporalConstraintValidator<TestData>([
      { key1: "a", key2: "b", check: (v1, v2) => new Date(v1) < new Date(v2) }, // Fails
      { key1: "b", key2: "a", check: (v1, v2) => new Date(v1) < new Date(v2) }, // Fails
    ]);

    const invalidData: TestData = { a: "2023-01-05", b: "2023-01-04" };
    const result = validator.validate(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toEqual(expect.arrayContaining([
      "a and b: a must be before b",
      "b and a: b must be before a",
    ]));
  });
});
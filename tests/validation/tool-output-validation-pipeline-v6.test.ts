import { describe, it, expect } from "vitest";
import { TemporalConstraintValidator } from "../src/validation/tool-output-validation-pipeline-v6";

describe("TemporalConstraintValidator", () => {
  it("should return valid when timestamps are present and correctly ordered", () => {
    const validator = new TemporalConstraintValidator();
    const output = {
      startTime: "2023-01-01T10:00:00Z",
      endTime: "2023-01-01T11:00:00Z",
    };
    const result = validator.validate(output);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when endTime is before startTime", () => {
    const validator = new TemporalConstraintValidator();
    const output = {
      startTime: "2023-01-01T11:00:00Z",
      endTime: "2023-01-01T10:00:00Z",
    };
    const result = validator.validate(output);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("End time must be after start time.");
  });

  it("should return invalid when required time fields are missing", () => {
    const validator = new TemporalConstraintValidator();
    const output = {
      startTime: "2023-01-01T10:00:00Z",
      // endTime is missing
    };
    const result = validator.validate(output);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("End time is required.");
  });
});
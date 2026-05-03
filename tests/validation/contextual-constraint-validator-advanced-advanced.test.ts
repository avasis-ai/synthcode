import { describe, it, expect } from "vitest";
import { ContextualConstraintValidator, TemporalConstraint } from "../src/validation/contextual-constraint-validator-advanced-advanced";

describe("ContextualConstraintValidator", () => {
  it("should validate correctly when context and data are valid", () => {
    const validator: ContextualConstraintValidator = {
      validate: (context, data) => {
        if (context.userRole === "admin" && data.id > 0) {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: ["Invalid context or data"] };
      },
    };
    const result = validator.validate({ userRole: "admin" }, { id: 10 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid when context is missing required information", () => {
    const validator: ContextualConstraintValidator = {
      validate: (context, data) => {
        if (!context.userRole) {
          return { isValid: false, errors: ["User role is required"] };
        }
        return { isValid: true, errors: [] };
      },
    };
    const result = validator.validate({}, { id: 10 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("User role is required");
  });

  it("should handle temporal constraints correctly", () => {
    const validator: TemporalConstraint = {
      validate: (context, data) => {
        const requiredDate = new Date(context.startDate);
        const providedDate = new Date(data.date);
        if (providedDate >= requiredDate) {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: ["Date must be after start date"] };
      },
    };
    const context = { startDate: "2023-01-01T00:00:00Z" };
    const validData = { date: "2023-01-02T00:00:00Z" };
    const invalidData = { date: "2022-12-31T00:00:00Z" };

    const resultValid = validator.validate(context, validData);
    expect(resultValid.isValid).toBe(true);

    const resultInvalid = validator.validate(context, invalidData);
    expect(resultInvalid.isValid).toBe(false);
    expect(resultInvalid.errors).toContain("Date must be after start date");
  });
});
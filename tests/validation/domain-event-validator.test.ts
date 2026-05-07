import { describe, it, expect } from "vitest";
import { DomainEventValidator } from "../src/validation/domain-event-validator.js";

describe("DomainEventValidator", () => {
  it("should return valid result when no validators are added and payload is provided", () => {
    const validator = new DomainEventValidator<any>();
    const result = validator.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should aggregate errors from multiple validators", () => {
    const validator = new DomainEventValidator<any>();
    const mockValidator1: any = {
      validate: (payload) => ({
        isValid: false,
        errors: ["Error 1"],
      }),
    };
    const mockValidator2: any = {
      validate: (payload) => ({
        isValid: false,
        errors: ["Error 2"],
      }),
    };

    validator.addValidator(mockValidator1);
    validator.addValidator(mockValidator2);

    const result = validator.validate({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Error 1", "Error 2"]);
  });

  it("should return valid result if all validators pass", () => {
    const validator = new DomainEventValidator<any>();
    const mockValidator1: any = {
      validate: (payload) => ({
        isValid: true,
        errors: [],
      }),
    };
    const mockValidator2: any = {
      validate: (payload) => ({
        isValid: true,
        errors: [],
      }),
    };

    validator.addValidator(mockValidator1);
    validator.addValidator(mockValidator2);

    const result = validator.validate({});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
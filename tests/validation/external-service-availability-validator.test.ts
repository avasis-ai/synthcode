import { describe, it, expect } from "vitest";
import { ExternalServiceAvailabilityValidator } from "../src/validation/external-service-availability-validator";

describe("ExternalServiceAvailabilityValidator", () => {
  it("should return valid result when service is available and healthy", () => {
    const validator = new ExternalServiceAvailabilityValidator();
    // Mocking the internal state to simulate a healthy service
    (validator as any).serviceRegistry.set("PaymentGateway", {
      name: "PaymentGateway",
      endpoint: "https://api.payment.com",
      healthCheckEndpoint: "/health",
      isRateLimited: false,
    });

    const result = validator.validateService("PaymentGateway");
    expect(result.isValid).toBe(true);
    expect(result.message).toContain("is available and healthy");
  });

  it("should return invalid result when service is down", () => {
    const validator = new ExternalServiceAvailabilityValidator();
    // Mocking the internal state to simulate an unavailable service
    (validator as any).serviceRegistry.set("UserService", {
      name: "UserService",
      endpoint: "https://api.user.com",
      healthCheckEndpoint: "/health",
      isRateLimited: false,
    });

    // Simulate the internal check failing (e.g., service is down)
    (validator as any).simulateServiceDown("UserService");

    const result = validator.validateService("UserService");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("is currently unavailable");
  });

  it("should return invalid result for non-existent service", () => {
    const validator = new ExternalServiceAvailabilityValidator();
    const result = validator.validateService("NonExistentService");
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Service not found");
  });
});
import { describe, it, expect } from "vitest";
import { WebhookValidator } from "../src/ingestion/external-event-ingestion-pipeline";

describe("WebhookValidator", () => {
  it("should return valid when all required fields are present", () => {
    const schema: ExternalEventSchema = {
      source: "test",
      event_type: "test",
      timestamp: 123,
      payload: {},
      required_fields: ["source", "event_type", "timestamp"],
    };
    const rawPayload: Record<string, unknown> = {
      source: "test",
      event_type: "test",
      timestamp: 123,
      extra_field: "data",
    };
    const validator = new WebhookValidator();
    const result = validator.validate(rawPayload, schema);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return invalid and list missing fields when required fields are missing", () => {
    const schema: ExternalEventSchema = {
      source: "test",
      event_type: "test",
      timestamp: 123,
      payload: {},
      required_fields: ["source", "event_type", "timestamp", "missing_field"],
    };
    const rawPayload: Record<string, unknown> = {
      source: "test",
      event_type: "test",
      timestamp: 123,
    };
    const validator = new WebhookValidator();
    const result = validator.validate(rawPayload, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: missing_field");
    expect(result.errors).toHaveLength(1);
  });

  it("should handle empty or non-object payloads gracefully", () => {
    const schema: ExternalEventSchema = {
      source: "test",
      event_type: "test",
      timestamp: 123,
      payload: {},
      required_fields: ["source"],
    };
    const rawPayload: Record<string, unknown> = {};
    const validator = new WebhookValidator();
    const result = validator.validate(rawPayload, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: source");
  });
});
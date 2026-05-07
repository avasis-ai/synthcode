import { describe, it, expect } from "vitest";
import { CapabilityConflictPredictor } from "../src/conflict/capability-conflict-predictor";

describe("CapabilityConflictPredictor", () => {
  it("should predict no conflict when capabilities are independent", () => {
    const predictor = new CapabilityConflictPredictor();
    const request1 = {
      capability: "read_user_profile",
      resource: "user:123",
      mode: "read",
      description: "Read user data",
    };
    const request2 = {
      capability: "read_product_catalog",
      resource: "product:all",
      mode: "read",
      description: "View products",
    };
    const conflict = predictor.predictConflict([request1, request2]);
    expect(conflict).toBeNull();
  });

  it("should predict a high conflict when conflicting capabilities are requested", () => {
    const predictor = new CapabilityConflictPredictor();
    const request1 = {
      capability: "write_user_settings",
      resource: "user:123",
      mode: "write",
      description: "Change settings",
    };
    const request2 = {
      capability: "delete_user_data",
      resource: "user:123",
      mode: "write",
      description: "Delete user",
    };
    const conflict = predictor.predictConflict([request1, request2]);
    expect(conflict).not.toBeNull();
    expect(conflict!.severity).toBe("high");
  });

  it("should predict a low conflict when overlapping but non-critical capabilities are requested", () => {
    const predictor = new CapabilityConflictPredictor();
    const request1 = {
      capability: "read_data",
      resource: "data:A",
      mode: "read",
      description: "Read general data",
    };
    const request2 = {
      capability: "read_data",
      resource: "data:A",
      mode: "read",
      description: "Read general data (redundant)",
    };
    const conflict = predictor.predictConflict([request1, request2]);
    expect(conflict).not.toBeNull();
    expect(conflict!.severity).toBe("low");
  });
});
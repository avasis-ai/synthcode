import { describe, it, expect } from "vitest";
import {
  StructuredToolOutputValidationContextEnricherV169AdvancedV3,
  IExternalStateSource,
  ITemporalSource,
  ICapabilityMetadataSource,
  ValidationContext,
} from "../src/validation/structured-tool-output-validation-context-enricher-v169-advanced-v3";

describe("StructuredToolOutputValidationContextEnricherV169AdvancedV3", () => {
  it("should enrich context with external state when available", async () => {
    const mockExternalState: IExternalStateSource = {
      getSnapshot: () => ({ user_id: "user123", theme: "dark" }),
    };
    const mockTemporalSource: ITemporalSource = {
      getCurrentTimestamp: () => Date.now(),
      getConstraintWindow: () => ({ start: 0, end: 1000000 }),
    };
    const mockCapabilitySource: ICapabilityMetadataSource = {
      getCapabilities: () => ({
        can_read_user_data: true,
      }),
    };
    const mockContext: ValidationContext = {
      messages: [],
      toolOutput: {},
      externalState: mockExternalState,
      temporalSource: mockTemporalSource,
      capabilityMetadataSource: mockCapabilitySource,
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedV3();
    const enrichedContext = await enricher.enrich(mockContext);

    expect(enrichedContext.externalState).toEqual({
      user_id: "user123",
      theme: "dark",
    });
    expect(enrichedContext.temporalSource).toBe(mockTemporalSource);
    expect(enrichedContext.capabilityMetadataSource).toBe(mockCapabilitySource);
  });

  it("should handle missing external state gracefully", async () => {
    const mockExternalState: IExternalStateSource = {
      getSnapshot: () => undefined,
    };
    const mockTemporalSource: ITemporalSource = {
      getCurrentTimestamp: () => Date.now(),
      getConstraintWindow: () => ({ start: 0, end: 1000000 }),
    };
    const mockCapabilitySource: ICapabilityMetadataSource = {
      getCapabilities: () => ({}),
    };
    const mockContext: ValidationContext = {
      messages: [],
      toolOutput: {},
      externalState: mockExternalState,
      temporalSource: mockTemporalSource,
      capabilityMetadataSource: mockCapabilitySource,
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedV3();
    const enrichedContext = await enricher.enrich(mockContext);

    expect(enrichedContext.externalState).toEqual({
      user_id: "user123",
      theme: "dark",
    }); // Assuming the implementation handles undefined snapshot by providing a default or the original structure
  });

  it("should correctly merge capability metadata", async () => {
    const mockExternalState: IExternalStateSource = {
      getSnapshot: () => ({}),
    };
    const mockTemporalSource: ITemporalSource = {
      getCurrentTimestamp: () => Date.now(),
      getConstraintWindow: () => ({ start: 0, end: 1000000 }),
    };
    const mockCapabilitySource: ICapabilityMetadataSource = {
      getCapabilities: () => ({
        can_read_user_data: true,
        can_execute_write: false,
      }),
    };
    const mockContext: ValidationContext = {
      messages: [],
      toolOutput: {},
      externalState: mockExternalState,
      temporalSource: mockTemporalSource,
      capabilityMetadataSource: mockCapabilitySource,
    };

    const enricher = new StructuredToolOutputValidationContextEnricherV169AdvancedV3();
    const enrichedContext = await enricher.enrich(mockContext);

    expect(enrichedContext.capabilityMetadataSource).toEqual({
      can_read_user_data: true,
      can_execute_write: false,
    });
  });
});
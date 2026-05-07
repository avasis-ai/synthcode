import { describe, it, expect } from "vitest";
import { FeasibilityValidator } from "../src/validation/feasibility-validator.js";
import { ToolCallContext, ToolDefinition } from "../src/types/synth-types.js";

describe("FeasibilityValidator", () => {
  it("should return feasible when budget and required tools are met", () => {
    const mockContext: ToolCallContext = {
      userQuery: "I need to book a flight and a hotel.",
      availableBudget: 1000,
      availableTools: [
        { name: "flight_booking", description: "Books flights.", parameters: {} },
        { name: "hotel_booking", description: "Books hotels.", parameters: {} },
      ],
    };
    const mockToolDefinition: ToolDefinition = {
      name: "trip_planner",
      description: "Plans a trip using flights and hotels.",
      requiredTools: ["flight_booking", "hotel_booking"],
      estimatedCost: 500,
    };

    const validator = new FeasibilityValidator(mockContext, mockToolDefinition);
    const report = validator.checkFeasibility();

    expect(report.isFeasible).toBe(true);
    expect(report.estimatedCost).toBe(500);
    expect(report.violationReasons).toEqual([]);
  });

  it("should report infeasibility due to insufficient budget", () => {
    const mockContext: ToolCallContext = {
      userQuery: "I need to book a flight and a hotel.",
      availableBudget: 100,
      availableTools: [
        { name: "flight_booking", description: "Books flights.", parameters: {} },
        { name: "hotel_booking", description: "Books hotels.", parameters: {} },
      ],
    };
    const mockToolDefinition: ToolDefinition = {
      name: "trip_planner",
      description: "Plans a trip using flights and hotels.",
      requiredTools: ["flight_booking", "hotel_booking"],
      estimatedCost: 500,
    };

    const validator = new FeasibilityValidator(mockContext, mockToolDefinition);
    const report = validator.checkFeasibility();

    expect(report.isFeasible).toBe(false);
    expect(report.estimatedCost).toBe(500);
    expect(report.violationReasons).toContain("Insufficient budget: Required cost exceeds available budget.");
  });

  it("should report infeasibility due to missing required tools", () => {
    const mockContext: ToolCallContext = {
      userQuery: "I need to book a flight and a hotel.",
      availableBudget: 1000,
      availableTools: [
        { name: "flight_booking", description: "Books flights.", parameters: {} },
      ],
    };
    const mockToolDefinition: ToolDefinition = {
      name: "trip_planner",
      description: "Plans a trip using flights and hotels.",
      requiredTools: ["flight_booking", "hotel_booking"],
      estimatedCost: 500,
    };

    const validator = new FeasibilityValidator(mockContext, mockToolDefinition);
    const report = validator.checkFeasibility();

    expect(report.isFeasible).toBe(false);
    expect(report.estimatedCost).toBe(500);
    expect(report.violationReasons).toContain("Missing required tool: hotel_booking");
  });
});
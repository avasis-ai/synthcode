import { describe, it, expect } from "vitest";
import { EnvironmentalConstraintFilter } from "../src/filter/environmental-constraint-filter";

describe("EnvironmentalConstraintFilter", () => {
  it("should return true if all required metrics are within their allowed thresholds", () => {
    const filter = new EnvironmentalConstraintFilter();
    const toolDefinition = {
      name: "toolA",
      description: "A tool that is fine",
      parameters: {},
      cost: 10,
      requiredMetrics: [
        { metricName: "cpu_usage", maxAllowedValue: 0.8 },
        { metricName: "memory_usage", maxAllowedValue: 0.9 },
      ],
    };
    const metrics = {
      cpu_usage: 0.7,
      memory_usage: 0.5,
    };
    expect(filter.isToolAllowed(toolDefinition, metrics)).toBe(true);
  });

  it("should return false if any required metric exceeds its allowed threshold", () => {
    const filter = new EnvironmentalConstraintFilter();
    const toolDefinition = {
      name: "toolB",
      description: "A tool that is too resource intensive",
      parameters: {},
      cost: 20,
      requiredMetrics: [
        { metricName: "cpu_usage", maxAllowedValue: 0.7 },
        { metricName: "memory_usage", maxAllowedValue: 0.9 },
      ],
    };
    const metrics = {
      cpu_usage: 0.8, // Exceeds 0.7
      memory_usage: 0.5,
    };
    expect(filter.isToolAllowed(toolDefinition, metrics)).toBe(false);
  });

  it("should handle missing metrics gracefully and return false", () => {
    const filter = new EnvironmentalConstraintFilter();
    const toolDefinition = {
      name: "toolC",
      description: "A tool requiring a missing metric",
      parameters: {},
      cost: 5,
      requiredMetrics: [
        { metricName: "cpu_usage", maxAllowedValue: 0.8 },
        { metricName: "disk_io", maxAllowedValue: 100 }, // Missing metric
      ],
    };
    const metrics = {
      cpu_usage: 0.5,
    };
    expect(filter.isToolAllowed(toolDefinition, metrics)).toBe(false);
  });
});
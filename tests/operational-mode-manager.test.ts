import { describe, it, expect, vi } from "vitest";
import { OperationalMode, ModeConfig, ModeContext } from "./operational-mode-manager";

describe("OperationalModeManager", () => {
  it("should correctly initialize and calculate mode parameters for LOW_LATENCY", () => {
    const config: ModeConfig = {
      description: "Low latency mode",
      latency_threshold_ms: 500,
      required_accuracy_score: 0.8,
      cost_multiplier: 1.2,
      tool_selection_weight_bias: { search: 0.5, calculator: 0.5 },
    };
    const context: ModeContext = {
      mode: OperationalMode.LOW_LATENCY,
      config: config,
    };

    const manager = new OperationalModeManager(context);
    expect(manager.getLatencyThreshold()).toBe(500);
    expect(manager.getCostMultiplier()).toBe(1.2);
    expect(manager.getToolSelectionWeightBias()).toEqual({ search: 0.5, calculator: 0.5 });
  });

  it("should correctly initialize and calculate mode parameters for MAX_ACCURACY", () => {
    const config: ModeConfig = {
      description: "High accuracy mode",
      latency_threshold_ms: 2000,
      required_accuracy_score: 0.95,
      cost_multiplier: 1.5,
      tool_selection_weight_bias: { search: 0.1, calculator: 0.9 },
    };
    const context: ModeContext = {
      mode: OperationalMode.MAX_ACCURACY,
      config: config,
    };

    const manager = new OperationalModeManager(context);
    expect(manager.getLatencyThreshold()).toBe(2000);
    expect(manager.getRequiredAccuracyScore()).toBe(0.95);
    expect(manager.getToolSelectionWeightBias()).toEqual({ search: 0.1, calculator: 0.9 });
  });

  it("should correctly initialize and calculate mode parameters for COST_SAVING", () => {
    const config: ModeConfig = {
      description: "Cost saving mode",
      latency_threshold_ms: 1000,
      required_accuracy_score: 0.7,
      cost_multiplier: 0.8,
      tool_selection_weight_bias: { search: 0.7, calculator: 0.3 },
    };
    const context: ModeContext = {
      mode: OperationalMode.COST_SAVING,
      config: config,
    };

    const manager = new OperationalModeManager(context);
    expect(manager.getLatencyThreshold()).toBe(1000);
    expect(manager.getCostMultiplier()).toBe(0.8);
    expect(manager.getRequiredAccuracyScore()).toBe(0.7);
  });
});
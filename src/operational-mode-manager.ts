import { EventEmitter } from "node:events";

export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface ModeConfig {
  description: string;
  latency_threshold_ms: number;
  required_accuracy_score: number;
  cost_multiplier: number;
  tool_selection_weight_bias: Record<string, number>;
}

export enum OperationalMode {
  LOW_LATENCY = "LOW_LATENCY",
  MAX_ACCURACY = "MAX_ACCURACY",
  COST_SAVING = "COST_SAVING",
}

export interface ModeContext {
  mode: OperationalMode;
  config: ModeConfig;
  is_high_rigor: boolean;
  is_speed_critical: boolean;
}

export class OperationalModeManager extends EventEmitter {
  private currentMode: OperationalMode;
  private modeConfigurations: Record<OperationalMode, ModeConfig>;

  constructor() {
    super();
    super.emit("initialized");
    this.modeConfigurations = {
      [OperationalMode.LOW_LATENCY]: {
        description: "Prioritizes speed and quick responses.",
        latency_threshold_ms: 500,
        required_accuracy_score: 0.7,
        cost_multiplier: 0.8,
        tool_selection_weight_bias: {
          "fast_api": 1.5,
          "complex_analysis": 0.5,
        },
      },
      [OperationalMode.MAX_ACCURACY]: {
        description: "Prioritizes correctness and thoroughness.",
        latency_threshold_ms: 5000,
        required_accuracy_score: 0.95,
        cost_multiplier: 1.2,
        tool_selection_weight_bias: {
          "fast_api": 1.0,
          "complex_analysis": 2.0,
        },
      },
      [OperationalMode.COST_SAVING]: {
        description: "Prioritizes minimizing operational expenditure.",
        latency_threshold_ms: 2000,
        required_accuracy_score: 0.85,
        cost_multiplier: 0.6,
        tool_selection_weight_bias: {
          "fast_api": 1.2,
          "complex_analysis": 0.8,
        },
      },
  };
  }

  public setMode(mode: OperationalMode): ModeContext {
    if (!Object.values(OperationalMode).includes(mode)) {
      throw new Error(`Invalid operational mode: ${mode}`);
    }

    const config = this.modeConfigurations[mode];
    this.currentMode = mode;
    super.emit("mode_changed", { mode, config });

    return this.createModeContext(mode, config);
  }

  public getCurrentMode(): OperationalMode {
    return this.currentMode;
  }

  private createModeContext(mode: OperationalMode, config: ModeConfig): ModeContext {
    const isSpeedCritical = mode === OperationalMode.LOW_LATENCY;
    const isHighRigor = mode === OperationalMode.MAX_ACCURACY;

    return {
      mode: mode,
      config: config,
      is_high_rigor: isHighRigor,
      is_speed_critical: isSpeedCritical,
    };
  }

  /**
   * Generates a derived context object based on the current mode.
   * This context should be passed to core execution functions (e.g., tool selection, validation).
   * @returns {ModeContext} The derived context.
   */
  public getModeContext(): ModeContext {
    if (!this.currentMode) {
      throw new Error("Operational mode has not been set. Call setMode() first.");
    }
    const config = this.modeConfigurations[this.currentMode];
    return this.createModeContext(this.currentMode, config);
  }
}

export { OperationalModeManager };
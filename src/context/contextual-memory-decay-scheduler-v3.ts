import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type DecayCurve = {
  name: string;
  calculateDecayFactor: (initialWeight: number, timeElapsed: number) => number;
};

export interface DecayRule {
  contextType: "user" | "assistant" | "tool";
  decayCurve: DecayCurve;
  decayThreshold: number;
}

export interface ContextEntry {
  message: Message;
  timestamp: number;
  initialWeight: number;
  decayedWeight: number;
}

export class ContextualMemoryDecaySchedulerV3 {
  private rules: DecayRule[];
  private decayCurves: Map<string, DecayCurve>;

  constructor(rules: DecayRule[], decayCurves: Map<string, DecayCurve>) {
    this.rules = rules;
    this.decayCurves = decayCurves;
  }

  private getCurve(rule: DecayRule): DecayCurve {
    const curve = this.decayCurves.get(rule.decayCurve.name);
    if (!curve) {
      throw new Error(`Decay curve "${rule.decayCurve.name}" not found.`);
    }
    return curve;
  }

  private calculateDecay(entry: ContextEntry, rule: DecayRule): number {
    const curve = this.getCurve(rule);
    const timeElapsed = Date.now() - entry.timestamp;
    const decayFactor = curve.calculateDecayFactor(entry.initialWeight, timeElapsed);
    return Math.max(0, entry.initialWeight * decayFactor);
  }

  public processContext(contextEntries: ContextEntry[]): ContextEntry[] {
    const updatedEntries: ContextEntry[] = [];

    for (const entry of contextEntries) {
      let maxDecayWeight = entry.initialWeight;
      let applicableRuleFound = false;

      for (const rule of this.rules) {
        if (rule.contextType === this.determineContextType(entry.message)) {
          applicableRuleFound = true;
          const decayedWeight = this.calculateDecay(entry, rule);
          if (decayedWeight > maxDecayWeight) {
            maxDecayWeight = decayedWeight;
          }
        }
      }

      if (!applicableRuleFound) {
        updatedEntries.push(entry);
        continue;
      }

      const newEntry: ContextEntry = {
        message: entry.message,
        timestamp: entry.timestamp,
        initialWeight: entry.initialWeight,
        decayedWeight: maxDecayWeight,
      };
      updatedEntries.push(newEntry);
    }

    return updatedEntries;
  }

  private determineContextType(message: Message): "user" | "assistant" | "tool" {
    if ("user" in message) return "user";
    if ("assistant" in message) return "assistant";
    if ("tool" in message) return "tool";
    throw new Error("Unknown message type");
  }

  public static createDefaultScheduler(): ContextualMemoryDecaySchedulerV3 {
    const defaultCurves = new Map<string, DecayCurve>();

    defaultCurves.set("exponential", {
      name: "exponential",
      calculateDecayFactor: (initialWeight: number, timeElapsed: number) => {
        const decayRate = 0.0001;
        return Math.exp(-decayRate * timeElapsed / 1000);
      },
    });

    defaultCurves.set("linear", {
      name: "linear",
      calculateDecayFactor: (initialWeight: number, timeElapsed: number) => {
        const decayRate = 0.00005;
        return Math.max(0, 1 - (decayRate * timeElapsed / 1000));
      },
    });

    const defaultRules: DecayRule[] = [
      {
        contextType: "user",
        decayCurve: { name: "exponential", calculateDecayFactor: (w, t) => 1 },
        decayThreshold: 0.1,
      },
      {
        contextType: "assistant",
        decayCurve: { name: "linear", calculateDecayFactor: (w, t) => 1 },
        decayThreshold: 0.05,
      },
      {
        contextType: "tool",
        decayCurve: { name: "exponential", calculateDecayFactor: (w, t) => 1 },
        decayThreshold: 0.2,
      },
    ];

    return new ContextualMemoryDecaySchedulerV3(defaultRules, defaultCurves);
  }
}
import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export type DecayWeight = number;

export interface DecayParameters {
  initialWeight: number;
  decayRate: number;
  timeFactor: number;
}

export class SemanticContextDecay {
  private parameters: DecayParameters;
  private decayHistory: Map<string, number>;

  constructor(parameters: DecayParameters) {
    this.parameters = parameters;
    this.decayHistory = new Map<string, number>();
  }

  private calculateDecayWeight(message: Message, timeElapsedSeconds: number): DecayWeight {
    const { decayRate, timeFactor } = this.parameters;
    const messageId = this.getUniqueMessageId(message);

    // Simple decay model: Weight = Initial * e^(-rate * time)
    // Incorporating time factor for more granular control
    const timeDecay = Math.exp(-decayRate * (timeElapsedSeconds / 1000));
    let weight = this.parameters.initialWeight * timeDecay;

    // Apply a slight boost based on interaction count (simulated by history map)
    const currentCount = this.decayHistory.get(messageId) || 1;
    weight *= (1 + currentCount * 0.01);

    return Math.max(0.1, weight); // Ensure weight doesn't drop too low
  }

  private getUniqueMessageId(message: Message): string {
    // A simple deterministic ID based on role and content hash for simulation
    const contentString = JSON.stringify(message);
    return `${message.role}:${btoa(contentString).substring(0, 10)}`;
  }

  public updateDecay(message: Message, timeElapsedSeconds: number): DecayWeight {
    const weight = this.calculateDecayWeight(message, timeElapsedSeconds);
    this.decayHistory.set(this.getUniqueMessageId(message), this.decayHistory.get(this.getUniqueMessageId(message)) || 0 + 1);
    return weight;
  }

  public decayContext(message: Message, timeElapsedSeconds: number): DecayWeight {
    return this.updateDecay(message, timeElapsedSeconds);
  }

  public adjustParameters(newParameters: Partial<DecayParameters>): void {
    this.parameters = {
      initialWeight: newParameters.initialWeight ?? this.parameters.initialWeight,
      decayRate: newParameters.decayRate ?? this.parameters.decayRate,
      timeFactor: newParameters.timeFactor ?? this.parameters.timeFactor,
    };
  }

  public getDecayWeight(message: Message): DecayWeight {
    // Default weight calculation if no time is provided (assuming immediate context)
    return this.calculateDecayWeight(message, 0);
  }
}
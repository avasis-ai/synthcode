import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ReputationScore {
  score: number;
  decayWeight: number;
  lastUpdated: number;
}

export interface AgentMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failureCount: number;
  contractAdherenceScore: number;
  conflictFrequency: number;
}

export class AgentReputationManager {
  private reputationScores: Map<string, ReputationScore>;
  private agentMetrics: Map<string, AgentMetrics>;
  private decayRate: number;

  constructor(initialDecayRate: number = 0.05) {
    this.reputationScores = new Map<string, ReputationScore>();
    this.agentMetrics = new Map<string, AgentMetrics>();
    this.decayRate = initialDecayRate;
  }

  private initializeAgent(agentId: string): void {
    if (!this.reputationScores.has(agentId)) {
      this.reputationScores.set(agentId, {
        score: 1.0,
        decayWeight: 1.0,
        lastUpdated: Date.now(),
      });
      this.agentMetrics.set(agentId, {
        totalAttempts: 0,
        successfulAttempts: 0,
        failureCount: 0,
        contractAdherenceScore: 1.0,
        conflictFrequency: 0,
      });
    }
  }

  private calculateDecay(agentId: string): void {
    const score = this.reputationScores.get(agentId)!;
    const timeElapsed = Date.now() - score.lastUpdated;
    const decayFactor = Math.pow(0.95, timeElapsed / 1000);
    
    const newScore = score.score * decayFactor;
    
    this.reputationScores.set(agentId, {
      score: newScore,
      decayWeight: score.decayWeight,
      lastUpdated: Date.now(),
    });
  }

  private updateMetrics(agentId: string, success: boolean, adherence: number, conflict: boolean): void {
    const metrics = this.agentMetrics.get(agentId)!;
    
    metrics.totalAttempts += 1;
    if (success) {
      metrics.successfulAttempts += 1;
    } else {
      metrics.failureCount += 1;
    }
    
    metrics.contractAdherenceScore = Math.max(0, metrics.contractAdherenceScore * 0.9 + adherence * 0.1);
    metrics.conflictFrequency = metrics.conflictFrequency + (conflict ? 1 : 0);

    this.agentMetrics.set(agentId, metrics);
  }

  public async recordEvent(agentId: string, success: boolean, adherence: number, conflict: boolean): Promise<ReputationScore> {
    this.initializeAgent(agentId);
    
    // 1. Apply decay before updating
    this.calculateDecay(agentId);

    // 2. Update underlying metrics
    this.updateMetrics(agentId, success, adherence, conflict);

    // 3. Calculate score adjustment
    let scoreAdjustment = 0;
    if (success) {
      scoreAdjustment += 0.1;
    } else {
      scoreAdjustment -= 0.15;
    }
    
    // Weighting factors
    scoreAdjustment += (adherence * 0.05);
    scoreAdjustment -= (conflict * 0.08);

    // 4. Apply adjustment to the current score
    const currentScore = this.reputationScores.get(agentId)!.score;
    const newScore = Math.max(0.1, currentScore + scoreAdjustment);

    this.reputationScores.set(agentId, {
      score: newScore,
      decayWeight: 1.0, // Simplified for this example
      lastUpdated: Date.now(),
    });

    return this.reputationScores.get(agentId)!;
  }

  public getReputation(agentId: string): ReputationScore | undefined {
    return this.reputationScores.get(agentId);
  }

  public getMetrics(agentId: string): AgentMetrics | undefined {
    return this.agentMetrics.get(agentId);
  }
}

export { AgentReputationManager };
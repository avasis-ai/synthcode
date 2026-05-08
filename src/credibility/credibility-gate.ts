import { Message, ToolResultMessage } from "./types.js";

type SourceAuthority = "High" | "Medium" | "Low" | "Unknown";
type DataAge = "Fresh" | "Stale" | "VeryStale";

export interface CredibilityScore {
  authorityScore: number;
  recencyScore: number;
  consensusScore: number;
  dataTypeScore: number;
  overallScore: number;
}

export interface CredibilityReport {
  score: CredibilityScore;
  isCredible: boolean;
  reasons: string[];
}

export interface DataPayload {
  data: Message | ToolResultMessage;
  metadata: {
    source: SourceAuthority;
    timestamp: Date;
    isConsensus: boolean;
    dataType: "text" | "tool" | "event";
  };
}

export class CredibilityGate {
  private readonly WEIGHTS = {
    authority: 0.4,
    recency: 0.3,
    consensus: 0.2,
    type: 0.1,
  };

  private getAuthorityScore(source: SourceAuthority): number {
    switch (source) {
      case "High":
        return 0.9;
      case "Medium":
        return 0.6;
      case "Low":
        return 0.3;
      case "Unknown":
      default:
        return 0.1;
    }
  }

  private getRecencyScore(timestamp: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 2) {
      return 1.0;
    } else if (diffHours < 24) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  private getConsensusScore(isConsensus: boolean): number {
    return isConsensus ? 0.95 : 0.5;
  }

  private getDataTypeScore(dataType: "text" | "tool" | "event"): number {
    switch (dataType) {
      case "text":
        return 0.8;
      case "tool":
        return 0.9;
      case "event":
      default:
        return 0.6;
    }
  }

  private calculateScore(payload: DataPayload): CredibilityScore {
    const authorityScore = this.getAuthorityScore(payload.metadata.source);
    const recencyScore = this.getRecencyScore(payload.metadata.timestamp);
    const consensusScore = this.getConsensusScore(payload.metadata.isConsensus);
    const dataTypeScore = this.getDataTypeScore(payload.metadata.dataType);

    const overallScore = (
      authorityScore * this.WEIGHTS.authority +
      recencyScore * this.WEIGHTS.recency +
      consensusScore * this.WEIGHTS.consensus +
      dataTypeScore * this.WEIGHTS.type
    );

    return {
      authorityScore: parseFloat(authorityScore.toFixed(2)),
      recencyScore: parseFloat(recencyScore.toFixed(2)),
      consensusScore: parseFloat(consensusScore.toFixed(2)),
      dataTypeScore: parseFloat(dataTypeScore.toFixed(2)),
      overallScore: parseFloat(overallScore.toFixed(2)),
    };
  }

  private generateReport(score: CredibilityScore, payload: DataPayload): CredibilityReport {
    const reasons: string[] = [];
    let isCredible = true;

    if (score.authorityScore < 0.5) {
      reasons.push("Low Authority: Source credibility is questionable.");
      isCredible = false;
    }
    if (score.recencyScore < 0.6) {
      reasons.push("Stale Data: Information is significantly old.");
      isCredible = false;
    }
    if (!payload.metadata.isConsensus) {
      reasons.push("Non-Consensus: Data lacks corroboration.");
      isCredible = false;
    }

    return {
      score: score,
      isCredible: isCredible,
      reasons: reasons,
    };
  }

  public validate(data: DataPayload): CredibilityReport {
    const score = this.calculateScore(data);
    return this.generateReport(score, data);
  }
}

export { CredibilityGate };
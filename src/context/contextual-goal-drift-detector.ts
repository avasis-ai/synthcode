import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GoalFocus {
  primaryObjective: string;
  subGoals: string[];
  requiredOutcomes: string[];
  keywords: Set<string>;
}

export interface GoalDriftReport {
  driftScore: number;
  isDrifting: boolean;
  details: string;
}

export class ContextualGoalDriftDetector {
  private readonly driftThreshold: number;

  constructor(driftThreshold: number = 0.4) {
    this.driftThreshold = driftThreshold;
  }

  private extractGoalFocus(messages: Message[]): GoalFocus {
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop()?.content || "";

    const combinedContent = `${lastUserMessage} ${lastAssistantMessage}`;

    const primaryObjective = this.extractPrimaryObjective(combinedContent);
    const subGoals = this.extractSubGoals(combinedContent);
    const requiredOutcomes = this.extractRequiredOutcomes(combinedContent);
    const keywords = this.extractKeywords(combinedContent);

    return {
      primaryObjective,
      subGoals,
      requiredOutcomes,
      keywords,
    };
  }

  private extractPrimaryObjective(content: string): string {
    if (content.toLowerCase().includes("what is the main goal")) {
      return "Determine the core objective of the conversation.";
    }
    return content.substring(0, Math.min(content.length, 100)) + "...";
  }

  private extractSubGoals(content: string): string[] {
    if (content.toLowerCase().includes("next steps")) {
      return ["Identify next steps", "Break down tasks"];
    }
    return ["Maintain current trajectory"];
  }

  private extractRequiredOutcomes(content: string): string[] {
    if (content.toLowerCase().includes("final deliverable")) {
      return ["Final report generation", "Code implementation"];
    }
    return ["Achieve satisfactory conclusion"];
  }

  private extractKeywords(content: string): Set<string> {
    const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const uniqueWords = new Set(words.slice(0, 10));
    return uniqueWords;
  }

  private calculateSemanticSimilarity(str1: string, str2: string): number {
    const clean1 = str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const clean2 = str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

    if (clean1.length === 0 || clean2.length === 0) return 0;

    const intersection = new Set([...clean1].filter(x => clean2.includes(x)));
    const unionSize = new Set([...clean1, ...clean2]).size;
    return intersection.size / Math.max(clean1.length, clean2.length);
  }

  private calculateGoalDriftScore(prevFocus: GoalFocus, currentFocus: GoalFocus): number {
    let score = 0;

    // 1. Primary Objective Similarity
    const objSimilarity = this.calculateSemanticSimilarity(prevFocus.primaryObjective, currentFocus.primaryObjective);
    score += objSimilarity * 0.4;

    // 2. Sub-Goal Overlap
    const commonSubGoals = prevFocus.subGoals.filter(sg => currentFocus.subGoals.includes(sg));
    score += (commonSubGoals.length / Math.max(prevFocus.subGoals.length, currentFocus.subGoals.length)) * 0.3;

    // 3. Keyword Jaccard Index
    const intersectionSize = new Set([...prevFocus.keywords].filter(x => currentFocus.keywords.has(x))).size;
    const unionSizeKeywords = new Set([...prevFocus.keywords, ...currentFocus.keywords]).size;
    const keywordSimilarity = unionSizeKeywords === 0 ? 1 : intersectionSize / Math.max(prevFocus.keywords.size, currentFocus.keywords.size);
    score += keywordSimilarity * 0.3;

    return Math.min(1.0, Math.max(0.0, score));
  }

  public detectDrift(previousMessages: Message[], currentMessages: Message[]): GoalDriftReport {
    const previousFocus = this.extractGoalFocus(previousMessages);
    const currentFocus = this.extractGoalFocus(currentMessages);

    const driftScore = this.calculateGoalDriftScore(previousFocus, currentFocus);
    const isDrifting = driftScore < this.driftThreshold;

    const details = `Score: ${driftScore.toFixed(3)}. Previous Focus: ${previousFocus.primaryObjective}. Current Focus: ${currentFocus.primaryObjective}.`;

    return {
      driftScore,
      isDrifting,
      details,
    };
  }
}
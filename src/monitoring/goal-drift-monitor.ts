import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface GoalDriftReport {
  score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  driftPoints: string[];
  summary: string;
}

export class AgentGoalDriftMonitor {
  private readonly GOAL_KEYWORDS_WEIGHT: number = 0.3;
  private readonly ENTITY_DIVERGENCE_WEIGHT: number = 0.4;
  private readonly TOPIC_SHIFT_WEIGHT: number = 0.3;

  private extractKeywords(text: string): Set<string> {
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const stopWords = new Set(["the", "a", "an", "is", "are", "and", "to", "of", "in", "it"]);
    return new Set(words.filter(word => !stopWords.has(word)));
  }

  private extractEntities(text: string): Set<string> {
    // Simplified entity extraction: assume capitalized words or specific patterns
    const matches = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*|[0-9]{2,}/g) || [];
    return new Set(matches.map(e => e.toLowerCase()));
  }

  private extractKeywordsFromContext(context: UserMessage | AssistantMessage | ToolResultMessage): Set<string> {
    let textContent: string = "";
    if ("content" in context) {
      if (Array.isArray(context.content)) {
        context.content.forEach((block: ContentBlock) => {
          if (block.type === "text" && "text" in block) {
            textContent += block.text + " ";
          } else if (block.type === "thinking" && "thinking" in block) {
            textContent += block.thinking + " ";
          }
        });
      } else if (typeof context.content === "string") {
        textContent = context.content;
      }
    }
    return this.extractKeywords(textContent);
  }

  private calculateDriftScore(initialKeywords: Set<string>, initialEntities: Set<string>, currentKeywords: Set<string>, currentEntities: Set<string>): { score: number; points: string[] } {
    const driftPoints: string[] = [];
    let totalScore = 0;

    // 1. Keyword Drift Score
    const missingKeywords = Array.from(initialKeywords).filter(kw => !currentKeywords.has(kw));
    const keywordDriftScore = missingKeywords.length * this.GOAL_KEYWORDS_WEIGHT;
    totalScore += keywordDriftScore;
    if (missingKeywords.length > 0) {
      driftPoints.push(`Missing goal keywords: ${[...new Set(missingKeywords)].join(', ')}`);
    }

    // 2. Entity Divergence Score
    const initialEntitySet = new Set(Array.from(initialEntities));
    const currentEntitySet = new Set(Array.from(currentEntities));
    const unrelatedEntities = Array.from(currentEntitySet).filter(ce => !initialEntitySet.has(ce) && ce.length > 2);
    const entityDriftScore = unrelatedEntities.length * this.ENTITY_DIVERGENCE_WEIGHT;
    totalScore += entityDriftScore;
    if (unrelatedEntities.length > 0) {
      driftPoints.push(`Introduced unrelated entities: ${[...new Set(unrelatedEntities)].join(', ')}`);
    }

    // 3. Topic Shift (Simple proxy: ratio of unique words)
    const initialWordCount = new Set([...initialKeywords, ...Array.from(initialEntities)]);
    const currentWordCount = new Set([...currentKeywords, ...Array.from(currentEntities)]);
    const uniqueNewTopics = Array.from(currentWordCount).filter(cw => !initialWordCount.has(cw) && cw.length > 2);
    const topicShiftScore = Math.min(uniqueNewTopics.length * 0.1, 1.0); // Cap contribution
    totalScore += topicShiftScore;
    if (uniqueNewTopics.length > 0) {
      driftPoints.push(`Significant topic shift detected (new concepts): ${[...new Set(uniqueNewTopics)].slice(0, 3).join(', ')}...`);
    }

    return { score: Math.min(totalScore, 5.0), points: driftPoints };
  }

  monitor(initialContext: UserMessage | AssistantMessage | ToolResultMessage, currentContext: UserMessage | AssistantMessage | ToolResultMessage): GoalDriftReport {
    const initialKeywords = this.extractKeywordsFromContext(initialContext);
    const initialEntities = new Set<string>();
    
    // For simplicity, we'll use the initial user message content as the primary source for initial entities/keywords
    const initialText = initialContext.content ? (Array.isArray(initialContext.content) ? initialContext.content.map(c => (c as TextBlock)).find(c => c.type === 'text')?.text || "" : (initialContext as any).content || "") : "";
    
    initialEntities.add(...Array.from(this.extractEntities(initialText)));

    const currentKeywords = this.extractKeywordsFromContext(currentContext);
    const currentEntities = new Set<string>();
    const currentText = currentContext.content ? (Array.isArray(currentContext.content) ? currentContext.content.map(c => (c as TextBlock)).find(c => c.type === 'text')?.text || "" : (currentContext as any).content || "") : "";
    
    currentEntities.add(...Array.from(this.extractEntities(currentText)));

    const { score: rawScore, points: driftPoints } = this.calculateDriftScore(
      initialKeywords,
      initialEntities,
      currentKeywords,
      currentEntities
    );

    let severity: "Low" | "Medium" | "High" | "Critical" = "Low";
    if (rawScore >= 4.0) {
      severity = "Critical";
    } else if (rawScore >= 2.5) {
      severity = "High";
    } else if (rawScore >= 1.0) {
      severity = "Medium";
    }

    const summary = `Goal drift detected. Score ${rawScore.toFixed(2)} suggests ${severity} deviation from the initial intent.`;

    return {
      score: parseFloat(rawScore.toFixed(2)),
      severity: severity,
      driftPoints: driftPoints,
      summary: summary,
    };
  }
}
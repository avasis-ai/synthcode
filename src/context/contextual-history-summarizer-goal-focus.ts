import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GoalFocus = {
  goal: string;
  keywords: string[];
};

interface ContextualSummarizerOptions {
  history: Message[];
  goalFocus: GoalFocus;
  llmPromptTemplate: (goalFocus: GoalFocus, history: Message[]) => string;
}

export class ContextualHistorySummarizer {
  private readonly scoringWeight: number;

  constructor(scoringWeight: number = 0.6) {
    this.scoringWeight = scoringWeight;
  }

  private scoreChunk(chunk: Message, goalFocus: GoalFocus): number {
    const contentText = chunk.role === "user" ? chunk.content : (chunk as any).content;
    if (!contentText || typeof contentText !== 'string') {
      return 0;
    }

    let score = 0;
    const lowerGoal = goalFocus.goal.toLowerCase();
    const lowerKeywords = goalFocus.keywords.map(k => k.toLowerCase());
    const lowerContent = contentText.toLowerCase();

    // 1. Goal relevance score
    if (lowerContent.includes(lowerGoal)) {
      score += 0.5;
    }

    // 2. Keyword matching score
    let keywordMatches = 0;
    for (const keyword of lowerKeywords) {
      if (lowerContent.includes(keyword)) {
        keywordMatches++;
      }
    }
    score += keywordMatches * 0.2;

    // Simple heuristic: more recent messages might be slightly more relevant if goal is vague
    const historyLength = 10; // Assume a context window size for relative scoring
    const index = this.getHistoryIndex(chunk, historyLength);
    score += (historyLength - index) * 0.05;

    return Math.min(1.0, score);
  }

  private getHistoryIndex(chunk: Message, maxIndex: number): number {
    // Placeholder: In a real system, we'd need the index from the calling context.
    // For this implementation, we assume the scoring happens sequentially or we use a simplified model.
    return 0;
  }

  private reRankHistory(history: Message[], goalFocus: GoalFocus): Message[] {
    const scoredChunks: { chunk: Message; score: number }[] = [];

    for (const chunk of history) {
      const score = this.scoreChunk(chunk, goalFocus);
      scoredChunks.push({ chunk, score });
    }

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // Simple re-ranking: Keep the top N chunks, or use a weighted mix.
    // For simplicity, we return the original history, but conceptually, we'd filter/weight here.
    // Here, we just return the original history, but the scoring mechanism is the core feature.
    return history;
  }

  public summarize(options: ContextualSummarizerOptions): string {
    const { history, goalFocus, llmPromptTemplate } = options;

    // 1. Re-rank context based on goal focus
    const relevantHistory = this.reRankHistory(history, goalFocus);

    // 2. Generate the final prompt
    const prompt = llmPromptTemplate(goalFocus, relevantHistory);

    // 3. Simulate LLM call (In a real scenario, this calls an API)
    console.log("--- Generated Prompt for LLM ---");
    console.log(prompt);
    console.log("--------------------------------");

    // Mock LLM response based on the prompt structure
    return `[AI Summary Focused on "${goalFocus.goal}"]: Based on the context provided, the key takeaways relevant to achieving ${goalFocus.goal} are: 1. [Summary Point 1 related to goal]. 2. [Summary Point 2 related to goal]. The overall trajectory suggests progress towards the objective.`;
  }
}
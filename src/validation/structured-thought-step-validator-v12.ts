import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ValidatorContext {
  history: Message[];
  currentThought: string;
  nextAction: { type: "tool_call"; tool_name: string; input: Record<string, unknown> } | { type: "query"; query: string };
}

export class StructuredThoughtStepValidatorV12 {
  private context: ValidatorContext;

  constructor(context: ValidatorContext) {
    this.context = context;
  }

  private extractMentionedTools(thought: string): string[] {
    const toolRegex = /(tool name|function name):?\s*([a-zA-Z0-9_]+)/g;
    const matches = [...thought.matchAll(toolRegex)];
    return matches.map(match => match[2]);
  }

  private extractMissingInfoKeywords(thought: string): string[] {
    const keywords = ["missing information", "need more context", "clarification needed"];
    const foundKeywords: string[] = [];
    for (const keyword of keywords) {
      if (thought.toLowerCase().includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
    return foundKeywords;
  }

  private checkToolCoherence(): boolean {
    const mentionedTools = this.extractMentionedTools(this.context.currentThought);
    const nextAction = this.context.nextAction;

    if (mentionedTools.length > 0 && nextAction.type !== "tool_call") {
      return false;
    }
    if (nextAction.type === "tool_call" && !mentionedTools.includes(nextAction.tool_name)) {
      return false;
    }
    return true;
  }

  private checkQueryCoherence(): boolean {
    const missingInfo = this.extractMissingInfoKeywords(this.context.currentThought);
    const nextAction = this.context.nextAction;

    if (missingInfo.length > 0 && nextAction.type !== "query") {
      return false;
    }
    if (nextAction.type === "query" && missingInfo.length === 0) {
      return false;
    }
    return true;
  }

  private calculateCoherenceScore(): number {
    let score = 1.0;

    // Base score adjustment based on context length
    const historyLength = this.context.history.length;
    score *= Math.min(1.0, 0.1 + (historyLength * 0.05));

    // Tool/Query alignment check
    const toolCoherent = this.checkToolCoherence();
    const queryCoherent = this.checkQueryCoherence();

    if (!toolCoherent && !queryCoherent) {
      score *= 0.5;
    } else if (!toolCoherent || !queryCoherent) {
      score *= 0.8;
    }

    // Content density check (simple proxy)
    const thoughtLength = this.context.currentThought.length;
    const contextLength = this.context.history.reduce((acc, msg) => acc + msg.content.length, 0);
    score += Math.min(0.2, thoughtLength / 500);

    return Math.max(0.0, Math.min(1.0, score));
  }

  validate(): { isValid: boolean; score: number; failures: string[] } {
    const failures: string[] = [];

    if (!this.checkToolCoherence()) {
      failures.push("Logical inconsistency: Thought mentions tools, but next action is not a tool call, or vice versa.");
    }

    if (!this.checkQueryCoherence()) {
      failures.push("Logical inconsistency: Thought suggests missing info, but next action is not a query, or vice versa.");
    }

    const isValid = failures.length === 0;

    return {
      isValid,
      score: this.calculateCoherenceScore(),
      failures,
    };
  }
}
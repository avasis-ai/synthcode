import {
  Message,
  ContentBlock,
  ThinkingBlock,
  TextBlock,
  ToolUseBlock,
} from "./types";

export interface ThoughtEntry {
  type: "thought";
  reasoning: string;
  plan?: string;
  self_correction?: string;
}

export class StructuredThoughtLogger {
  private thoughts: ThoughtEntry[] = [];

  public recordThought(thought: ThoughtEntry): void {
    this.thoughts.push(thought);
  }

  public getThoughts(): ThoughtEntry[] {
    return [...this.thoughts];
  }

  public clearThoughts(): void {
    this.thoughts = [];
  }

  public processAndSerialize(currentThoughts: ThoughtEntry[]): ContentBlock[] {
    const thinkingBlocks: ContentBlock[] = currentThoughts.map((thought) => ({
      type: "thinking",
      thinking: this.formatThought(thought),
    }));
    return thinkingBlocks;
  }

  private formatThought(thought: ThoughtEntry): string {
    let output = `[Reasoning]: ${thought.reasoning}\n`;
    if (thought.plan) {
      output += `[Plan]: ${thought.plan}\n`;
    }
    if (thought.self_correction) {
      output += `[Self-Correction]: ${thought.self_correction}\n`;
    }
    return output.trim();
  }
}

export const createThoughtLogger = (): StructuredThoughtLogger => {
  return new StructuredThoughtLogger();
};
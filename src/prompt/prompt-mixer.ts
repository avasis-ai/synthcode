import { Message, ContentBlock, TextBlock } from "./types";

export interface PromptSource {
  content: string;
  weight: number;
  priority: number;
}

export class PromptMixer {
  private sources: PromptSource[];

  constructor(sources: PromptSource[]) {
    this.sources = sources;
  }

  private getWeightedContent(source: PromptSource): string {
    if (source.weight <= 0) {
      return "";
    }
    // Simple weighted blending: repeat the content based on weight, or scale it.
    // Since weights are 0.0 to 1.0, we use a multiplier effect.
    // For simplicity, we'll use a structured prefix/suffix based on weight.
    const weightFactor = Math.max(0.1, source.weight * 10);
    return `[Weight:${source.weight.toFixed(2)}][P:${source.priority}] ${source.content.repeat(Math.floor(weightFactor))}`;
  }

  /**
   * Blends multiple prompt sources into a single, coherent prompt payload.
   * Sources are processed first by priority (highest first), then blended by weight.
   * @returns A single, optimized prompt string.
   */
  public blendPrompts(): string {
    // 1. Sort sources: Highest priority first, then by weight (descending).
    const sortedSources = [...this.sources].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.weight - a.weight;
    });

    let blendedContent = "";

    // 2. Process sources in order
    for (const source of sortedSources) {
      if (source.weight === 0 && source.priority < 1) {
        continue;
      }

      const weightedSegment = this.getWeightedContent(source);

      if (blendedContent.length > 0) {
        blendedContent += "\n\n---\n\n";
      }

      blendedContent += `\n[--- START SOURCE (P:${source.priority}, W:${source.weight.toFixed(2)}) ---\n${weightedSegment}\n[--- END SOURCE ---]`;
    }

    return blendedContent.trim();
  }

  /**
   * Generates a structured array of ContentBlocks representing the final prompt.
   * This is useful for APIs that prefer structured input over raw strings.
   * @returns An array of ContentBlocks.
   */
  public generateStructuredPayload(): ContentBlock[] {
    const sortedSources = [...this.sources].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.weight - a.weight;
    });

    const blocks: ContentBlock[] = [];

    for (const source of sortedSources) {
      if (source.weight === 0 && source.priority < 1) {
        continue;
      }

      const block: ContentBlock = {
        type: "text",
        text: `\n[--- START SOURCE (P:${source.priority}, W:${source.weight.toFixed(2)}) ---\n${source.content}\n[--- END SOURCE ---]`,
      };
      blocks.push(block);
    }

    return blocks;
  }
}
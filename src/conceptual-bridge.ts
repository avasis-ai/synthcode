import { Message, ContentBlock, TextBlock } from "./types.js";

type ConceptMap = Record<string, string>;

export interface BridgeRule {
  sourceToTarget: ConceptMap;
  relationshipType: string;
}

export class ConceptualBridge {
  private rules: BridgeRule[];

  constructor(rules: BridgeRule[]) {
    this.rules = rules;
  }

  private applyMapping(text: string): string {
    let normalizedText = text;
    for (const rule of this.rules) {
      for (const [source, target] of Object.entries(rule.sourceToTarget)) {
        const regex = new RegExp(source, 'gi');
        normalizedText = normalizedText.replace(regex, `[${target}]`);
      }
    }
    return normalizedText;
  }

  private normalizeChunk(chunk: string): TextBlock {
    const normalizedText = this.applyMapping(chunk);
    return { type: "text", text: normalizedText };
  }

  mapContext(contextChunks: string[]): TextBlock[] {
    if (!contextChunks || contextChunks.length === 0) {
      return [];
    }

    const normalizedBlocks: TextBlock[] = contextChunks.map(chunk => {
      return this.normalizeChunk(chunk);
    });

    return normalizedBlocks;
  }
}

export { ConceptualBridge };
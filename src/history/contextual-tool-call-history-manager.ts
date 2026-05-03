import { Message, ToolUseBlock, TextBlock } from "./types";

interface ToolCallRecord {
  toolName: string;
  inputs: Record<string, unknown>;
  output: string;
  timestamp: number;
}

export class ContextualToolCallHistoryManager {
  private history: ToolCallRecord[];
  private readonly similarityThreshold: number;

  constructor(
    initialHistory: ToolCallRecord[] = [],
    similarityThreshold: number = 0.8
  ) {
    this.history = [...initialHistory];
    this.similarityThreshold = similarityThreshold;
  }

  addRecord(record: ToolCallRecord): void {
    this.history.push(record);
  }

  private calculateSimilarity(recordA: ToolCallRecord, recordB: ToolCallRecord): number {
    const inputSimilarity = this.calculateInputSimilarity(recordA.inputs, recordB.inputs);
    const outputSimilarity = this.calculateOutputSimilarity(recordA.output, recordB.output);

    // Simple weighted average for demonstration. In a real system, this would use embeddings.
    return (inputSimilarity * 0.6 + outputSimilarity * 0.4).toFixed(2) as unknown as number;
  }

  private calculateInputSimilarity(inputsA: Record<string, unknown>, inputsB: Record<string, unknown>): number {
    const keysA = Object.keys(inputsA);
    const keysB = Object.keys(inputsB);
    let matchCount = 0;
    let totalWeight = 0;

    for (const key of keysA) {
      if (key in inputsB) {
        const valA = inputsA[key];
        const valB = inputsB[key];
        if (typeof valA === 'string' && typeof valB === 'string') {
          if (valA.toLowerCase() === valB.toLowerCase()) {
            matchCount++;
            totalWeight += 1;
          }
        }
      }
    }
    return totalWeight > 0 ? (matchCount / totalWeight) * 1.0 : 0.0;
  }

  private calculateOutputSimilarity(outputA: string, outputB: string): number {
    if (!outputA || !outputB) return 0.0;
    const lowerA = outputA.toLowerCase();
    const lowerB = outputB.toLowerCase();
    let matches = 0;
    let maxLength = Math.max(lowerA.length, lowerB.length);

    for (let i = 0; i < maxLength; i++) {
      if (lowerA[i] === lowerB[i]) {
        matches++;
      }
    }
    return matches / maxLength;
  }

  public detectRedundancies(): {
    redundantCalls: {
      index: number;
      record: ToolCallRecord;
      similarity: number;
      comparedWithIndex: number;
    }[];
    summary: string;
  } {
    const redundancies: {
      index: number;
      record: ToolCallRecord;
      similarity: number;
      comparedWithIndex: number;
    }[] = [];

    for (let i = 0; i < this.history.length; i++) {
      for (let j = i + 1; j < this.history.length; j++) {
        const recordA = this.history[i];
        const recordB = this.history[j];
        const similarity = this.calculateSimilarity(recordA, recordB);

        if (similarity >= this.similarityThreshold) {
          redundancies.push({
            index: j,
            record: recordB,
            similarity: similarity,
            comparedWithIndex: i,
          });
        }
      }
    }

    let summary = "";
    if (redundancies.length > 0) {
      summary = `Detected ${Math.ceil(redundancies.length / 2)} potential redundant tool calls based on similarity threshold (${this.similarityThreshold}). Review the flagged calls for potential optimization.`;
    } else {
      summary = "No significant tool call redundancies detected in the current history.";
    }

    return {
      redundantCalls: redundancies,
      summary: summary,
    };
  }

  public generatePrunedContext(maxSize: number): {
    prunedHistory: ToolCallRecord[];
    summary: string;
  } {
    if (this.history.length <= maxSize) {
      return {
        prunedHistory: [...this.history],
        summary: "History size is within the allowed context window limit.",
      };
    }

    const { redundantCalls } = this.detectRedundancies();
    let prunedRecords: ToolCallRecord[] = [];
    const seenIndices = new Set<number>();

    // Simple pruning strategy: Keep the first occurrence and summarize subsequent highly similar ones.
    for (let i = 0; i < this.history.length; i++) {
      let isRedundant = false;
      for (const redundancy of redundantCalls) {
        if (redundancy.index === i && !seenIndices.has(redundancy.comparedWithIndex)) {
          isRedundant = true;
          break;
        }
      }

      if (isRedundant && !seenIndices.has(this.history.findIndex(r => r === this.history[i]))) {
        // Skip adding the redundant record, assuming the earlier one covers it.
        continue;
      }

      prunedRecords.push(this.history[i]);
      seenIndices.add(i);
    }

    // Ensure we don't exceed size, though the logic above should handle it by skipping.
    const finalPrunedHistory = prunedRecords.slice(0, maxSize);

    let summary = `History pruned from ${this.history.length} to ${finalPrunedHistory.length} records to fit context window (${maxSize}). Redundancies were summarized or removed.`;

    return {
      prunedHistory: finalPrunedHistory,
      summary: summary,
    };
  }
}
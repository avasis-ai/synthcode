import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type AlternativeEvaluation = {
  score: number;
  reason: string;
  details?: Record<string, unknown>;
};

export type DecisionContext = Record<string, AlternativeEvaluation>;

export class DecisionPathRecorder {
  private context: DecisionContext;
  private decisionId: string;

  constructor(decisionId: string) {
    this.decisionId = decisionId;
    this.context = {};
  }

  recordAlternative(alternativeName: string, evaluation: AlternativeEvaluation): this {
    if (typeof alternativeName !== 'string' || alternativeName.trim() === '') {
      throw new Error("Alternative name must be a non-empty string.");
    }
    if (typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 1) {
      throw new Error("Score must be a number between 0 and 1.");
    }
    this.context[alternativeName] = { ...evaluation };
    return this;
  }

  recordDecision(selectedAlternative: string, rationale: string): DecisionPathRecorder {
    if (!this.context[selectedAlternative]) {
      throw new Error(`Selected alternative '${selectedAlternative}' was not recorded in the context.`);
    }

    const finalContext: DecisionContext = {
      ...this.context,
      [selectedAlternative]: {
        ...this.context[selectedAlternative],
        reason: `${this.context[selectedAlternative].reason} | SELECTED: ${rationale}`,
      },
    };

    // Overwrite the context with the final, enriched version
    this.context = finalContext;
    return this;
  }

  /**
   * Serializes the recorded decision path into a structured object for history storage.
   * @returns {object} The structured decision path record.
   */
  serializePath(): {
    decisionId: string;
    timestamp: number;
    context: DecisionContext;
    selectedPath: string | null;
    rationale: string | null;
  } {
    const selectedPath = Object.keys(this.context).reduce((best, key) => {
      const score = this.context[key].score;
      return (score > (best ? this.context[best].score : -1)) ? key : best;
    }, null);

    return {
      decisionId: this.decisionId,
      timestamp: Date.now(),
      context: this.context,
      selectedPath: selectedPath,
      rationale: this.context[selectedPath]?.reason || null,
    };
  }

  /**
   * Clears the recorded context, useful if the decision process needs to restart.
   */
  reset(): this {
    this.context = {};
    return this;
  }
}
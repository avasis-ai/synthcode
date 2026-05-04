import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CausalLink {
  sourceEventId: string;
  targetEventId: string;
  causalStrength: number;
  description: string;
}

export interface StateDiff {
  isMeaningful: boolean;
  diffDetails: Record<string, any>;
  reason: string;
}

export class CausalDiffCalculator {
  private previousState: any;
  private currentState: any;
  private causalLinks: CausalLink[];

  constructor(previousState: any, currentState: any, causalLinks: CausalLink[]) {
    this.previousState = previousState;
    this.currentState = currentState;
    this.causalLinks = causalLinks;
  }

  private calculateSimpleDiff(prevState: any, currState: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(prevState), ...Object.keys(currState)]);

    for (const key of keys) {
      if (typeof prevState[key] === 'object' && prevState[key] !== null && typeof currState[key] === 'object' && currState[key] !== null) {
        if (Array.isArray(prevState[key]) && Array.isArray(currState[key])) {
          if (prevState[key].length !== currState[key].length) {
            diff[key] = { type: "array_length_change", oldLength: prevState[key].length, newLength: currState[key].length };
          } else if (prevState[key].some((item: any) => JSON.stringify(item) !== JSON.stringify(currState[key].find((item: any) => JSON.stringify(item) === JSON.stringify(item)))) {
            diff[key] = { type: "array_content_change", changed: true };
          }
        } else if (typeof prevState[key] !== 'object' || typeof currState[key] !== 'object') {
          if (prevState[key] !== currState[key]) {
            diff[key] = { type: "primitive_change", oldValue: prevState[key], newValue: currState[key] };
          }
        }
      } else if (prevState[key] !== currState[key]) {
        diff[key] = { type: "primitive_change", oldValue: prevState[key], newValue: currState[key] };
      }
    }
    return diff;
  }

  public calculateDiff(): StateDiff {
    const simpleDiff = this.calculateSimpleDiff(this.previousState, this.currentState);

    if (this.causalLinks.length === 0) {
      return {
        isMeaningful: Object.keys(simpleDiff).length > 0,
        diffDetails: simpleDiff,
        reason: "No causal links provided; relying on simple structural comparison.",
      };
    }

    const strongestLink = this.causalLinks.reduce((acc, link) => 
      link.causalStrength > acc.causalStrength ? link : acc
    );

    if (strongestLink.causalStrength > 0.8) {
      return {
        isMeaningful: true,
        diffDetails: {
          causal_link: strongestLink,
          summary: `Change is strongly linked to event ${strongestLink.sourceEventId} via ${strongestLink.description}.`,
          raw_diff: simpleDiff,
        },
        reason: `Meaningful change detected due to strong causal link (${strongestLink.description}).`,
      };
    } else if (simpleDiff && Object.keys(simpleDiff).length > 0) {
      return {
        isMeaningful: true,
        diffDetails: {
          causal_link: strongestLink,
          summary: "Minor change detected, but context suggests it might be redundant or expected.",
          raw_diff: simpleDiff,
        },
        reason: "Simple structural changes detected, but causal links are weak, suggesting potential redundancy.",
      };
    } else {
      return {
        isMeaningful: false,
        diffDetails: {},
        reason: "No significant structural or causal changes detected.",
      };
    }
  }
}

export function calculateContextualDiff(
  previousState: any,
  currentState: any,
  causalLinks: CausalLink[]
): StateDiff {
  const calculator = new CausalDiffCalculator(previousState, currentState, causalLinks);
  return calculator.calculateDiff();
}
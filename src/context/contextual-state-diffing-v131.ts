import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface CausalLink {
  sourceStepId: string;
  causalActionType: string;
}

interface CausalDiffReport {
  path: string;
  diff: any;
  causalContext: CausalLink | null;
}

export class ContextualStateDiffer {
  private readonly initialLinks: CausalLink[] = [];

  constructor() {}

  public setInitialLinks(links: CausalLink[]): void {
    this.initialLinks.push(...links);
  }

  public calculateCausalDiff(
    prevState: any,
    nextState: any,
    causalLinks: CausalLink[]
  ): CausalDiffReport[] {
    const allLinks = [...this.initialLinks, ...causalLinks];
    const reports: CausalDiffReport[] = [];

    const diffRecursive = (
      path: string,
      prev: any,
      next: any,
      currentLinks: CausalLink[]
    ): void => {
      if (typeof prev !== typeof next) {
        reports.push({
          path,
          diff: { type: "TYPE_CHANGE", from: typeof prev, to: typeof next },
          causalContext: currentLinks[currentLinks.length - 1] || null,
        });
        return;
      }

      if (typeof prev === 'object' && prev !== null && typeof next === 'object' && next !== null) {
        const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
        for (const key of keys) {
          const newPath = path ? `${path}.${key}` : key;
          const prevValue = prev[key];
          const nextValue = next[key];

          if (prevValue === undefined && nextValue !== undefined) {
            reports.push({
              path: newPath,
              diff: { type: "ADDED", value: nextValue },
              causalContext: currentLinks[currentLinks.length - 1] || null,
            });
          } else if (prevValue !== undefined && nextValue === undefined) {
            reports.push({
              path: newPath,
              diff: { type: "REMOVED", value: prevValue },
              causalContext: currentLinks[currentLinks.length - 1] || null,
            });
          } else if (typeof prevValue === 'object' && prevValue !== null && typeof nextValue === 'object' && nextValue !== null) {
            diffRecursive(newPath, prevValue, nextValue, [...currentLinks, currentLinks[currentLinks.length - 1] || { sourceStepId: "N/A", causalActionType: "STRUCTURAL_UPDATE" }]);
          } else if (prevValue !== nextValue) {
            reports.push({
              path: newPath,
              diff: { type: "VALUE_CHANGE", from: prevValue, to: nextValue },
              causalContext: currentLinks[currentLinks.length - 1] || null,
            });
          }
        }
      } else if (prev !== next) {
        reports.push({
          path,
          diff: { type: "VALUE_CHANGE", from: prev, to: next },
          causalContext: currentLinks[currentLinks.length - 1] || null,
        });
      }
    };

    diffRecursive(
      "",
      prevState,
      nextState,
      causalLinks
    );

    return reports;
  }
}
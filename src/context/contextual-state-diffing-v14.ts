import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface CausalLink {
  source: string;
  action: string;
  related_state_path: string;
}

export interface StateDiff {
  path: string;
  oldValue: any;
  newValue: any;
  isCausallyExplained: boolean;
  isDrift: boolean;
}

export class ContextualStateDiffingV14 {
  private previousState: any;
  private currentState: any;
  private causalLinks: CausalLink[];

  constructor(previousState: any, currentState: any, causalLinks: CausalLink[]) {
    this.previousState = previousState;
    this.currentState = currentState;
    this.causalLinks = causalLinks;
  }

  private getDeepValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
  }

  private compareValues(oldValue: any, newValue: any): {
    diff: any;
    isExplained: boolean;
  } {
    const diff: any = {
      path: "root",
      oldValue,
      newValue,
      isCausallyExplained: false,
      isDrift: false,
    };

    let isExplained = false;
    for (const link of this.causalLinks) {
      if (link.related_state_path === "root") {
        // Simplified check for root level explanation
        if (String(oldValue) !== String(newValue) && link.action.includes("update")) {
          isExplained = true;
          break;
        }
      }
    }

    return {
      diff,
      isExplained: isExplained,
    };
  }

  public diff(statePath: string = "root"): StateDiff[] {
    const diffs: StateDiff[] = [];

    const processDiff = (current: any, previous: any, path: string) => {
      if (typeof current !== "object" || typeof previous !== "object" || current === null || previous === null) {
        if (path === "root") {
          const {
            diff: diffData,
            isExplained: isExplained,
          } = this.compareValues(previous, current);
          diffs.push({
            path: path,
            oldValue: previous,
            newValue: current,
            isCausallyExplained: isExplained,
            isDrift: !isExplained,
          });
          return;
        }
        // Handle primitive type comparison at deeper levels
        const {
          diff: diffData,
          isExplained: isExplained,
        } = this.compareValues(previous, current);
        diffs.push({
          path: path,
          oldValue: previous,
          newValue: current,
          isCausallyExplained: isExplained,
          isDrift: !isExplained,
        });
        return;
      }

      const keys = Object.keys(current).sort();

      for (const key of keys) {
        const currentVal = current[key];
        const previousVal = previous[key];
        const newPath = path ? `${path}.${key}` : key;

        if (typeof currentVal === "object" && currentVal !== null && typeof previousVal === "object" && previousVal !== null) {
          processDiff(currentVal, previousVal, newPath);
        } else if (currentVal !== previousVal) {
          const {
            diff: diffData,
            isExplained: isExplained,
          } = this.compareValues(previousVal, currentVal);
          diffs.push({
            path: newPath,
            oldValue: previousVal,
            newValue: currentVal,
            isCausallyExplained: isExplained,
            isDrift: !isExplained,
          });
        }
      }
    };

    processDiff(this.currentState, this.previousState, "");

    return diffs;
  }
}
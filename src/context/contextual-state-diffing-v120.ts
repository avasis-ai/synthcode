import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface CausalLink {
  sourceStateId: string;
  targetStateId: string;
  dependencyType: "REQUIRED_EVENT" | "PRECONDITION_MET" | "DEPENDENT_ON";
  description: string;
}

export interface CausalDiffReport {
  hasCausalDiff: boolean;
  inconsistencies: string[];
  missingLinks: CausalLink[];
  alteredLinks: CausalLink[];
}

export interface StateSnapshot {
  id: string;
  timestamp: number;
  messages: Message[];
  causalLinks: CausalLink[];
}

export class ContextualStateDiffer {
  private readonly stateHistory: Map<string, StateSnapshot> = new Map();

  constructor() {}

  public recordState(snapshot: StateSnapshot): void {
    this.stateHistory.set(snapshot.id, snapshot);
  }

  private getSnapshot(id: string): StateSnapshot | undefined {
    return this.stateHistory.get(id);
  }

  public compareStates(
    currentStateId: string,
    previousStateId: string
  ): {
    structuralDiff: boolean;
    temporalDiff: boolean;
    causalDiffReport: CausalDiffReport;
  } {
    const currentState = this.getSnapshot(currentStateId);
    const previousState = this.getSnapshot(previousStateId);

    if (!currentState || !previousState) {
      throw new Error("Both current and previous state IDs must be recorded.");
    }

    const structuralDiff = this.compareStructure(currentState, previousState);
    const temporalDiff = currentState.timestamp !== previousState.timestamp;
    const causalDiffReport = this.calculateCausalDiffReport(currentState, previousState);

    return {
      structuralDiff,
      temporalDiff,
      causalDiffReport,
    };
  }

  private compareStructure(
    current: StateSnapshot,
    previous: StateSnapshot
  ): boolean {
    if (current.messages.length !== previous.messages.length) {
      return true;
    }
    for (let i = 0; i < current.messages.length; i++) {
      const currentMsg = current.messages[i];
      const previousMsg = previous.messages[i];

      if (JSON.stringify(currentMsg) !== JSON.stringify(previousMsg)) {
        return true;
      }
    }
    return false;
  }

  private calculateCausalDiffReport(
    currentState: StateSnapshot,
    previousState: StateSnapshot
  ): CausalDiffReport {
    const report: CausalDiffReport = {
      hasCausalDiff: false,
      inconsistencies: [],
      missingLinks: [],
      alteredLinks: [],
    };

    const previousLinksMap = new Map<string, CausalLink[]>();
    previousState.causalLinks.forEach(link => {
      if (!previousLinksMap.has(link.sourceStateId)) {
        previousLinksMap.set(link.sourceStateId, []);
      }
      (previousLinksMap.get(link.sourceStateId) as CausalLink[]).push(link);
    });

    // Simplified causality check: Check if any link in the current state references a source that is missing or fundamentally changed.
    for (const link of currentState.causalLinks) {
      const sourceSnapshot = this.getSnapshot(link.sourceStateId);

      if (!sourceSnapshot) {
        report.missingLinks.push({
          sourceStateId: link.sourceStateId,
          targetStateId: currentState.id,
          dependencyType: "REQUIRED_EVENT",
          description: `Source state ${link.sourceStateId} required by link is missing.`,
        });
        report.hasCausalDiff = true;
      } else {
        // In a real scenario, we would compare the *content* of the link's dependency against the sourceSnapshot.
        // For this implementation, we simulate an alteration check.
        const isAltered = link.description.includes("OLD_VALUE") && !link.description.includes("NEW_VALUE");
        if (isAltered) {
          report.alteredLinks.push({
            sourceStateId: link.sourceStateId,
            targetStateId: currentState.id,
            dependencyType: "DEPENDENT_ON",
            description: `Causal link description appears altered between states.`,
          });
          report.hasCausalDiff = true;
        }
      }
    }

    if (report.missingLinks.length > 0 || report.alteredLinks.length > 0) {
      report.hasCausalDiff = true;
      report.inconsistencies.push("Causal links detected that reference missing or altered prerequisite states.");
    }

    return report;
  }
}
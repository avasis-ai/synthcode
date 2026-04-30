import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface AgentContext {
  messages: Message[];
  resourceUsage: Record<string, number>;
  lastUpdatedTimestamp: number;
  sessionMetadata: Record<string, any>;
}

export interface ContextualStateDiffPayload {
  stateDiff: Record<string, any>;
  temporalConstraint: {
    driftMs: number;
    isStale: boolean;
  };
  resourceUsage: {
    diff: Record<string, number>;
    discrepancyDetected: boolean;
  };
  contextualSummary: string;
}

export class ContextualStateDiffingService {
  calculateDiff(currentState: AgentContext, nextState: AgentContext): ContextualStateDiffPayload {
    const stateDiff = this.calculateStateDiff(currentState, nextState);
    const temporalConstraint = this.calculateTemporalConstraint(currentState, nextState);
    const resourceUsage = this.calculateResourceUsageDiff(currentState, nextState);
    const contextualSummary = this.generateSummary(currentState, nextState, stateDiff, resourceUsage);

    return {
      stateDiff,
      temporalConstraint,
      resourceUsage,
      contextualSummary,
    };
  }

  private calculateStateDiff(currentState: AgentContext, nextState: AgentContext): Record<string, any> {
    const messagesDiff: any = [];
    const maxIndex = Math.max(currentState.messages.length, nextState.messages.length);

    for (let i = 0; i < maxIndex; i++) {
      const currentMsg = currentState.messages[i];
      const nextMsg = nextState.messages[i];

      if (!currentMsg && nextMsg) {
        messagesDiff.push({ type: "added", index: i, message: nextMsg });
      } else if (currentMsg && !nextMsg) {
        messagesDiff.push({ type: "removed", index: i, message: currentMsg });
      } else if (currentMsg && nextMsg) {
        const contentChanged = JSON.stringify(currentMsg) !== JSON.stringify(nextMsg);
        if (contentChanged) {
          messagesDiff.push({ type: "updated", index: i, old: currentMsg, new: nextMsg });
        }
      }
    }

    const metadataDiff: Record<string, any> = {};
    for (const key in currentState.sessionMetadata) {
      if (JSON.stringify(currentState.sessionMetadata[key]) !== JSON.stringify(nextState.sessionMetadata[key])) {
        metadataDiff[key] = { old: currentState.sessionMetadata[key], new: nextState.sessionMetadata[key] };
      }
    }

    return {
      messages: messagesDiff,
      sessionMetadata: metadataDiff,
    };
  }

  private calculateTemporalConstraint(currentState: AgentContext, nextState: AgentContext): { driftMs: number; isStale: boolean } {
    const driftMs = Math.abs(nextState.lastUpdatedTimestamp - currentState.lastUpdatedTimestamp);
    const STALE_THRESHOLD_MS = 5000;
    const isStale = driftMs > STALE_THRESHOLD_MS;

    return { driftMs, isStale };
  }

  private calculateResourceUsageDiff(currentState: AgentContext, nextState: AgentContext): { diff: Record<string, number>; discrepancyDetected: boolean } {
    const diff: Record<string, number> = {};
    let discrepancyDetected = false;

    const allKeys = new Set([...Object.keys(currentState.resourceUsage), ...Object.keys(nextState.resourceUsage)]);

    for (const key of allKeys) {
      const current = currentState.resourceUsage[key] || 0;
      const next = nextState.resourceUsage[key] || 0;
      const diffValue = next - current;
      diff[key] = diffValue;

      if (Math.abs(diffValue) > 0.01) {
        discrepancyDetected = true;
      }
    }

    return { diff, discrepancyDetected };
  }

  private generateSummary(currentState: AgentContext, nextState: AgentContext, stateDiff: Record<string, any>, resourceUsage: { diff: Record<string, number>; discrepancyDetected: boolean }): string {
    let summary = "Contextual Update Summary: ";

    if (stateDiff.messages.length > 0) {
      summary += `Messages changed (${stateDiff.messages.length} items). `;
    } else {
      summary += "Messages unchanged. ";
    }

    if (Object.keys(stateDiff.sessionMetadata).length > 0) {
      summary += `Metadata updated (${Object.keys(stateDiff.sessionMetadata).length} keys). `;
    } else {
      summary += "Metadata unchanged. ";
    }

    if (resourceUsage.discrepancyDetected) {
      summary += "Resource usage discrepancy detected. ";
    } else {
      summary += "Resource usage stable. ";
    }

    return summary.trim();
  }
}

export { ContextualStateDiffingService };
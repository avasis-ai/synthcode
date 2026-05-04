import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface TemporalConstraint {
  maxAgeSeconds: number;
  requiredSequence: string[];
}

export interface ResourceUsage {
  cpuUsageMs: number;
  memoryUsageBytes: number;
}

export interface ContextualStateDiffCalculator {
  calculateDiff(
    currentState: any,
    previousState: any,
    context: {
      messageHistory: { role: "user" | "assistant"; content: ContentBlock[] }[];
    }
  ): Record<string, any>;
}

export interface TemporalStateDiffCalculator extends ContextualStateDiffCalculator {
  calculateDiff(
    currentState: any,
    previousState: any,
    context: {
      messageHistory: { role: "user" | "assistant"; content: ContentBlock[] }[];
    },
    temporalConstraint: TemporalConstraint,
    resourceUsage: ResourceUsage
  ): Record<string, any>;
}

export type DiffResult = {
  diff: Record<string, any>;
  isSignificant: boolean;
  temporalImpactScore?: number;
};

export class ContextualStateDiffingService {
  private calculator: ContextualStateDiffCalculator;

  constructor(calculator: ContextualStateDiffCalculator) {
    this.calculator = calculator;
  }

  public calculateDiff(
    currentState: any,
    previousState: any,
    context: {
      messageHistory: { role: "user" | "assistant"; content: ContentBlock[] }[];
    },
    requestTemporalDiff: boolean = false,
    temporalConstraint?: TemporalConstraint,
    resourceUsage?: ResourceUsage
  ): DiffResult {
    let diff: Record<string, any>;
    let temporalImpactScore: number | undefined = undefined;

    if (requestTemporalDiff && temporalConstraint && resourceUsage) {
      const temporalCalculator = this.getTemporalCalculator();
      if (!temporalCalculator) {
        throw new Error("Temporal calculator not available for request.");
      }
      diff = temporalCalculator.calculateDiff(
        currentState,
        previousState,
        context,
        temporalConstraint,
        resourceUsage
      );
      // Assuming the temporal calculator populates the score or we calculate it here
      temporalImpactScore = this.calculateTemporalImpactScore(
        currentState,
        previousState,
        temporalConstraint,
        resourceUsage
      );
    } else {
      diff = this.calculator.calculateDiff(
        currentState,
        previousState,
        context
      );
    }

    const isSignificant = this.determineSignificance(diff, requestTemporalDiff);

    return {
      diff: diff,
      isSignificant: isSignificant,
      temporalImpactScore: temporalImpactScore,
    };
  }

  private getTemporalCalculator(): TemporalStateDiffCalculator | undefined {
    // In a real scenario, this would check for registered specialized calculators.
    // For this implementation, we assume the provided calculator can be cast or is specialized.
    if (this.calculator instanceof TemporalStateDiffCalculator) {
      return this.calculator as unknown as TemporalStateDiffCalculator;
    }
    return undefined;
  }

  private calculateTemporalImpactScore(
    currentState: any,
    previousState: any,
    constraint: TemporalConstraint,
    usage: ResourceUsage
  ): number {
    const timeDelta = Math.abs(
      (Date.now() - (currentState.timestamp || Date.now())) / 1000
    );
    const agePenalty = Math.max(0, timeDelta - constraint.maxAgeSeconds) * 0.5;
    const resourceOverhead = Math.sqrt(
      Math.pow(usage.cpuUsageMs / 1000, 2) + Math.pow(usage.memoryUsageBytes / (1024 * 1024), 2)
    ) * 0.1;
    return Math.min(100, agePenalty + resourceOverhead);
  }

  private determineSignificance(
    diff: Record<string, any>,
    requestTemporalDiff: boolean
  ): boolean {
    const hasContentDiff = Object.keys(diff).some(
      (key) => typeof diff[key] === "object" && diff[key] !== null && Object.keys(diff[key]).length > 0
    );

    if (requestTemporalDiff) {
      // If temporal diffing was requested, significance relies on the score
      return (diff as any).temporalImpactScore && (diff as any).temporalImpactScore > 20;
    }

    return hasContentDiff;
  }
}

export class DefaultContextualStateDiffCalculator implements ContextualStateDiffCalculator {
  calculateDiff(
    currentState: any,
    previousState: any,
    context: {
      messageHistory: { role: "user" | "assistant"; content: ContentBlock[] }[];
    }
  ): Record<string, any> {
    const diff: Record<string, any> = {};

    if (JSON.stringify(currentState) !== JSON.stringify(previousState)) {
      diff["state_changed"] = true;
    }

    if (context.messageHistory.length > 0) {
      const lastMessage = context.messageHistory[context.messageHistory.length - 1];
      diff["context_updated"] = {
        last_role: lastMessage.role,
        message_count: context.messageHistory.length,
      };
    }

    return diff;
  }
}

export class TemporalContextualStateDiffCalculator implements TemporalStateDiffCalculator {
  calculateDiff(
    currentState: any,
    previousState: any,
    context: {
      messageHistory: { role: "user" | "assistant"; content: ContentBlock[] }[];
    },
    temporalConstraint: TemporalConstraint,
    resourceUsage: ResourceUsage
  ): Record<string, any> {
    const baseDiff = new DefaultContextualStateDiffCalculator().calculateDiff(
      currentState,
      previousState,
      context
    );

    const temporalDiff: Record<string, any> = {
      temporal_violation: (
        Math.abs(currentState.timestamp || Date.now()) >
        (previousState.timestamp || Date.now()) + temporalConstraint.maxAgeSeconds * 1000
      ) ? "Exceeded" : "OK",
      sequence_ok: temporalConstraint.requiredSequence.every((seq, index) => {
        // Simplified sequence check
        return (currentState.sequence || "").includes(seq);
      }),
    };

    return {
      ...baseDiff,
      ...temporalDiff,
      resource_metrics: {
        cpu: resourceUsage.cpuUsageMs,
        mem: resourceUsage.memoryUsageBytes,
      },
    };
  }
}
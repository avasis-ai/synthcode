import { AgentContext, ResourceUsageMetrics, StructuredToolCallValidator } from "./types";

export interface EnrichedValidationContext {
  baseContext: {
    messages: Message[];
    // Add other base context fields if necessary
  };
  resourceMetrics: ResourceUsageMetrics;
  policyViolations: {
    violation: string;
    severity: "low" | "medium" | "high";
  }[];
  agentState: {
    isRateLimited: boolean;
    activeConstraints: string[];
  };
}

export class StructuredToolCallValidationContextEnricher {
  enrich(
    baseContext: { messages: Message[] },
    agentContext: AgentContext,
    resourceMetrics: ResourceUsageMetrics
  ): EnrichedValidationContext {
    const policyViolations: {
      violation: string;
      severity: "low" | "medium" | "high";
    }[] = this.analyzePolicyAdherence(agentContext);

    const enrichedContext: EnrichedValidationContext = {
      baseContext: { messages: baseContext.messages },
      resourceMetrics: resourceMetrics,
      policyViolations: policyViolations,
      agentState: {
        isRateLimited: agentContext.isRateLimited,
        activeConstraints: agentContext.activeConstraints,
      },
    };

    return enrichedContext;
  }

  private analyzePolicyAdherence(context: AgentContext): {
    violation: string;
    severity: "low" | "medium" | "high";
  }[] {
    const violations: {
      violation: string;
      severity: "low" | "medium" | "high";
    }[] = [];

    if (context.sessionPolicy.maxToolCallsExceeded) {
      violations.push({
        violation: "Maximum allowed tool calls for this session has been reached.",
        severity: "high",
      });
    }

    if (context.sessionPolicy.requiresHumanConfirmation && !context.userHasConfirmed) {
      violations.push({
        violation: "Tool call requires explicit human confirmation before execution.",
        severity: "medium",
      });
    }

    return violations;
  }
}

export const enrichContext = (
  baseContext: { messages: Message[] },
  agentContext: AgentContext,
  resourceMetrics: ResourceUsageMetrics
): EnrichedValidationContext => {
  const enricher = new StructuredToolCallValidationContextEnricher();
  return enricher.enrich(baseContext, agentContext, resourceMetrics);
};

export const applyContextEnrichmentStep = (
  validator: StructuredToolCallValidator
): StructuredToolCallValidator => {
  return {
    ...validator,
    enrichmentStep: (
      context: {
        base: { messages: Message[] };
        agent: AgentContext;
        resource: ResourceUsageMetrics;
      }
    ): EnrichedValidationContext => {
      return enrichContext(
        context.base,
        context.agent,
        context.resource
      );
    },
  };
};
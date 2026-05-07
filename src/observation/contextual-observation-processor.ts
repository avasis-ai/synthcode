export type ObservationSeverity = "CRITICAL" | "WARNING" | "INFO" | "DEBUG";
export type RemediationType = "REPLAN" | "SKIP" | "ADJUST_PARAM" | "CONTINUE";

export interface Observation {
  metadata: {
    source: string;
    timestamp: number;
    correlation_id: string;
  };
  severity: ObservationSeverity;
  remediation_suggestion: RemediationType;
  details: Record<string, unknown>;
}

export interface PlanAdjustment {
  action: "REPLAN" | "SKIP" | "ADJUST_PARAM";
  target_step: string;
  adjustment_details: Record<string, unknown>;
  reason: string;
}

export interface AgentContext {
  current_plan: string;
  history: any[];
  parameters: Record<string, unknown>;
  status: "ACTIVE" | "PAUSED" | "FAILED";
}

export class ContextualObservationProcessor {
  constructor(private initialContext: AgentContext) {}

  private determineAdjustment(observation: Observation): PlanAdjustment | null {
    switch (observation.remediation_suggestion) {
      case "REPLAN":
        if (observation.severity === "CRITICAL") {
          return {
            action: "REPLAN",
            target_step: "root",
            adjustment_details: {
              reason: "Critical failure detected, full replanning required.",
              context_update: observation.details
            },
            reason: `Critical failure from ${observation.metadata.source}. Requires full replan.`,
          };
        }
        return null;

      case "SKIP":
        return {
          action: "SKIP",
          target_step: observation.metadata.source,
          adjustment_details: {
            reason: "Observation suggests skipping current step.",
            skip_reason: observation.details.reason || "No specific reason provided."
          },
          reason: `Skipping step ${observation.metadata.source} based on observation.`,
        };

      case "ADJUST_PARAM":
        return {
          action: "ADJUST_PARAM",
          target_step: observation.metadata.source,
          adjustment_details: {
            parameter_name: "param_to_adjust",
            new_value: observation.details.new_value,
            adjustment_type: "value_override"
          },
          reason: `Adjusting parameter for ${observation.metadata.source}.`,
        };

      case "CONTINUE":
        return null;
    }
  }

  public process(observations: Observation[]): { adjustments: PlanAdjustment[]; newContext: AgentContext } {
    const adjustments: PlanAdjustment[] = [];
    let currentContext = { ...this.initialContext };

    for (const observation of observations) {
      const adjustment = this.determineAdjustment(observation);
      if (adjustment) {
        adjustments.push(adjustment);
        // Apply immediate, cumulative context changes based on the adjustment
        currentContext = this.applyAdjustment(currentContext, adjustment);
      }
    }

    return { adjustments, newContext: currentContext };
  }

  private applyAdjustment(context: AgentContext, adjustment: PlanAdjustment): AgentContext {
    let newContext = { ...context };

    if (adjustment.action === "REPLAN") {
      newContext.current_plan = `[REPLANNING] Based on observation: ${adjustment.reason}`;
      newContext.status = "PAUSED";
    } else if (adjustment.action === "SKIP") {
      newContext.current_plan = newContext.current_plan.replace(
        `[STEP:${adjustment.target_step}]`,
        `[SKIPPED:${adjustment.target_step}]`
      );
      newContext.status = "ACTIVE";
    } else if (adjustment.action === "ADJUST_PARAM") {
      const { parameter_name, new_value } = adjustment.adjustment_details;
      newContext.parameters = {
        ...newContext.parameters,
        [parameter_name]: new_value
      };
      newContext.status = "ACTIVE";
    }

    return newContext;
  }
}

export { ContextualObservationProcessor };
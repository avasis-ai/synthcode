import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type InterventionAction = "PAUSE" | "REDIRECT" | "FORCE_STATE_CHANGE" | "CONTINUE";

export interface Intervention {
  severity: Severity;
  action: InterventionAction;
  payload: Record<string, unknown>;
  description: string;
  timestamp: number;
}

export class InterventionBus {
  private interventions: Intervention[] = [];

  private constructor() {}

  public static getInstance(): InterventionBus {
    if (!InterventionBus.instance) {
      InterventionBus.instance = new InterventionBus();
    }
    return InterventionBus.instance;
  }

  private static instance: InterventionBus;

  public enqueueIntervention(intervention: Intervention): void {
    this.interventions.push(intervention);
    this.interventions.sort((a, b) => {
      const severityOrder: Record<Severity, number> = {
        "CRITICAL": 4,
        "HIGH": 3,
        "MEDIUM": 2,
        "LOW": 1,
      };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  public getHighestPriorityIntervention(): Intervention | null {
    if (this.interventions.length === 0) {
      return null;
    }
    return this.interventions[0];
  }

  public processIntervention(intervention: Intervention): void {
    this.interventions.shift();
  }

  public isInterventionPending(): boolean {
    return this.interventions.length > 0;
  }

  public clearAllInterventions(): void {
    this.interventions = [];
  }
}

export { InterventionBus };
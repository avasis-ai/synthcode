import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./synth-code-types.js";

export enum Severity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export interface Alert {
  source: string;
  severity: Severity;
  impact: number;
  timestamp: number;
  message: string;
}

export interface Incident {
  id: string;
  alerts: Alert[];
  score: number;
  lastUpdated: number;
}

export type RemediationAction = {
  planId: string;
  description: string;
};

export type EscalationAction = {
  type: "REMEDIATION" | "NOTIFICATION" | "HUMAN_INTERVENTION";
  details: any;
};

class EscalationPolicy {
  private readonly thresholds: Record<number, EscalationAction> = {
    5.0: {
      type: "HUMAN_INTERVENTION",
      details: "Immediate PagerDuty escalation required.",
    },
    3.0: {
      type: "REMEDIATION",
      details: { planId: "auto-rollback", description: "Trigger automated service rollback." },
    },
    1.0: {
      type: "NOTIFICATION",
      details: "Standard incident ticket creation.",
    },
  };

  public determineAction(score: number): EscalationAction {
    if (score >= 5.0) {
      return this.thresholds[5.0];
    }
    if (score >= 3.0) {
      return this.thresholds[3.0];
    }
    if (score >= 1.0) {
      return this.thresholds[1.0];
    }
    return {
      type: "NOTIFICATION",
      details: "No immediate action required. Monitoring only.",
    };
  }
}

export class IncidentAlertingEngine {
  private incidents: Map<string, Incident> = new Map();
  private policy: EscalationPolicy;

  constructor() {
    this.policy = new EscalationPolicy();
  }

  private calculateIncidentScore(alerts: Alert[]): number {
    const totalSeverity = alerts.reduce((sum, alert) => sum + alert.severity, 0);
    const averageImpact = alerts.reduce((sum, alert) => sum + alert.impact, 0) / alerts.length;
    
    // Composite Score: Weighted average of severity and impact
    // Weighting: Severity (0.6) + Impact (0.4)
    return (totalSeverity * 0.6) + (averageImpact * 4.0);
  }

  private deduplicateAndCluster(newAlert: Alert): string {
    // Simple clustering: Use source and a generalized type (e.g., "database", "api")
    // For simplicity, we use the source as the key.
    return newAlert.source;
  }

  public ingestAlert(alert: Alert): { incidentId: string; score: number; action: EscalationAction } {
    const incidentKey = this.deduplicateAndCluster(alert);
    const now = Date.now();

    let incident = this.incidents.get(incidentKey);

    if (!incident) {
      incident = {
        id: incidentKey,
        alerts: [],
        score: 0,
        lastUpdated: now,
      };
      this.incidents.set(incidentKey, incident);
    }

    // Check for temporal clustering (e.g., only process alerts within the last 5 minutes)
    const timeWindowMs = 5 * 60 * 1000;
    if (now - incident.lastUpdated > timeWindowMs && incident.alerts.length > 0) {
      // If too much time passed, treat it as a new incident or reset the cluster
      incident = {
        id: incidentKey,
        alerts: [],
        score: 0,
        lastUpdated: now,
      };
      this.incidents.set(incidentKey, incident);
    }

    // Deduplication check (simple: only add if the message is significantly different)
    const isDuplicate = incident.alerts.some(existingAlert => 
      existingAlert.source === alert.source && existingAlert.message === alert.message
    );

    if (!isDuplicate) {
      incident.alerts.push(alert);
      incident.lastUpdated = now;
    }

    // Recalculate score based on updated alerts
    const newScore = this.calculateIncidentScore(incident.alerts);
    incident.score = newScore;

    const action = this.policy.determineAction(newScore);

    return {
      incidentId: incident.id,
      score: newScore,
      action: action,
    };
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }
}

export { IncidentAlertingEngine };
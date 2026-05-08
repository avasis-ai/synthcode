import { describe, it, expect } from "vitest";
import {
  Severity,
  Alert,
  Incident,
  RemediationAction,
  calculateIncidentScore,
  createIncident,
  updateIncidentWithAlert,
} from "../src/alerting/incident-alerting-engine.js";

describe("Incident Alerting Engine", () => {
  it("should calculate initial incident score correctly", () => {
    const alerts: Alert[] = [
      {
        source: "system_a",
        severity: Severity.LOW,
        impact: 1,
        timestamp: Date.now(),
        message: "Low impact warning",
      },
      {
        source: "system_b",
        severity: Severity.CRITICAL,
        impact: 5,
        timestamp: Date.now(),
        message: "Critical failure",
      },
      {
        source: "system_c",
        severity: Severity.MEDIUM,
        impact: 3,
        timestamp: Date.now(),
        message: "Medium issue",
      },
    ];
    // Expected score calculation:
    // Low: 1 * 1 = 1
    // Critical: 4 * 5 = 20
    // Medium: 2 * 3 = 6
    // Total: 1 + 20 + 6 = 27
    const score = calculateIncidentScore(alerts);
    expect(score).toBe(27);
  });

  it("should create a new incident with correct initial state", () => {
    const alerts: Alert[] = [
      {
        source: "system_x",
        severity: Severity.HIGH,
        impact: 4,
        timestamp: Date.now(),
        message: "High impact alert",
      },
    ];
    const incident = createIncident("INC-123", alerts);

    expect(incident.id).toBe("INC-123");
    expect(incident.alerts).toHaveLength(1);
    expect(incident.score).toBe(4 * 4); // Severity.HIGH (3) * Impact (4) = 12. Wait, Severity.HIGH is 3. 3 * 4 = 12.
    expect(incident.score).toBe(12);
    expect(incident.lastUpdated).toBe(alerts[0].timestamp);
  });

  it("should update incident score and alerts when a new alert arrives", () => {
    const initialAlerts: Alert[] = [
      {
        source: "system_a",
        severity: Severity.MEDIUM,
        impact: 2,
        timestamp: 1000,
        message: "Initial medium alert",
      },
    ];
    const initialIncident = createIncident("INC-456", initialAlerts);

    const newAlert: Alert = {
      source: "system_b",
      severity: Severity.CRITICAL,
      impact: 5,
      timestamp: 2000,
      message: "New critical alert arrived",
    };

    // Initial score: 2 * 2 = 4
    // New score: 4 (old) + (4 * 5) (new) = 24
    const updatedIncident = updateIncidentWithAlert(initialIncident, newAlert);

    expect(updatedIncident.alerts).toHaveLength(2);
    expect(updatedIncident.alerts[1]).toEqual(newAlert);
    expect(updatedIncident.score).toBe(24);
    expect(updatedIncident.lastUpdated).toBe(2000);
  });
});
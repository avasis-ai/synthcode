export type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "UNKNOWN";

export interface CapabilityUsageEvent {
  capabilityId: string;
  contextSnapshot: Record<string, unknown>;
  usageTimestamp: Date;
  outcome: "SUCCESS" | "FAILURE" | "SKIPPED";
  complianceStatus: ComplianceStatus;
  details: Record<string, unknown>;
}

export class CapabilityUsageAuditor {
  private usageEvents: CapabilityUsageEvent[] = [];

  recordUsage(event: CapabilityUsageEvent): void {
    this.usageEvents.push(event);
  }

  getUsageReport(capabilityId: string, timeRangeStart: Date, timeRangeEnd: Date): {
    count: number;
    events: CapabilityUsageEvent[];
  } {
    const filteredEvents = this.usageEvents.filter(event =>
      event.capabilityId === capabilityId &&
      event.usageTimestamp >= timeRangeStart &&
      event.usageTimestamp <= timeRangeEnd
    );

    return {
      count: filteredEvents.length,
      events: filteredEvents,
    };
  }

  getReportSummary(capabilityId: string): {
    totalCount: number;
    compliantCount: number;
    nonCompliantCount: number;
    successCount: number;
    failureCount: number;
  } {
    const filteredEvents = this.usageEvents.filter(event =>
      event.capabilityId === capabilityId
    );

    let compliantCount = 0;
    let nonCompliantCount = 0;
    let successCount = 0;
    let failureCount = 0;

    for (const event of filteredEvents) {
      if (event.complianceStatus === "COMPLIANT") {
        compliantCount++;
      } else if (event.complianceStatus === "NON_COMPLIANT") {
        nonCompliantCount++;
      }
      if (event.outcome === "SUCCESS") {
        successCount++;
      } else if (event.outcome === "FAILURE") {
        failureCount++;
      }
    }

    return {
      totalCount: filteredEvents.length,
      compliantCount,
      nonCompliantCount,
      successCount,
      failureCount,
    };
  }
}

export { CapabilityUsageAuditor };
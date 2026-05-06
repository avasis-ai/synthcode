export type Severity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface TelemetryEvent {
  eventType: string;
  severity: Severity;
  timestamp: number;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export class TelemetryEmitter {
  private readonly serviceName: string;

  constructor(serviceName: string = "AgentCore") {
    this.serviceName = serviceName;
  }

  emitEvent(event: TelemetryEvent): void {
    const fullEvent: TelemetryEvent = {
      eventType: event.eventType,
      severity: event.severity,
      timestamp: event.timestamp || Date.now(),
      payload: event.payload,
      metadata: {
        ...event.metadata,
        service: this.serviceName,
      },
    };
    this.logEvent(fullEvent);
  }

  emitMetric(metric: MetricData): void {
    const fullMetric: MetricData = {
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: {
        ...metric.tags,
        service: this.serviceName,
      },
    };
    this.logMetric(fullMetric);
  }

  private logEvent(event: TelemetryEvent): void {
    // In a real implementation, this would send data to a queue/stream (e.g., Kafka, ELK stack)
    // For simulation, we log to console.
    console.log(
      `[TELEMETRY EVENT] ${event.severity} | ${event.eventType} | Payload:`,
      event.payload,
    );
  }

  private logMetric(metric: MetricData): void {
    // In a real implementation, this would push data to a time-series database (e.g., Prometheus)
    console.log(
      `[TELEMETRY METRIC] ${metric.name} = ${metric.value}${metric.unit} | Tags:`,
      metric.tags,
    );
  }
}

export { TelemetryEmitter };
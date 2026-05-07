import { EventEmitter } from 'node:events';

export interface ResourceMetrics {
  cpuUsageMs: number;
  memoryUsageBytes: number;
  diskIOBytes: number;
}

export interface StructuredContext {
  component: string;
  stepId: string;
  metadata: Record<string, unknown>;
}

export interface Observation {
  timestamp: number;
  traceId: string;
  spanId: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  resourceMetrics: ResourceMetrics;
  context: StructuredContext;
  payload?: Record<string, unknown>;
}

export interface ObservationEmitter {
  /**
   * Emits a structured observation to the pipeline.
   * @param observation The structured telemetry data.
   */
  emit(observation: Observation): void;
}

export interface ObservationSink {
  /**
   * Processes and handles a single observation.
   * @param observation The structured telemetry data.
   */
  process(observation: Observation): void;
}

export class ConsoleSink implements ObservationSink {
  process(observation: Observation): void {
    const formattedObservation = JSON.stringify({
      level: observation.level,
      message: observation.message,
      resourceMetrics: observation.resourceMetrics,
      context: observation.context,
      payload: observation.payload,
    }, null, 2);
    console.log(`[OBSERVATION] ${formattedObservation}`);
  }
}

export class PrometheusSink implements ObservationSink {
  process(observation: Observation): void {
    // Simulate metric extraction for Prometheus
    const cpuMetric = observation.resourceMetrics.cpuUsageMs / 1000;
    console.log(`[PROMETHEUS_METRIC] gauge_cpu_usage{component="${observation.context.component}"} ${cpuMetric}`);
  }
}

export class ObservabilityPipeline extends EventEmitter {
  private sinks: ObservationSink[] = [];

  constructor() {
    super();
  }

  registerSink(sink: ObservationSink): void {
    this.sinks.push(sink);
  }

  /**
   * Central method to process and distribute an observation to all registered sinks.
   * @param observation The structured telemetry data.
   */
  emit(observation: Observation): void {
    if (!this.sinks.length) {
      console.warn("ObservabilityPipeline: No sinks registered. Observation dropped.");
      return;
    }

    for (const sink of this.sinks) {
      try {
        sink.process(observation);
      } catch (error) {
        console.error("Error processing observation in a sink:", error);
      }
    }
  }

  /**
   * Creates a component-specific emitter wrapper.
   * @param componentName The name of the component generating the observation.
   * @param initialTraceId The starting trace ID for context.
   * @returns An ObservationEmitter instance.
   */
  createEmitter(componentName: string, initialTraceId: string): ObservationEmitter {
    return {
      emit: (observation: Observation): void => {
        const enrichedObservation: Observation = {
          ...observation,
          context: {
            ...observation.context,
            component: componentName,
          },
          traceId: observation.traceId || initialTraceId,
          spanId: observation.spanId || Math.random().toString(36).substring(2, 8),
        };
        this.emit(enrichedObservation);
      },
    };
  }
}

export { ObservabilityPipeline, ObservationSink, ConsoleSink, PrometheusSink, Observation, ResourceMetrics, StructuredContext, ObservationEmitter };
import { v4 as uuidv4 } from 'uuid';

type SpanStatus = "OK" | "ERROR" | "UNKNOWN";

interface Span {
  spanId: string;
  traceId: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  status: SpanStatus;
  attributes: Record<string, unknown>;
  events: Array<{ timestamp: number; name: string; data: Record<string, unknown> }>;
}

interface TraceContext {
  traceId: string;
  currentSpanId: string;
}

export class ContextualTracer {
  private context: TraceContext;
  private activeSpans: Map<string, Span> = new Map();

  constructor(initialTraceId: string = uuidv4()) {
    this.context = {
      traceId: initialTraceId,
      currentSpanId: initialTraceId,
    };
  }

  private getContext(): TraceContext {
    return this.context;
  }

  private getActiveSpan(spanId: string): Span | undefined {
    return this.activeSpans.get(spanId);
  }

  public startSpan(operationName: string): { spanId: string, context: TraceContext } {
    const newSpanId = uuidv4();
    const newSpan: Span = {
      spanId: newSpanId,
      traceId: this.context.traceId,
      operationName: operationName,
      startTime: Date.now(),
      status: "UNKNOWN",
      attributes: {
        component: "agent_core",
        operation: operationName,
      },
      events: [],
    };

    this.activeSpans.set(newSpanId, newSpan);
    this.context.currentSpanId = newSpanId;

    return { spanId: newSpanId, context: { ...this.context, currentSpanId: newSpanId } };
  }

  public endSpan(spanId: string, status: SpanStatus = "OK", finalAttributes: Record<string, unknown> = {}): Span {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new Error(`Span with ID ${spanId} not found.`);
    }

    const endTime = Date.now();
    const updatedSpan: Span = {
      ...span,
      endTime: endTime,
      status: status,
      attributes: { ...span.attributes, ...finalAttributes },
    };

    this.activeSpans.set(spanId, updatedSpan);
    return updatedSpan;
  }

  public addEvent(spanId: string, name: string, data: Record<string, unknown> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new Error(`Cannot add event: Span with ID ${spanId} not found.`);
    }

    const newEvent = {
      timestamp: Date.now(),
      name: name,
      data: data,
    };

    const updatedSpan: Span = {
      ...span,
      events: [...span.events, newEvent],
    };

    this.activeSpans.set(spanId, updatedSpan);
  }

  public getTraces(): Array<Span> {
    return Array.from(this.activeSpans.values());
  }
}
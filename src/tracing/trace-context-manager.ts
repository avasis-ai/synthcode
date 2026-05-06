export type TraceId = string;
export type SpanId = string;

export interface SpanContext {
  traceId: TraceId;
  spanId: SpanId;
  parentSpanId?: SpanId;
  operationName: string;
}

export class TraceContextManager {
  private contextStack: SpanContext[] = [];

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getCurrentContext(): SpanContext | undefined {
    if (this.contextStack.length === 0) {
      return undefined;
    }
    return this.contextStack[this.contextStack.length - 1];
  }

  public startSpan(operationName: string): SpanContext {
    const currentContext = this.getCurrentContext();
    const newSpanId = this.generateId();
    let traceId: TraceId;
    let parentSpanId: SpanId | undefined;

    if (currentContext) {
      traceId = currentContext.traceId;
      parentSpanId = currentContext.spanId;
    } else {
      traceId = this.generateId();
      parentSpanId = undefined;
    }

    const newSpan: SpanContext = {
      traceId: traceId,
      spanId: newSpanId,
      parentSpanId: parentSpanId,
      operationName: operationName,
    };

    this.contextStack.push(newSpan);
    return newSpan;
  }

  public endSpan(span: SpanContext): void {
    if (this.contextStack.length > 0 && this.contextStack[this.contextStack.length - 1].spanId === span.spanId) {
      this.contextStack.pop();
    } else {
      console.warn("Attempted to end span context that was not the current active span.");
    }
  }

  public getCurrentSpanContext(): SpanContext | undefined {
    return this.getCurrentContext();
  }

  public getRootContext(): SpanContext | undefined {
    return this.contextStack.length > 0 ? this.contextStack[0] : undefined;
  }

  /**
   * Injects the current tracing context into a payload object, ensuring observability.
   * @param payload The data object to enrich.
   * @returns The enriched payload.
   */
  public enrichContext<T extends Record<string, unknown>>(payload: T): T & { __traceContext?: { traceId: TraceId; spanId: SpanId; parentSpanId?: SpanId } } {
    const currentSpan = this.getCurrentSpanContext();
    if (!currentSpan) {
      return payload;
    }

    const context = {
      traceId: currentSpan.traceId,
      spanId: currentSpan.spanId,
      parentSpanId: currentSpan.parentSpanId,
    };

    return {
      ...payload,
      __traceContext: context,
    } as T & { __traceContext?: { traceId: TraceId; spanId: SpanId; parentSpanId?: SpanId } };
  }
}

export { TraceContextManager };
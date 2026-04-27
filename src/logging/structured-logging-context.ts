import { Logger, LogContext } from "./structured-logger";

export interface LoggingContext {
  traceId: string;
  sessionId: string;
  [key: string]: any;
}

export class StructuredLoggingContext {
  private context: LoggingContext;

  constructor(initialContext: Partial<LoggingContext> = {}) {
    this.context = {
      traceId: initialContext.traceId || 'unknown-trace',
      sessionId: initialContext.sessionId || 'unknown-session',
      ...initialContext,
    };
  }

  getContext(): Readonly<LoggingContext> {
    return this.context;
  }

  withContext(updates: Partial<LoggingContext>): StructuredLoggingContext {
    const newContext: LoggingContext = {
      ...this.context,
      ...updates,
    };
    return new StructuredLoggingContext(newContext);
  }

  /**
   * Wraps an existing logger instance to automatically inject the current context.
   * @param logger The underlying structured logger.
   * @returns A new logger instance with context enrichment.
   */
  public wrapLogger(logger: Logger): Logger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        const enrichedContext = {
          ...this.context,
          ...context,
        };
        return logger.info(message, enrichedContext);
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        const enrichedContext = {
          ...this.context,
          ...context,
        };
        return logger.warn(message, enrichedContext);
      },
      error: (message: string, error: Error, context?: Record<string, unknown>) => {
        const enrichedContext = {
          ...this.context,
          ...context,
        };
        return logger.error(message, error, enrichedContext);
      },
      // Add other logging levels as necessary
    } as Logger;
  }
}
import { EventEmitter } from "node:events";

export type Context = Record<string, unknown>;

interface Logger {
  info(message: string, context?: Context): void;
  warn(message: string, context?: Context): void;
  error(message: string, context?: Context): void;
}

export class ContextualLogger {
  private readonly baseLogger: Logger;
  private currentContext: Context = {};

  constructor(baseLogger: Logger) {
    this.baseLogger = baseLogger;
  }

  withContext(newContext: Partial<Context>): ContextualLogger {
    const mergedContext: Context = {
      ...this.currentContext,
      ...newContext,
    };
    return new ContextualLogger(this.baseLogger) {
      private readonly currentContext: Context = mergedContext;
    };
  }

  info(message: string, context?: Context): void {
    const finalContext: Context = {
      ...this.currentContext,
      ...(context || {}),
    };
    this.baseLogger.info(message, finalContext);
  }

  warn(message: string, context?: Context): void {
    const finalContext: Context = {
      ...this.currentContext,
      ...(context || {}),
    };
    this.baseLogger.warn(message, finalContext);
  }

  error(message: string, context?: Context): void {
    const finalContext: Context = {
      ...this.currentContext,
      ...(context || {}),
    };
    this.baseLogger.error(message, finalContext);
  }
}

export function createContextualLogger(baseLogger: Logger): ContextualLogger {
  return new ContextualLogger(baseLogger);
}
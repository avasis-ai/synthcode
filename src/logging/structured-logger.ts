import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Context {
  sessionId?: string;
  userId?: string;
  currentStep?: number;
  [key: string]: any;
}

export class StructuredLogger {
  private readonly initialContext: Context;
  private readonly baseContext: Record<string, any>;

  constructor(initialContext: Context = {}) {
    this.initialContext = initialContext;
    this.baseContext = {
      timestamp: new Date().toISOString(),
      logger_source: "StructuredLogger",
      ...initialContext,
    };
  }

  private enrichContext(context: Context): Record<string, any> {
    const mergedContext: Record<string, any> = {
      ...this.baseContext,
      ...context,
      context_merge_time: new Date().toISOString(),
    };
    return mergedContext;
  }

  private log(
    level: "info" | "warn" | "error",
    message: string,
    context: Context,
    error?: Error | unknown
  ): void {
    const finalContext = this.enrichContext(context);
    const logEntry: Record<string, any> = {
      level: level,
      message: message,
      context: finalContext,
    };

    if (error) {
      logEntry.error_details = {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    // In a real system, this would write to a structured logging sink (e.g., Winston, Pino)
    // For this implementation, we just log to console for demonstration.
    console.log(JSON.stringify(logEntry, null, 2));
  }

  info(message: string, context: Context = {}): void {
    this.log("info", message, context);
  }

  warn(message: string, context: Context = {}): void {
    this.log("warn", message, context);
  }

  error(message: string, error: Error | unknown, context: Context = {}): void {
    this.log("error", message, context, error);
  }
}
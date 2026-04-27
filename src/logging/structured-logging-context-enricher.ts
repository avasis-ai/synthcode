import { Logger } from "./logger";

export interface ContextData {
  traceId?: string;
  sessionId?: string;
  userId?: string;
  step?: string;
  [key: string]: any;
}

export interface ContextEnricher {
  enrich(logMessage: any, context: ContextData): any;
}

export class StructuredLoggingContextEnricher implements ContextEnricher {
  private readonly logger: Logger;
  private readonly contextProvider: () => ContextData;

  constructor(logger: Logger, contextProvider: () => ContextData) {
    this.logger = logger;
    this.contextProvider = contextProvider;
  }

  enrich(logMessage: any, context: ContextData): any {
    const enrichedContext = {
      ...context,
      ...this.contextProvider(),
    };

    const enrichedLog = {
      ...logMessage,
      context: enrichedContext,
    };

    this.logger.write(enrichedLog);
    return enrichedLog;
  }
}
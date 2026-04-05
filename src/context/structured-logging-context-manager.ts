import { EventEmitter } from "events";

type ContextKeys = Record<string, string | number | boolean>;

export class StructuredLoggingContextManager {
  private contextStore: Map<string, string | number | boolean> = new Map();
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public enter(initialContext: Partial<ContextKeys> = {}): StructuredLoggingContextManager {
    Object.entries(initialContext).forEach(([key, value]) => {
      this.contextStore.set(key, value);
    });
    return this;
  }

  public exit(): void {
    this.contextStore.clear();
  }

  public getContext(): Record<string, string | number | boolean> {
    const context: Record<string, string | number | boolean> = {};
    this.contextStore.forEach((value, key) => {
      context[key] = value;
    });
    return context;
  }

  public wrapLog<T>(logger: { metadata: (meta: Record<string, any>) => void }): T {
    return (message: string, metadata?: Record<string, any>): T => {
      const context = this.getContext();
      const mergedMetadata: Record<string, any> = {
        ...context,
        ...(metadata || {}),
      };
      logger.metadata(mergedMetadata);
      // Assuming the logger call structure is (message, metadata) or similar.
      // For simplicity, we just call the metadata setter as per the requirement.
      // A real logger wrapper would need more context on the logger's API.
      return {} as T;
    };
  }

  public async use(initialContext: Partial<ContextKeys> = {}): Promise<StructuredLoggingContextManager> {
    this.enter(initialContext);
    return this;
  }
}
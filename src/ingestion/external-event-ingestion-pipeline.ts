import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ExternalEventSchema {
  source: string;
  event_type: string;
  timestamp: number;
  payload: Record<string, unknown>;
  required_fields: string[];
}

class WebhookValidator {
  validate(rawPayload: Record<string, unknown>, schema: ExternalEventSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (typeof rawPayload !== 'object' || rawPayload === null) {
      errors.push("Payload must be a non-null object.");
      return { isValid: false, errors };
    }

    // Check required fields defined in the schema
    for (const field of schema.required_fields) {
      if (!(field in rawPayload)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Basic type checks (can be expanded)
    if (typeof rawPayload.source !== 'string') {
      errors.push("Source must be a string.");
    }
    if (typeof rawPayload.event_type !== 'string') {
      errors.push("Event type must be a string.");
    }
    if (typeof rawPayload.timestamp !== 'number') {
      errors.push("Timestamp must be a number.");
    }

    isValid = errors.length === 0;
    return { isValid, errors };
  }
}

interface ContextService {
  getAgentContext(): Promise<Record<string, unknown>>;
}

interface EventBus {
  publish(event: Message): void;
  publishRaw(data: Record<string, unknown>): void;
}

class ExternalEventIngestionPipeline {
  private validator: WebhookValidator;
  private contextService: ContextService;
  private eventBus: EventBus;
  private schema: ExternalEventSchema;

  constructor(
    schema: ExternalEventSchema,
    contextService: ContextService,
    eventBus: EventBus
  ) {
    this.schema = schema;
    this.validator = new WebhookValidator();
    this.contextService = contextService;
    this.eventBus = eventBus;
  }

  private async enrichContext(rawEvent: Record<string, unknown>): Promise<Record<string, unknown> & { context: Record<string, unknown> }> {
    try {
      const agentContext = await this.contextService.getAgentContext();
      return { ...rawEvent, context: agentContext };
    } catch (error) {
      throw new Error("Failed to enrich event with agent context.");
    }
  }

  private transformEvent(enrichedEvent: Record<string, unknown>): Message {
    const { event_type, payload, context } = enrichedEvent;

    if (event_type === "user_interaction") {
      const userContent = payload.data?.content || "";
      return { role: "user", content: userContent };
    }

    if (event_type === "tool_result") {
      const toolId = payload.data?.tool_use_id;
      const content = payload.data?.result || "";
      return { role: "tool", tool_use_id: toolId, content: content };
    }

    // Default fallback or internal message structure
    return { role: "user", content: `[External Event: ${event_type}] Processed with context.` };
  }

  public async processEvent(rawPayload: Record<string, unknown>): Promise<boolean> {
    // 1. Validation
    const validationResult = this.validator.validate(rawPayload, this.schema);
    if (!validationResult.isValid) {
      console.error("Validation failed:", validationResult.errors);
      this.eventBus.publishRaw({
        source: "ingestion_pipeline",
        event_type: "validation_failure",
        timestamp: Date.now(),
        payload: { errors: validationResult.errors }
      });
      return false;
    }

    // 2. Context Enrichment
    let enrichedEvent: Record<string, unknown>;
    try {
      enrichedEvent = await this.enrichContext(rawPayload);
    } catch (e) {
      console.error("Context enrichment failed:", e);
      this.eventBus.publishRaw({
        source: "ingestion_pipeline",
        event_type: "context_failure",
        timestamp: Date.now(),
        payload: { error: (e as Error).message }
      });
      return false;
    }

    // 3. Transformation
    const processedMessage = this.transformEvent(enrichedEvent);

    // 4. Dispatch
    this.eventBus.publish(processedMessage);
    console.log(`Successfully processed and dispatched event: ${processedMessage.role}`);
    return true;
  }
}

export { ExternalEventIngestionPipeline };
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface IProfileSource {
  getProfileContext(): Record<string, unknown>;
}

export interface ISessionSource {
  getSessionContext(): Record<string, unknown>;
}

export interface IGlobalConstraintSource {
  getConstraints(): Record<string, unknown>;
}

export interface IContextSource {
  enrich(context: {
    messages: Message[];
    current_state: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
}

export class StructuredToolCallValidatorContextEnricher {
  private sources: IContextSource[];

  constructor(sources: IContextSource[]) {
    this.sources = sources;
  }

  async enrichContext(context: {
    messages: Message[];
    current_state: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    let enrichedContext: Record<string, unknown> = {
      metadata: {
        profile: {},
        session: {},
        global: {},
        combined: {},
      },
      context_data: {
        ...context.current_state,
        messages: context.messages,
      },
    };

    for (const source of this.sources) {
      const sourceContext = await source.enrich(context);
      Object.assign(enrichedContext.metadata.profile, sourceContext.metadata?.profile || {});
      Object.assign(enrichedContext.metadata.session, sourceContext.metadata?.session || {});
      Object.assign(enrichedContext.metadata.global, sourceContext.metadata?.global || {});
      Object.assign(enrichedContext.metadata.combined, sourceContext.metadata?.combined || {});
      Object.assign(enrichedContext.context_data, sourceContext.context_data || {});
    }

    return enrichedContext;
  }
}
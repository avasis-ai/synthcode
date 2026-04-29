import { IStore, ProjectContext, Message } from "../types";

export interface ContextEnricher {
  enrichContext: (
    rawToolOutput: Record<string, unknown>,
    currentContext: { messages: Message[]; state: Record<string, unknown> },
    availableEnrichers: { name: string; enrich: (context: any) => any }[]
  ) => Record<string, any>;
}

export class StructuredToolOutputValidationContextEnricherV144 implements ContextEnricher {
  enrichContext(
    rawToolOutput: Record<string, unknown>,
    currentContext: { messages: Message[]; state: Record<string, unknown> },
    availableEnrichers: { name: string; enrich: (context: any) => any }[]
  ): Record<string, any> {
    const enrichedContext: Record<string, any> = {
      toolOutput: rawToolOutput,
      history: this.getHistoryFromStore(currentContext.messages, currentContext.state),
      sessionState: currentContext.state,
      projectContext: this.getProjectContext(currentContext.state),
      metadata: {
        enricherVersion: "v144",
        timestamp: Date.now(),
        availableEnrichersCount: availableEnrichers.length,
      },
    };

    for (const enricher of availableEnrichers) {
      enrichedContext[enricher.name] = enricher.enrich(enrichedContext);
    }

    return enrichedContext;
  }

  private getHistoryFromStore(messages: Message[], state: Record<string, unknown>): { history: any; storeData: any } {
    const history = messages.slice(-5);
    const storeData = state['history'] || {};
    return { history, storeData };
  }

  private getProjectContext(state: Record<string, unknown>): { project: any; rules: any } {
    const projectContext = state['project'] || {};
    const rules = state['rules'] || {};
    return { project: projectContext, rules };
  }
}
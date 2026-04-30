import { ProjectContextManager } from "./project-context-manager.js";
import { TemporalContextResolver } from "./temporal-context-resolver.js";

export interface EnrichedContext {
  baseContext: {
    messages: Message[];
    toolCallId: string;
  };
  projectContext: Record<string, unknown>;
  temporalMetadata: {
    startTime: Date;
    endTime: Date;
    isWeekend: boolean;
  };
}

export interface BaseValidationContext {
  messages: Message[];
  toolCallId: string;
}

export class StructuredToolOutputValidationContextEnricher {
  private projectContextManager: ProjectContextManager;
  private temporalContextResolver: TemporalContextResolver;

  constructor(
    projectContextManager: ProjectContextManager,
    temporalContextResolver: TemporalContextResolver
  ) {
    this.projectContextManager = projectContextManager;
    this.temporalContextResolver = temporalContextResolver;
  }

  enrich(
    baseContext: BaseValidationContext
  ): EnrichedContext {
    const projectContext = this.projectContextManager.getProjectContext();
    const temporalMetadata = this.temporalContextResolver.resolveTemporalContext();

    return {
      baseContext: {
        messages: baseContext.messages,
        toolCallId: baseContext.toolCallId,
      },
      projectContext: projectContext,
      temporalMetadata: temporalMetadata,
    };
  }
}
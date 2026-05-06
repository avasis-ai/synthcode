import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextSource<T> = {
    sourceName: string;
    get?: (context: { history: Message[]; knowledge: Record<string, any>; state: Record<string, any>; metadata: Record<string, any> }) => T;
};

type ContextPayload = {
    history: Message[];
    knowledge: Record<string, any>;
    state: Record<string, any>;
    metadata: Record<string, any>;
};

type ContextResolver<T> = (context: ContextPayload) => T;

export class StructuredToolCallContextEnricher {
    private contextSources: Map<string, ContextSource<any>> = new Map();
    private customResolvers: Map<string, ContextResolver<any>> = new Map();

    registerContextSource(source: ContextSource<any>): void {
        this.contextSources.set(source.sourceName, source);
    }

    registerCustomResolver(resolverName: string, resolver: ContextResolver<any>): void {
        this.customResolvers.set(resolverName, resolver);
    }

    private fuseContext(context: ContextPayload): {
        history: Message[];
        knowledge: Record<string, any>;
        state: Record<string, any>;
        metadata: Record<string, any>;
    } {
        return {
            history: context.history,
            knowledge: { ...context.knowledge },
            state: { ...context.state },
            metadata: { ...context.metadata },
        };
    }

    enrich(context: ContextPayload): Record<string, any> {
        let fusedContext = this.fuseContext(context);

        // 1. Apply Context Source Fusion
        for (const source of this.contextSources.values()) {
            try {
                const enrichedData = source.get!(fusedContext);
                if (enrichedData) {
                    // Simple merging strategy for demonstration; real implementation needs deep merging logic
                    if (typeof enrichedData === 'object' && enrichedData !== null) {
                        Object.keys(enrichedData).forEach(key => {
                            if (key === 'history') {
                                fusedContext.history = [...(fusedContext.history as Message[]), ...(enrichedData as Message[])];
                            } else if (key === 'knowledge') {
                                fusedContext.knowledge = { ...fusedContext.knowledge, ...(enrichedData as Record<string, any>) };
                            } else if (key === 'state') {
                                fusedContext.state = { ...fusedContext.state, ...(enrichedData as Record<string, any>) };
                            } else if (key === 'metadata') {
                                fusedContext.metadata = { ...fusedContext.metadata, ...(enrichedData as Record<string, any>) };
                            }
                        });
                    }
                }
            } catch (e) {
                // Log or handle source-specific failure without stopping enrichment
            }
        }

        // 2. Apply Custom Resolver Fusion
        for (const [name, resolver] of this.customResolvers.entries()) {
            try {
                const resolvedContext = resolver(fusedContext);
                // Assuming resolvers return a structure that can update the context
                if (typeof resolvedContext === 'object' && resolvedContext !== null) {
                    if ('history' in resolvedContext) {
                        fusedContext.history = [...(fusedContext.history as Message[]), ...(resolvedContext.history as Message[])];
                    }
                    if ('knowledge' in resolvedContext) {
                        fusedContext.knowledge = { ...fusedContext.knowledge, ...(resolvedContext.knowledge as Record<string, any>) };
                    }
                    if ('state' in resolvedContext) {
                        fusedContext.state = { ...fusedContext.state, ...(resolvedContext.state as Record<string, any>) };
                    }
                    if ('metadata' in resolvedContext) {
                        fusedContext.metadata = { ...fusedContext.metadata, ...(resolvedContext.metadata as Record<string, any>) };
                    }
                }
            } catch (e) {
                // Log or handle resolver failure
            }
        }

        // 3. Final Structured Payload Generation (Example: Combining everything into a single output structure)
        return {
            final_history: fusedContext.history,
            final_knowledge_summary: JSON.stringify(fusedContext.knowledge),
            final_state_snapshot: JSON.stringify(fusedContext.state),
            final_metadata_context: JSON.stringify(fusedContext.metadata),
            combined_context_payload: fusedContext,
        };
    }
}
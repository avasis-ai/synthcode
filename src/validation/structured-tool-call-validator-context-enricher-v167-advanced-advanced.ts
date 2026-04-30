import { AgentContext, KnowledgeGraphContext, ToolCall, Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export class StructuredToolCallValidatorContextEnricherV167AdvancedAdvanced {
    enrich(
        rawToolCall: ToolCall,
        agentContext: AgentContext,
        knowledgeGraphContext: KnowledgeGraphContext
    ): { enrichedToolCall: ToolCall; enrichedContext: any } {
        const enrichedToolCall = this.enrichToolCall(rawToolCall, agentContext, knowledgeGraphContext);
        const enrichedContext = this.enrichContext(agentContext, knowledgeGraphContext, rawToolCall);

        return {
            enrichedToolCall: enrichedToolCall,
            enrichedContext: enrichedContext
        };
    }

    private enrichToolCall(
        rawToolCall: ToolCall,
        agentContext: AgentContext,
        knowledgeGraphContext: KnowledgeGraphContext
    ): ToolCall {
        let enrichedCall = { ...rawToolCall };

        const relatedEntities = knowledgeGraphContext.getRelatedEntities(rawToolCall.name, rawToolCall.input);

        if (relatedEntities.length > 0) {
            enrichedCall.context_hints = relatedEntities.map(e => ({
                entity_id: e.id,
                type: e.type,
                description: e.description
            }));
        }

        const recentInteractions = this.findMatchingInteractions(rawToolCall.name, agentContext);

        if (recentInteractions.length > 0) {
            enrichedCall.history_match_count = recentInteractions.length;
            enrichedCall.suggested_inputs = this.generateSuggestedInputs(rawToolCall.name, rawToolCall.input, recentInteractions);
        } else {
            enrichedCall.history_match_count = 0;
            enrichedCall.suggested_inputs = null;
        }

        return enrichedCall;
    }

    private enrichContext(
        agentContext: AgentContext,
        knowledgeGraphContext: KnowledgeGraphContext,
        rawToolCall: ToolCall
    ): any {
        const contextEnrichment: {
            semantic_relevance_score: number;
            feasibility_assessment: string[];
            suggested_next_steps: string[];
        } = {
            semantic_relevance_score: 0.5, // Default baseline
            feasibility_assessment: [],
            suggested_next_steps: []
        };

        // 1. Semantic Relevance Check (KG based)
        const relatedEntities = knowledgeGraphContext.getRelatedEntities(rawToolCall.name, rawToolCall.input);
        if (relatedEntities.length > 0) {
            contextEnrichment.semantic_relevance_score = Math.min(1.0, 0.5 + relatedEntities.length * 0.15);
            contextEnrichment.feasibility_assessment.push(`High semantic relevance detected via KG for entities: ${relatedEntities.map(e => e.id).join(', ')}.`);
        } else {
            contextEnrichment.feasibility_assessment.push("No strong semantic links found in the Knowledge Graph.");
        }

        // 2. Contextual Feasibility Check (History based)
        const historyMatches = this.findMatchingInteractions(rawToolCall.name, agentContext);
        if (historyMatches.length > 0) {
            contextEnrichment.feasibility_assessment.push(`Tool usage aligns with ${historyMatches.length} recent domain interactions.`);
        } else {
            contextEnrichment.feasibility_assessment.push("Tool usage appears novel or outside immediate historical context.");
        }

        // 3. Synthesis of Next Steps
        if (contextEnrichment.semantic_relevance_score > 0.8 && historyMatches.length > 0) {
            contextEnrichment.suggested_next_steps.push("Proceed with tool call; high confidence in relevance and history.");
        } else if (contextEnrichment.semantic_relevance_score < 0.6) {
            contextEnrichment.suggested_next_steps.push("Review tool call parameters; low semantic confidence.");
        }

        return contextEnrichment;
    }

    private findMatchingInteractions(
        toolName: string,
        agentContext: AgentContext
    ): { message_id: string; role: "user" | "assistant"; content: string }[] {
        const matchingInteractions: { message_id: string; role: "user" | "assistant"; content: string }[] = [];
        for (const message of agentContext.messages) {
            if (message.role === "user" || message.role === "assistant") {
                const contentText = message.content.map(block => {
                    if (block.type === "text") return block.text;
                    if (block.type === "tool_use") return `Tool call to ${block.name}`;
                    return "";
                }).join(" ").toLowerCase();

                if (contentText.includes(toolName.toLowerCase())) {
                    matchingInteractions.push({
                        message_id: message.id,
                        role: message.role === "user" ? "user" : "assistant",
                        content: contentText
                    });
                }
            }
        }
        return matchingInteractions;
    }

    private generateSuggestedInputs(
        toolName: string,
        currentInput: Record<string, unknown>,
        historyMatches: { message_id: string; role: "user" | "assistant"; content: string }[]
    ): Record<string, unknown> | null {
        if (historyMatches.length === 0) {
            return null;
        }

        // Simple heuristic: Use the input from the most recent matching user message if available
        const lastUserMatch = historyMatches.filter(m => m.role === "user").pop();

        if (lastUserMatch) {
            // In a real scenario, this would parse the content to extract structured data.
            // For this mock, we'll just return a placeholder based on the tool name.
            return {
                suggested_by_history: true,
                source_context: lastUserMatch.content.substring(0, 50) + "...",
                fallback_value: currentInput["primary_key"] || "default_id"
            };
        }
        return null;
    }
}
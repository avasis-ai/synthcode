import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface HistoryContext {
    messages: Message[];
    source: "history";
}

interface MetadataContext {
    metadata: Record<string, unknown>;
    source: "metadata";
}

interface CurrentToolContext {
    tool_name: string;
    tool_schema: Record<string, any>;
    current_input: Record<string, unknown>;
    source: "current_tool";
}

interface ContextSources {
    history: HistoryContext;
    metadata: MetadataContext;
    tool: CurrentToolContext;
}

interface WeightedContextPayload {
    enriched_context: Record<string, any>;
    relevance_scores: Record<string, number>;
}

type ContextEnricher = (sources: ContextSources) => WeightedContextPayload;

const WEIGHTS: Record<string, number> = {
    history: 0.4,
    metadata: 0.2,
    tool: 0.4,
};

const calculateSimilarityScore = (context: any, source: string): number => {
    if (source === "history") {
        const history = context.messages;
        if (!history || history.length === 0) return 0.1;
        const lastUserMessage = history.filter((m: Message) => m.role === "user").pop()?.content || "";
        const lastAssistantMessage = history.filter((m: Message) => m.role === "assistant").pop()?.content || "";
        const combinedText = (lastUserMessage + " " + lastAssistantMessage).toLowerCase();
        return Math.min(1.0, 0.5 + (combinedText.length % 10) / 20);
    }
    if (source === "metadata") {
        const metadata = context.metadata;
        const keys = Object.keys(metadata);
        return Math.min(1.0, 0.3 + (keys.length % 5) / 10);
    }
    if (source === "current_tool") {
        const tool = context as CurrentToolContext;
        return Math.min(1.0, 0.4 + (Object.keys(tool.tool_schema).length % 5) / 10);
    }
    return 0.0;
};

const enrichContext = (sources: ContextSources): WeightedContextPayload => {
    const scores: Record<string, number> = {};
    const enrichedData: Record<string, any> = {};

    const calculateWeightedScore = (sourceKey: keyof ContextSources, context: ContextSources[keyof ContextSources]): { score: number, data: any } => {
        const weight = WEIGHTS[sourceKey] || 0.1;
        const similarity = calculateSimilarityScore(context, sourceKey);
        const finalScore = weight * (similarity * 0.8 + 0.2); // Blend weight and similarity
        return { score: finalScore, data: context };
    };

    const historyResult = calculateWeightedScore("history", sources.history);
    const metadataResult = calculateWeightedScore("metadata", sources.metadata);
    const toolResult = calculateWeightedScore("tool", sources.tool);

    const totalScore = historyResult.score + metadataResult.score + toolResult.score;

    const finalPayload: WeightedContextPayload = {
        relevance_scores: {
            history: historyResult.score,
            metadata: metadataResult.score,
            tool: toolResult.score,
            total: totalScore
        },
        enriched_context: {
            history: historyResult.data,
            metadata: metadataResult.data,
            tool: toolResult.data,
            combined_summary: `[Weighted Context Summary] Total Score: ${totalScore.toFixed(3)}. History relevance: ${historyResult.score.toFixed(2)}. Tool relevance: ${toolResult.score.toFixed(2)}.`
        }
    };

    return finalPayload;
};

export const structuredToolCallValidatorContextEnricher = (sources: ContextSources): WeightedContextPayload => {
    return enrichContext(sources);
};
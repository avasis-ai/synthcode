import { AgentContext, Goal } from "./types";

interface KnowledgeGapDetector {
    detectGaps(context: AgentContext, goal: Goal): {
        gaps: string[];
        requiredTopics: string[];
    } | null;
}

interface KnowledgeRetrievalStep {
    query: string;
    source: "internal_graph" | "external_search";
}

interface KnowledgeRetriever {
    retrieve(steps: KnowledgeRetrievalStep[]): Promise<{
        enrichedContext: AgentContext;
        retrievedData: Record<string, string>;
    }>;
}

class KnowledgeGapFiller {
    private detector: KnowledgeGapDetector;
    private retriever: KnowledgeRetriever;

    constructor(detector: KnowledgeGapDetector, retriever: KnowledgeRetriever) {
        this.detector = detector;
        this.retriever = retriever;
    }

    async fillGaps(context: AgentContext, goal: Goal): Promise<{
        enrichedContext: AgentContext;
        retrievedData: Record<string, string>;
    }> {
        const detectionResult = this.detector.detectGaps(context, goal);

        if (!detectionResult || detectionResult.gaps.length === 0) {
            return {
                enrichedContext: context,
                retrievedData: {},
            };
        }

        const requiredTopics = detectionResult.requiredTopics;

        if (requiredTopics.length === 0) {
            return {
                enrichedContext: context,
                retrievedData: {},
            };
        }

        const retrievalSteps: KnowledgeRetrievalStep[] = requiredTopics.map(topic => ({
            query: `Detailed information regarding ${topic}.`,
            source: "internal_graph"
        }));

        console.log("Knowledge Gap Detected. Initiating structured retrieval step...");

        const result = await this.retriever.retrieve(retrievalSteps);

        return {
            enrichedContext: result.enrichedContext,
            retrievedData: result.retrievedData,
        };
    }
}

export { KnowledgeGapFiller };
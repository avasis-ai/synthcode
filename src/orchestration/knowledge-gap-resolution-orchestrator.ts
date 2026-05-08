import { KnowledgeDetector, InformationRetriever, KnowledgeSynthesizer, KnowledgeValidator } from "./services.js";

type KnowledgeGap = {
    gapId: string;
    context: string;
    requiredInformation: string;
    severity: "low" | "medium" | "high";
};

interface ResolutionStep {
    stepId: string;
    type: "retrieve" | "synthesize" | "validate";
    sourcePriority: number;
    inputContext: string;
    params: Record<string, unknown>;
}

interface ResolutionPlan {
    steps: ResolutionStep[];
    maxAttempts: number;
}

export class KnowledgeGapResolutionOrchestrator {
    private detector: KnowledgeDetector;
    private retriever: InformationRetriever;
    private synthesizer: KnowledgeSynthesizer;
    private validator: KnowledgeValidator;

    constructor(
        detector: KnowledgeDetector,
        retriever: InformationRetriever,
        synthesizer: KnowledgeSynthesizer,
        validator: KnowledgeValidator
    ) {
        this.detector = detector;
        this.retriever = retriever;
        this.synthesizer = synthesizer;
        this.validator = validator;
    }

    public async planResolution(gap: KnowledgeGap): Promise<ResolutionPlan> {
        const plan: ResolutionStep[] = [];
        let currentContext = gap.context;

        if (gap.severity === "high") {
            plan.push({
                stepId: "initial_retrieval",
                type: "retrieve",
                sourcePriority: 1,
                inputContext: gap.requiredInformation,
                params: { query: gap.requiredInformation }
            });
        }

        plan.push({
            stepId: "synthesis_step",
            type: "synthesize",
            sourcePriority: 2,
            inputContext: currentContext,
            params: { gapDetails: gap.requiredInformation }
        });

        plan.push({
            stepId: "final_validation",
            type: "validate",
            sourcePriority: 3,
            inputContext: currentContext,
            params: { goal: "Resolve knowledge gap" }
        });

        return {
            steps: plan,
            maxAttempts: 3
        };
    }

    public async executeResolution(plan: ResolutionPlan): Promise<string> {
        let currentKnowledgePayload: string = "";
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= plan.maxAttempts; attempt++) {
            try {
                let intermediatePayload: string = currentKnowledgePayload;

                for (const step of plan.steps) {
                    if (step.type === "retrieve") {
                        intermediatePayload = await this.retriever.retrieve(step.params);
                    } else if (step.type === "synthesize") {
                        intermediatePayload = await this.synthesizer.synthesize(step.params, intermediatePayload);
                    } else if (step.type === "validate") {
                        const validationResult = await this.validator.validate(step.params, intermediatePayload);
                        intermediatePayload = validationResult.validatedKnowledge;
                    }
                }

                currentKnowledgePayload = intermediatePayload;
                return currentKnowledgePayload;

            } catch (e) {
                lastError = e as Error;
                console.warn(`Attempt ${attempt} failed. Retrying...`);
                if (attempt === plan.maxAttempts) {
                    throw new Error(`Failed to resolve knowledge gap after ${plan.maxAttempts} attempts. Last error: ${lastError?.message}`);
                }
            }
        }
        throw new Error("Execution failed unexpectedly.");
    }
}
import { Message, ContentBlock, TextBlock } from "./types";

interface FailureReport {
    type: "constraint_violation" | "ambiguity" | "poor_performance" | "unknown";
    details: string;
    severity: "low" | "medium" | "high";
    failed_output: string;
}

type PromptTemplate = string;

interface PromptModificationPayload {
    modification_type: "add_constraint" | "clarify_instruction" | "reformat_output";
    suggested_text: string;
    placement: "start" | "end" | "mid";
    confidence_score: number;
}

interface OptimizationRule {
    analyze(report: FailureReport, template: PromptTemplate): {
        payload: PromptModificationPayload | null;
        score: number;
    };
}

class PromptOptimizationLoop {
    private rules: OptimizationRule[];

    constructor(rules: OptimizationRule[] = []) {
        this.rules = rules;
    }

    private applyModification(template: PromptTemplate, payload: PromptModificationPayload): string {
        let modifiedTemplate = template;
        const { placement, suggested_text } = payload;

        if (placement === "start") {
            modifiedTemplate = `${suggested_text}\n\n---SYSTEM INSTRUCTION---\n${modifiedTemplate}`;
        } else if (placement === "end") {
            modifiedTemplate = `${modifiedTemplate}\n\n---OUTPUT CONSTRAINT---\n${suggested_text}`;
        } else {
            modifiedTemplate = modifiedTemplate.replace("END_MARKER", `${suggested_text}\nEND_MARKER`);
        }
        return modifiedTemplate;
    }

    public suggestOptimization(
        report: FailureReport,
        template: PromptTemplate
    ): {
        optimized_template: PromptTemplate;
        confidence_score: number;
        payload: PromptModificationPayload;
    } {
        let bestPayload: PromptModificationPayload | null = null;
        let maxScore = -1;

        for (const rule of this.rules) {
            const result = rule.analyze(report, template);

            if (result.payload && result.score > maxScore) {
                maxScore = result.score;
                bestPayload = result.payload;
            }
        }

        if (!bestPayload) {
            return {
                optimized_template: template,
                confidence_score: 0.1,
                payload: {
                    modification_type: "none",
                    suggested_text: "No specific optimization found.",
                    placement: "start",
                    confidence_score: 0.1
                }
            };
        }

        const optimizedTemplate = this.applyModification(template, bestPayload);

        return {
            optimized_template: optimizedTemplate,
            confidence_score: maxScore,
            payload: bestPayload
        };
    }
}

class AmbiguityReductionRule implements OptimizationRule {
    analyze(report: FailureReport, template: PromptTemplate): {
        payload: PromptModificationPayload | null;
        score: number;
    } {
        if (report.type === "ambiguity" && report.severity === "high") {
            const payload: PromptModificationPayload = {
                modification_type: "clarify_instruction",
                suggested_text: "When faced with ambiguity, prioritize the most common use case and explicitly state assumptions.",
                placement: "start",
                confidence_score: 0.85
            };
            return { payload, score: 0.85 };
        }
        return { payload: null, score: 0 };
    }
}

class ConstraintEmphasisRule implements OptimizationRule {
    analyze(report: FailureReport, template: PromptTemplate): {
        payload: PromptModificationPayload | null;
        score: number;
    } {
        if (report.type === "constraint_violation" && report.severity === "high") {
            const payload: PromptModificationPayload = {
                modification_type: "add_constraint",
                suggested_text: "CRITICAL: You MUST adhere to the JSON schema provided. Do not include any preamble or explanation outside the JSON block.",
                placement: "end",
                confidence_score: 0.92
            };
            return { payload, score: 0.92 };
        }
        return { payload: null, score: 0 };
    }
}

export { PromptOptimizationLoop, AmbiguityReductionRule, ConstraintEmphasisRule };
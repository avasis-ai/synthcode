import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type GapType = "MissingRelationship" | "MissingEntity" | "MissingConstraint" | "UndefinedContext";

export interface KnowledgeGapReport {
    gapType: GapType;
    location: string;
    description: string;
    suggestedData: Record<string, unknown>;
}

export interface FailureContext {
    source: "Validation" | "Constraint" | "Retrieval" | "Schema";
    contextDetails: string;
    violatedSchema?: Record<string, any>;
    failedOperation?: string;
}

export class KnowledgeGapDetector {
    detectGaps(context: FailureContext): KnowledgeGapReport[] {
        const reports: KnowledgeGapReport[] = [];

        if (!context.contextDetails) {
            return [];
        }

        if (context.source === "Validation") {
            const validationGaps = this.analyzeValidationContext(context);
            reports.push(...validationGaps);
        }

        if (context.source === "Constraint") {
            const constraintGaps = this.analyzeConstraintContext(context);
            reports.push(...constraintGaps);
        }

        if (context.source === "Retrieval" && context.contextDetails.includes("No matching triples found")) {
            const retrievalGap = {
                gapType: "MissingEntity",
                location: "Knowledge Graph",
                description: "The required entities or relationships could not be retrieved from the knowledge base.",
                suggestedData: {
                    action: "Suggest adding triples related to the query subject.",
                    example: "e.g., (Subject, has_relationship, Object)"
                }
            };
            reports.push(retrievalGap);
        }

        return reports;
    }

    private analyzeValidationContext(context: FailureContext): KnowledgeGapReport[] {
        const reports: KnowledgeGapReport[] = [];
        
        if (context.violatedSchema) {
            const schema = context.violatedSchema;
            
            if (schema.requiredFieldMissing) {
                const report: KnowledgeGapReport = {
                    gapType: "MissingConstraint",
                    location: "Schema Validation",
                    description: `The field '${schema.requiredFieldMissing}' is mandatory but was not provided in the input context.`,
                    suggestedData: {
                        field: schema.requiredFieldMissing,
                        type: "string",
                        example: "A descriptive string value."
                    }
                };
                reports.push(report);
            }

            if (schema.dataMismatch) {
                const report: KnowledgeGapReport = {
                    gapType: "MissingRelationship",
                    location: "Schema Validation",
                    description: `The data type for '${schema.dataMismatch.field}' was incorrect. Expected ${schema.dataMismatch.expectedType}.`,
                    suggestedData: {
                        field: schema.dataMismatch.field,
                        expectedType: schema.dataMismatch.expectedType,
                        correction: "Review the schema definition for type compatibility."
                    }
                };
                reports.push(report);
            }
        }
        return reports;
    }

    private analyzeConstraintContext(context: FailureContext): KnowledgeGapReport[] {
        const reports: KnowledgeGapReport[] = [];
        
        if (context.contextDetails.includes("Cardinality violation")) {
            const report: KnowledgeGapReport = {
                gapType: "MissingRelationship",
                location: "Context Constraint",
                description: "A cardinality violation occurred. The relationship requires a minimum of N instances, but only M were found.",
                suggestedData: {
                    constraint: "Cardinality",
                    requiredMin: 2,
                    foundMax: 1,
                    action: "Provide additional related entities to satisfy the constraint."
                }
            };
            reports.push(report);
        }
        return reports;
    }
}
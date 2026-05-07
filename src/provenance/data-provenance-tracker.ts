export type TransformationDetails = {
    stepId: string;
    toolName: string;
    description: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    timestamp: number;
};

export interface TransformationStep {
    stepId: string;
    description: string;
    details: TransformationDetails;
}

export interface ProvenanceMetadata {
    sourceId: string;
    initialPayloadHash: string;
    sourceTimestamp: number;
    transformationHistory: TransformationStep[];
    currentPayloadHash: string;
}

export class DataProvenanceTracker {
    private metadata: ProvenanceMetadata;

    constructor() {
        this.metadata = {
            sourceId: "",
            initialPayloadHash: "",
            sourceTimestamp: 0,
            transformationHistory: [],
            currentPayloadHash: ""
        };
    }

    private generateHash(payload: Record<string, unknown>): string {
        // Simple JSON stringify hash simulation for demonstration
        return JSON.stringify(payload).length.toString();
    }

    recordSource(payload: Record<string, unknown>, sourceId: string): void {
        this.metadata.sourceId = sourceId;
        this.metadata.initialPayloadHash = this.generateHash(payload);
        this.metadata.sourceTimestamp = Date.now();
        this.metadata.transformationHistory = [];
        this.metadata.currentPayloadHash = this.metadata.initialPayloadHash;
    }

    recordTransformation(payload: Record<string, unknown>, stepId: string, toolName: string, description: string, inputSchema: Record<string, unknown>, outputSchema: Record<string, unknown>): void {
        const step: TransformationStep = {
            stepId: stepId,
            description: description,
            details: {
                stepId: stepId,
                toolName: toolName,
                description: description,
                inputSchema: inputSchema,
                outputSchema: outputSchema,
                timestamp: Date.now()
            }
        };

        this.metadata.transformationHistory.push(step);
        this.metadata.currentPayloadHash = this.generateHash(payload);
    }

    getMetadata(): ProvenanceMetadata {
        return this.metadata;
    }

    getHistory(): TransformationStep[] {
        return this.metadata.transformationHistory;
    }
}

export { DataProvenanceTracker };
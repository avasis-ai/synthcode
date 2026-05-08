import { EmbeddingService } from "../embedding-service";

export type FieldName = string;
export type ToolId = string;
export type SemanticClusterId = string;

export interface FieldEmbedding {
  field_name: FieldName;
  tool_id: ToolId;
  embedding: Float32Array;
  cluster_id: SemanticClusterId;
  count: number;
}

export interface ToolPayload {
  tool_id: ToolId;
  input: Record<FieldName, unknown>;
  output: Record<FieldName, unknown>;
}

export interface SemanticDriftReport {
  tool_id: ToolId;
  field_name: FieldName;
  drift_detected: boolean;
  similarity_score: number;
  message: string;
}

export class SemanticToolSignatureDriftDetector {
  private embeddingService: EmbeddingService;
  private historicalSignatures: Map<ToolId, Map<FieldName, FieldEmbedding[]>>;
  private readonly driftThreshold: number;

  constructor(embeddingService: EmbeddingService, driftThreshold: number = 0.7) {
    this.embeddingService = embeddingService;
    this.historicalSignatures = new Map();
    this.driftThreshold = driftThreshold;
  }

  private async getEmbedding(value: unknown): Promise<Float32Array> {
    if (typeof value !== 'string') {
      return new Float32Array(0);
    }
    return this.embeddingService.embed(value);
  }

  private async processAndStorePayload(payload: ToolPayload): Promise<void> {
    const toolId = payload.tool_id;
    const signatures = new Map<FieldName, FieldEmbedding[]>();

    const processFields = async (record: Record<FieldName, unknown>): Promise<void> => {
      for (const [fieldName, value] of Object.entries(record)) {
        if (typeof value !== 'string') continue;

        const embedding = await this.getEmbedding(value);
        const newEmbedding: FieldEmbedding = {
          field_name: fieldName,
          tool_id: toolId,
          embedding: embedding,
          cluster_id: 'initial',
          count: 1,
        };

        if (!signatures.has(fieldName)) {
          signatures.set(fieldName, [newEmbedding]);
        } else {
          signatures.get(fieldName)!.push(newEmbedding);
        }
      }
    };

    await processFields(payload.input);
    await processFields(payload.output);

    // In a real implementation, we would cluster and update the historical signatures here.
    // For simulation, we just store the raw embeddings.
    if (!this.historicalSignatures.has(toolId)) {
      this.historicalSignatures.set(toolId, new Map());
    }
    
    const toolSignatures = this.historicalSignatures.get(toolId)!;
    for (const [fieldName, embeddings] of signatures.entries()) {
        toolSignatures.set(fieldName, embeddings);
    }
  }

  private async calculateSimilarity(embeddingA: Float32Array, embeddingB: Float32Array): Promise<number> {
    if (embeddingA.length !== embeddingB.length || embeddingA.length === 0) {
      return 0.0;
    }
    let sumOfProducts = 0.0;
    for (let i = 0; i < embeddingA.length; i++) {
      sumOfProducts += embeddingA[i] * embeddingB[i];
    }
    const magnitudeA = Math.sqrt(embeddingA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(embeddingB.reduce((acc, val) => acc + val * val, 0));
    return sumOfProducts / (magnitudeA * magnitudeB);
  }

  public async detectDrift(payload: ToolPayload): Promise<SemanticDriftReport[]> {
    const toolId = payload.tool_id;
    const historicalSignatures = this.historicalSignatures.get(toolId);
    const driftReports: SemanticDriftReport[] = [];

    if (!historicalSignatures) {
      return [];
    }

    const checkFields = async (record: Record<FieldName, unknown>): Promise<void> => {
      for (const [fieldName, value] of Object.entries(record)) {
        if (typeof value !== 'string') continue;

        const currentEmbedding = await this.getEmbedding(value);
        const historicalEmbeddings = historicalSignatures.get(fieldName);

        if (!historicalEmbeddings || historicalEmbeddings.length === 0) {
          continue;
        }

        // Check similarity against all historical embeddings for this field
        let maxSimilarity = 0.0;
        for (const historicalEmbedding of historicalEmbeddings) {
          const similarity = await this.calculateSimilarity(currentEmbedding, historicalEmbedding.embedding);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
          }
        }

        const driftDetected = maxSimilarity < this.driftThreshold;
        const report: SemanticDriftReport = {
          tool_id: toolId,
          field_name: fieldName,
          drift_detected: driftDetected,
          similarity_score: maxSimilarity,
          message: driftDetected ? `Semantic drift detected. Similarity (${maxSimilarity.toFixed(2)}) is below threshold (${this.driftThreshold}).` : `Semantic consistency maintained.`,
        };
        driftReports.push(report);
      }
    };

    await checkFields(payload.input);
    await checkFields(payload.output);

    return driftReports;
  }

  public async ingestPayload(payload: ToolPayload): Promise<void> {
    await this.processAndStorePayload(payload);
  }
}
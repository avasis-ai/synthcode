import { EmbeddingsService } from "../services/embeddings-service";

export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
};

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = any;

export type LoopEvent = any;

export class SemanticContextDeduplicator {
    private embeddingsService: EmbeddingsService;

    constructor(embeddingsService: EmbeddingsService) {
        this.embeddingsService = embeddingsService;
    }

    private extractTextContent(message: Message): string {
        if (message.role === "user" && typeof message.content === 'string') {
            return message.content;
        }
        if (message.role === "tool" && typeof message.content === 'string') {
            return message.content;
        }
        if (message.role === "assistant" && Array.isArray(message.content)) {
            return message.content.map(block => {
                if (typeof block === 'object' && 'text' in block && typeof block.text === 'string') {
                    return block.text;
                }
                return "";
            }).join(" ");
        }
        return "";
    }

    public async deduplicate(
        contextChunks: Message[],
        similarityThreshold: number
    ): Promise<Message[]> {
        if (contextChunks.length === 0) {
            return [];
        }

        const texts: string[] = contextChunks.map(this.extractTextContent);
        const embeddings: number[][] = await this.embeddingsService.getEmbeddings(texts);

        const keepIndices: Set<number> = new Set<number>();

        for (let i = 0; i < embeddings.length; i++) {
            if (keepIndices.has(i)) {
                continue;
            }

            let isRedundant = false;
            for (let j = 0; j < i; j++) {
                if (keepIndices.has(j)) {
                    continue;
                }

                const similarity = this.calculateCosineSimilarity(embeddings[i], embeddings[j]);

                if (similarity > similarityThreshold) {
                    isRedundant = true;
                    break;
                }
            }

            if (!isRedundant) {
                keepIndices.add(i);
            }
        }

        const deduplicatedContext: Message[] = [];
        const sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);

        for (const index of sortedIndices) {
            deduplicatedContext.push(contextChunks[index]);
        }

        return deduplicatedContext;
    }

    private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / Math.sqrt(normA * normB);
    }
}
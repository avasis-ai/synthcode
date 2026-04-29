import { ContextManager, Retriever } from "./context-manager";

export interface SourceMetadata {
  source_id: string;
  source_type: "file" | "document";
  path: string;
  section_header: string | null;
}

export interface AttributedContextChunk {
  chunk: string;
  metadata: SourceMetadata;
}

export interface ContextualKnowledgeRetrieverWithAttribution {
  retrieve(query: string, topK: number): Promise<AttributedContextChunk[]>;
}

export class ContextualKnowledgeRetrieverWithAttribution implements ContextualKnowledgeRetrieverWithAttribution {
  private underlyingRetriever: Retriever;

  constructor(underlyingRetriever: Retriever) {
    this.underlyingRetriever = underlyingRetriever;
  }

  async retrieve(query: string, topK: number): Promise<AttributedContextChunk[]> {
    const rawChunks = await this.underlyingRetriever.retrieve(query, topK);

    const attributedChunks: AttributedContextChunk[] = await Promise.all(
      rawChunks.map(async (chunk) => {
        // Simulate fetching or assuming metadata is available from the underlying retriever's context
        // In a real system, the underlying retriever would need to be updated to return metadata.
        // For this implementation, we simulate metadata generation based on chunk content/index.
        const simulatedMetadata: SourceMetadata = {
          source_id: `doc-${Math.random().toString(36).substring(2, 9)}`,
          source_type: "file",
          path: `/knowledge/source/${Math.floor(Math.random() * 10)}`,
          section_header: `Section ${Math.floor(Math.random() * 5) + 1}`,
        };

        return {
          chunk: chunk.text,
          metadata: simulatedMetadata,
        };
      })
    );

    return attributedChunks;
  }
}

export class ContextualKnowledgeManager {
  private retriever: ContextualKnowledgeRetrieverWithAttribution;

  constructor(underlyingRetriever: Retriever) {
    this.retriever = new ContextualKnowledgeRetrieverWithAttribution(underlyingRetriever);
  }

  public async getContext(query: string, topK: number): Promise<{
    context: string;
    sources: SourceMetadata[];
  }> {
    const attributedChunks = await this.retriever.retrieve(query, topK);

    const contextChunks: string[] = attributedChunks.map(item => item.chunk);
    const sources: SourceMetadata[] = attributedChunks.map(item => item.metadata);

    const combinedContext = contextChunks.join("\n\n---\n\n");

    return {
      context: combinedContext,
      sources: sources,
    };
  }
}
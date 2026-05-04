import { Message, ToolResultMessage } from "./types";

interface SemanticContext {
  sourceMessage: Message;
  // In a real system, this might hold embeddings or structured summaries
  semanticSummary: string;
}

export class ContextualToolCallDependencyResolver {
  private readonly embeddingSimilarityThreshold: number;

  constructor(embeddingSimilarityThreshold: number = 0.7) {
    this.embeddingSimilarityThreshold = embeddingSimilarityThreshold;
  }

  private calculateSemanticSimilarity(
    context: SemanticContext,
    requiredToolName: string,
    requiredToolDescription: string
  ): number {
    // Mock implementation: In a real scenario, this would use an embedding model
    // to compare the context's embedding against the expected tool's embedding.
    const contextKeywords = context.semanticSummary.toLowerCase();
    const toolKeywords = (requiredToolName + " " + requiredToolDescription).toLowerCase();

    if (!contextKeywords || !toolKeywords) {
      return 0;
    }

    // Simple keyword overlap score as a placeholder for cosine similarity
    const contextWords = new Set(contextKeywords.split(/\s+/).filter(Boolean));
    const toolWords = new Set(toolKeywords.split(/\s+/).filter(Boolean));

    let overlapCount = 0;
    for (const word of toolWords) {
      if (contextWords.has(word)) {
        overlapCount++;
      }
    }

    // Normalize by the number of unique words in the tool description
    return overlapCount / Math.max(1, toolWords.size);
  }

  /**
   * Determines if the current tool call request is contextually dependent on the semantic content
   * derived from a previous tool result.
   * @param context The semantic context derived from preceding messages/results.
   * @param requestedToolName The name of the tool the user is currently requesting.
   * @param requestedToolDescription The description of the tool the user is currently requesting.
   * @returns A boolean indicating if a strong contextual dependency is detected.
   */
  public resolveDependency(
    context: SemanticContext,
    requestedToolName: string,
    requestedToolDescription: string
  ): boolean {
    const similarity = this.calculateSemanticSimilarity(
      context,
      requestedToolName,
      requestedToolDescription
    );

    return similarity >= this.embeddingSimilarityThreshold;
  }

  /**
   * Suggests required preceding tools based on semantic context.
   * This is a simplified version of what a full planner might do.
   * @param context The semantic context.
   * @param availableTools A map of tool names to their descriptions/schemas.
   * @returns An array of suggested tool names that might be needed.
   */
  public suggestDependencies(
    context: SemanticContext,
    availableTools: Record<string, string>
  ): string[] {
    const suggestions: string[] = [];
    for (const [toolName, description] of Object.entries(availableTools)) {
      const similarity = this.calculateSemanticSimilarity(
        context,
        toolName,
        description
      );
      if (similarity > 0.5) { // Lower threshold for suggestion phase
        suggestions.push(toolName);
      }
    }
    return suggestions;
  }
}
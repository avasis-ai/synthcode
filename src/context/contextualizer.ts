import { UserMessage, AssistantMessage, ToolResultMessage, Message } from "./types";

export interface ContextualMetadata {
  [key: string]: unknown;
}

export interface ProjectContext {
  projectId: string;
  userId: string;
  sessionPriority: number;
  lastActivityTimestamp: number;
}

export interface ToolContext {
  messages: Message[];
  projectId: string;
  // Other context fields might exist here
}

export interface MetadataProvider {
  getMetadata(): ContextualMetadata;
}

export class Contextualizer {
  private projectContext: ProjectContext;
  private metadataProvider: MetadataProvider | null;

  constructor(projectContext: ProjectContext, metadataProvider?: MetadataProvider) {
    this.projectContext = projectContext;
    this.metadataProvider = metadataProvider;
  }

  private getMetadata(): ContextualMetadata {
    if (this.metadataProvider) {
      return this.metadataProvider.getMetadata();
    }
    return {};
  }

  enrichContext(context: ToolContext): ToolContext & { metadata: ContextualMetadata } {
    const metadata = this.getMetadata();

    const enrichedContext: ToolContext & { metadata: ContextualMetadata } = {
      ...context,
      metadata: metadata,
    };

    return enrichedContext;
  }
}
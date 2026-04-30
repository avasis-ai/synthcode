import { Message, ContentBlock, ToolResultMessage } from "./types";

export interface FailureDetails {
  failureType: string;
  context: Record<string, unknown>;
  originalMessage: Message;
}

export interface EnrichmentMetadata {
  suggestedFix: string;
  severity: "warning" | "error" | "info";
  documentationLink?: string;
  suggestedSchemaUpdate?: Record<string, any>;
}

export class StructuredToolOutputValidationContextEnricher {
  private metadataService: (failureDetails: FailureDetails) => Promise<EnrichmentMetadata | null>;

  constructor(metadataService: (failureDetails: FailureDetails) => Promise<EnrichmentMetadata | null>) {
    this.metadataService = metadataService;
  }

  public async enrichContext(
    failureDetails: FailureDetails,
    currentContext: Record<string, any>
  ): Promise<{ enrichedDetails: FailureDetails; metadata: EnrichmentMetadata | null }> {
    const metadata = await this.metadataService(failureDetails);

    const enrichedDetails: FailureDetails = {
      ...failureDetails,
      context: {
        ...failureDetails.context,
        ...currentContext,
      },
    };

    return { enrichedDetails, metadata };
  }
}
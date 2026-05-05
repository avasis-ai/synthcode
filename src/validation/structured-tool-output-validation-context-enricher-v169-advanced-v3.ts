import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface IExternalStateSource {
  getSnapshot(): Record<string, unknown>;
}

export interface ITemporalSource {
  getCurrentTimestamp(): number;
  getConstraintWindow(): { start: number; end: number };
}

export interface ICapabilityMetadataSource {
  getCapabilities(): Record<string, any>;
}

export interface ValidationContext {
  messages: Message[];
  toolOutput: Record<string, any>;
  externalState?: Record<string, unknown>;
  temporalContext?: {
    timestamp: number;
    constraintWindow: { start: number; end: number };
  };
  capabilities?: Record<string, any>;
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly externalStateSource: IExternalStateSource;
  private readonly temporalSource: ITemporalSource;
  private readonly capabilitySource: ICapabilityMetadataSource;

  constructor(
    externalStateSource: IExternalStateSource,
    temporalSource: ITemporalSource,
    capabilitySource: ICapabilityMetadataSource
  ) {
    this.externalStateSource = externalStateSource;
    this.temporalSource = temporalSource;
    this.capabilitySource = capabilitySource;
  }

  enrich(
    context: ValidationContext
  ): ValidationContext {
    const externalState = this.externalStateSource.getSnapshot();
    const temporalContext = {
      timestamp: this.temporalSource.getCurrentTimestamp(),
      constraintWindow: this.temporalSource.getConstraintWindow(),
    };
    const capabilities = this.capabilitySource.getCapabilities();

    return {
      ...context,
      externalState: externalState,
      temporalContext: temporalContext,
      capabilities: capabilities,
    };
  }
}
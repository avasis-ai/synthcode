import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types.js";

export type ModalityInput = {
  type: "image" | "audio" | "text" | "structured";
  data: any;
};

export interface ContextPayload {
  unifiedContext: string;
  metadata: Record<string, any>;
}

export interface FusionStrategy {
  (inputs: ModalityInput[], existingContext: string): Promise<string>;
}

export class MultiModalContextFusionManager {
  private modalityProcessors: Map<"image" | "audio" | "text" | "structured", (data: any) => Promise<string>>;

  constructor() {
    this.modalityProcessors = new Map();
  }

  registerProcessor(modality: "image" | "audio" | "text" | "structured", processor: (data: any) => Promise<string>): void {
    this.modalityProcessors.set(modality, processor);
  }

  private async processModalityInputs(inputs: ModalityInput[]): Promise<string[]> {
    const promises: Promise<string>[] = inputs.map(async (input) => {
      const processor = this.modalityProcessors.get(input.type);
      if (!processor) {
        return `[Warning: No processor registered for ${input.type}]`;
      }
      return processor(input.data);
    });
    return Promise.all(promises);
  }

  public async fuseContext(
    rawInputs: ModalityInput[],
    existingContext: string,
    strategy: FusionStrategy
  ): Promise<ContextPayload> {
    const processedContexts = await this.processModalityInputs(rawInputs);

    const unifiedContext = await strategy(processedContexts, existingContext);

    return {
      unifiedContext: unifiedContext,
      metadata: {
        input_count: rawInputs.length,
        strategies_applied: strategy.constructor.name,
      },
    };
  }
}

export class WeightedAveragingStrategy implements FusionStrategy {
  async execute(inputs: string[], existingContext: string): Promise<string> {
    const combined = inputs.join(" | ") + ` [Existing: ${existingContext}]`;
    return `Weighted Fusion Result: ${combined.substring(0, 100)}...`;
  }
}

export class CrossModalAttentionStrategy implements FusionStrategy {
  async execute(inputs: string[], existingContext: string): Promise<string> {
    const combined = inputs.join(" -> ") + ` [Context: ${existingContext}]`;
    return `Attention Fusion Result: Cross-referenced context based on: ${combined.substring(0, 100)}...`;
  }
}
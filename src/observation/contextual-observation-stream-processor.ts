import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Observation {
  sourceId: string;
  timestamp: number;
  rawData: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ObservationResult {
  success: boolean;
  updatedContext: Record<string, unknown>;
  stateTransitionTriggered: boolean;
  processedObservations: {
    observation: Observation;
    validatedData: Record<string, unknown>;
  }[];
}

export class ContextualObservationStreamProcessor {
  private readonly contextMemory: Record<string, unknown>;

  constructor(initialContext: Record<string, unknown> = {}) {
    this.contextMemory = initialContext;
  }

  private validateObservation(observation: Observation): { isValid: boolean; validatedData: Record<string, unknown> } {
    const { sourceId, timestamp, rawData, metadata } = observation;

    if (typeof timestamp !== 'number' || timestamp <= 0) {
      return { isValid: false, validatedData: {} };
    }

    const validatedData: Record<string, unknown> = {
      sourceId: sourceId,
      timestamp: timestamp,
      metadata: metadata,
      data: rawData,
    };

    // Mock complex validation logic
    if (typeof rawData.payload !== 'string' || rawData.payload.length < 5) {
      return { isValid: false, validatedData: {} };
    }

    return { isValid: true, validatedData };
  }

  private mergeContext(currentContext: Record<string, unknown>, validatedData: Record<string, unknown>): Record<string, unknown> {
    const newContext: Record<string, unknown> = { ...currentContext };

    // Simple context diffing: overwrite specific keys if they are newer/more authoritative
    if (validatedData.metadata?.source === 'user_feedback') {
      newContext.userFeedback = validatedData.metadata;
    }
    if (validatedData.data?.key) {
      newContext.knowledgeGraph[validatedData.data.key] = validatedData.data.value;
    }

    return newContext;
  }

  private checkStateTransition(currentContext: Record<string, unknown>, validatedData: Record<string, unknown>): boolean {
    const hasCriticalUpdate = validatedData.metadata?.type === 'CRITICAL_STATE_CHANGE';
    return hasCriticalUpdate || (currentContext.userFeedback !== undefined && validatedData.timestamp > (currentContext.lastObservedTime || 0));
  }

  public processStream(observations: Observation[]): ObservationResult {
    let currentContext = { ...this.contextMemory };
    const processedObservations: { observation: Observation; validatedData: Record<string, unknown> }[] = [];
    let stateTransitionTriggered = false;

    for (const observation of observations) {
      const validationResult = this.validateObservation(observation);

      if (validationResult.isValid) {
        const validatedData = validationResult.validatedData;
        const newContext = this.mergeContext(currentContext, validatedData);
        
        if (this.checkStateTransition(currentContext, validatedData)) {
          stateTransitionTriggered = true;
        }
        
        currentContext = newContext;
        processedObservations.push({ observation, validatedData });
      } else {
        console.warn(`Skipping invalid observation from source ${observation.sourceId}`);
      }
    }

    return {
      success: true,
      updatedContext: currentContext,
      stateTransitionTriggered: stateTransitionTriggered,
      processedObservations: processedObservations,
    };
  }
}
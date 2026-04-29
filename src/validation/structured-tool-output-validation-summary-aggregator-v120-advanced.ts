import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ValidationSummary {
  sourceId: string;
  schemaName: string;
  isValid: boolean;
  details: Record<string, any>;
  timestamp: number;
}

export interface ConflictResolutionMetadata {
  strategyUsed: 'STRICTEST' | 'AVERAGE' | 'FIRST_SUCCESS';
  sourcesConsidered: string[];
  conflictDetails?: {
    field: string;
    conflictingValues: any[];
    resolution: any;
  };
}

export interface AggregatedValidationSummary extends ValidationSummary {
  metadata: ConflictResolutionMetadata;
  isGloballyValid: boolean;
}

type MergeStrategy = 'STRICTEST' | 'AVERAGE' | 'FIRST_SUCCESS';

export class StructuredToolOutputValidationSummaryAggregator {
  private readonly mergeStrategy: MergeStrategy;

  constructor(mergeStrategy: MergeStrategy = 'STRICTEST') {
    this.mergeStrategy = mergeStrategy;
  }

  private resolveConflict(
    summaries: ValidationSummary[],
    fieldName: string
  ): {
    value: any;
    resolution: any;
  } {
    let resolvedValue: any = null;
    let resolution: any = null;

    if (this.mergeStrategy === 'STRICTEST') {
      const invalidSources = summaries.filter(
        (s) => !s.isValid && s.details[fieldName] !== undefined
      );
      if (invalidSources.length > 0) {
        return {
          value: null,
          resolution: {
            message: `Conflict detected in field '${fieldName}'. Multiple sources failed validation.`,
            sources: invalidSources.map(s => s.sourceId),
          },
        };
      }
      // If all are valid, take the first one's value as representative
      const validSources = summaries.filter(s => s.isValid);
      if (validSources.length > 0) {
        return {
          value: validSources[0].details[fieldName],
          resolution: {
            message: `Field '${fieldName}' successfully aggregated from valid sources.`,
            sources: validSources.map(s => s.sourceId),
          },
        };
      }
    } else if (this.mergeStrategy === 'AVERAGE') {
      // Simplified average for demonstration; real implementation would need type checking
      const numericValues = summaries
        .map(s => s.details[fieldName])
        .filter((v): v is number => typeof v === 'number');

      if (numericValues.length > 0) {
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        return {
          value: sum / numericValues.length,
          resolution: {
            message: `Field '${fieldName}' averaged from ${numericValues.length} sources.`,
            sources: summaries.map(s => s.sourceId),
          },
        };
      }
    }

    // Default fallback: take the value from the most recent source
    const latestSummary = summaries.reduce((latest, current) =>
      (current.timestamp > latest.timestamp ? current : latest)
    );
    return {
      value: latestSummary.details[fieldName],
      resolution: {
        message: `Field '${fieldName}' defaulted to the latest successful source (${latestSummary.sourceId}).`,
        sources: [latestSummary.sourceId],
      },
    };
  }

  public aggregate(
    summaries: ValidationSummary[],
    schemaFields: string[]
  ): AggregatedValidationSummary {
    if (!summaries || summaries.length === 0) {
      throw new Error("Cannot aggregate: No validation summaries provided.");
    }

    const allSources = summaries.map(s => s.sourceId);
    const metadata: ConflictResolutionMetadata = {
      strategyUsed: this.mergeStrategy,
      sourcesConsidered: allSources,
    };

    let aggregatedDetails: Record<string, any> = {};
    let overallValidity: boolean = true;
    let conflictDetails: any = {};

    for (const field of schemaFields) {
      const { value, resolution } = this.resolveConflict(summaries, field);
      aggregatedDetails[field] = value;

      if (resolution.message.includes("failed validation")) {
        overallValidity = false;
        conflictDetails[field] = {
          conflictingValues: summaries.map(s => s.details[field]).filter(v => v !== undefined),
          resolution: resolution,
        };
      }
    }

    const finalSummary: AggregatedValidationSummary = {
      sourceId: 'AGGREGATOR_V120',
      schemaName: 'StructuredToolOutput',
      isValid: overallValidity,
      details: aggregatedDetails,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        conflictDetails: conflictDetails,
      },
      isGloballyValid: overallValidity,
    };

    return finalSummary;
  }
}
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

export interface PipelineStep<T> {
  sourceId: string;
  fetcher: () => Promise<T>;
  schema: new (...args: any[]) => { [key: string]: any };
}

export type ConflictResolutionStrategy = 'latest' | 'highest_credibility' | 'majority_vote';

export interface ObservationPayload {
  [key: string]: any;
}

export class AsynchronousObservationPipelineManager {
  private steps: <T>(step: PipelineStep<T>)[] = [];

  constructor() {}

  addStep<T>(step: PipelineStep<T>): void {
    this.steps.push(step);
  }

  private async executeSteps(): Promise<PromiseSettledResult<any>[] & { sourceId: string; result: any }[]> {
    const promises = this.steps.map(step => step.fetcher());
    const results = await Promise.allSettled(promises);

    const settledResults: PromiseSettledResult<any>[] & { sourceId: string; result: any }[] = [];

    this.steps.forEach((step, index) => {
      const result = results[index];
      settledResults.push({
        sourceId: step.sourceId,
        result: result,
      });
    });

    return settledResults;
  }

  public async runPipeline(): Promise<ObservationPayload> {
    const settledResults = await this.executeSteps();
    return this.resolveConflicts(settledResults);
  }

  private resolveConflicts(settledResults: PromiseSettledResult<any>[] & { sourceId: string; result: any }[]): ObservationPayload {
    const unifiedPayload: ObservationPayload = {};

    const processResult = (sourceId: string, result: PromiseSettledResult<any>): Partial<ObservationPayload> => {
      if (result.status === 'fulfilled') {
        try {
          const value = result.value;
          return { [sourceId]: value };
        } catch (e) {
          return { [sourceId]: { error: `Failed to process result: ${e}` } };
        }
      } else {
        return { [sourceId]: { error: `Execution failed: ${result.reason}` } };
      }
    };

    const processedResults = settledResults.map(r => processResult(r.sourceId, r.result));

    // Simple merge for demonstration; real conflict resolution is complex.
    // We assume the payload structure is flat or requires specific merging logic.
    // For this implementation, we merge all sources into the payload.
    for (const partial of processedResults) {
      Object.assign(unifiedPayload, partial);
    }

    return unifiedPayload;
  }

  public static async runPipelineWithStrategy(
    steps: PipelineStep<any>[],
    strategy: ConflictResolutionStrategy
  ): Promise<ObservationPayload> {
    const manager = new AsynchronousObservationPipelineManager();
    steps.forEach(step => manager.addStep(step));

    // Note: The current implementation of resolveConflicts is a simple merge.
    // A full implementation would use the 'strategy' parameter here.
    // We maintain the structure but acknowledge the simplification for brevity.
    const settledResults = await manager['executeSteps']();
    return manager['resolveConflicts'](settledResults);
  }
}
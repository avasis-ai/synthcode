import { EventEmitter } from "node:events";

type ResourceId = string;
type SourceName = string;

export interface StreamSource {
  name: SourceName;
  authorityLevel: number;
}

export interface StreamUpdate {
  resourceId: ResourceId;
  source: StreamSource;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface ConflictResolutionStrategy {
  resolve(updates: StreamUpdate[]): Record<string, unknown>;
}

export class StreamConflictResolver extends EventEmitter {
  private sources: Map<SourceName, StreamSource> = new Map();
  private strategies: Map<string, ConflictResolutionStrategy> = new Map();

  constructor() {
    super();
  }

  registerSource(source: StreamSource): void {
    this.sources.set(source.name, source);
  }

  registerStrategy(strategyName: string, strategy: ConflictResolutionStrategy): void {
    this.strategies.set(strategyName, strategy);
  }

  getStrategy(strategyName: string): ConflictResolutionStrategy | undefined {
    return this.strategies.get(strategyName);
  }

  /**
   * Resolves conflicting updates for a batch of stream updates.
   * @param streamUpdates Array of updates from various sources.
   * @param strategyName The name of the conflict resolution strategy to use.
   * @returns A map of resource IDs to their single, reconciled state.
   * @throws Error if the strategy is not registered.
   */
  resolve(streamUpdates: StreamUpdate[], strategyName: string): Record<ResourceId, Record<string, unknown>> {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Conflict resolution strategy "${strategyName}" is not registered.`);
    }

    const groupedUpdates = new Map<ResourceId, StreamUpdate[]>();

    for (const update of streamUpdates) {
      if (!groupedUpdates.has(update.resourceId)) {
        groupedUpdates.set(update.resourceId, []);
      }
      groupedUpdates.get(update.resourceId)!.push(update);
    }

    const reconciledState: Record<ResourceId, Record<string, unknown>> = {};

    for (const [resourceId, updates] of groupedUpdates.entries()) {
      const resolvedState = strategy.resolve(updates);
      reconciledState[resourceId] = resolvedState;
    }

    return reconciledState;
  }

  /**
   * Validates the final reconciled state against a provided schema.
   * @param state The state to validate.
   * @param schema A function that takes the state and returns boolean (true if valid).
   * @returns True if the state is valid, false otherwise.
   */
  validateState(state: Record<ResourceId, Record<string, unknown>>, schema: (state: Record<ResourceId, Record<string, unknown>>) => boolean): boolean {
    return schema(state);
  }
}

export { StreamConflictResolver };
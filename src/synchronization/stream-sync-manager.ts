import { EventEmitter } from "node:events";

export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: any[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
    type: "text";
    text: string;
}

export interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

export type StreamDataPoint = {
    timestamp: Date;
    sourceId: string;
    data: Record<string, unknown>;
};

export interface StreamSource {
    id: string;
    fetchData: (timeWindow: Date) => Promise<StreamDataPoint[]>;
}

export type ConflictResolutionStrategy = "latest_timestamp_wins" | "weighted_average" | "consensus";

export interface SynchronizedContext {
    timestamp: Date;
    data: Record<string, unknown>;
    sourceContributions: Record<string, StreamDataPoint[]>;
}

export class StreamSyncManager {
    private sources: StreamSource[];

    constructor() {}

    setSources(sources: StreamSource[]): void {
        this.sources = sources;
    }

    /**
     * Synchronizes data from multiple sources for a given time window.
     * @param timeWindow The time window to synchronize data for.
     * @param strategy The conflict resolution strategy to use.
     * @returns A promise resolving to the SynchronizedContext.
     */
    public async synchronize(
        timeWindow: Date,
        strategy: ConflictResolutionStrategy
    ): Promise<SynchronizedContext> {
        if (this.sources.length === 0) {
            throw new Error("No data sources configured.");
        }

        const fetchPromises = this.sources.map(source => source.fetchData(timeWindow));
        const results: Promise<StreamDataPoint[]>[] = fetchPromises;

        const allDataPoints = await Promise.all(results);

        const sourceContributions: Record<string, StreamDataPoint[]> = {};
        for (let i = 0; i < this.sources.length; i++) {
            const sourceId = this.sources[i].id;
            sourceContributions[sourceId] = allDataPoints[i];
        }

        const synchronizedContext = this.resolveConflicts(
            timeWindow,
            sourceContributions,
            strategy
        );

        return {
            timestamp: synchronizedContext.timestamp,
            data: synchronizedContext.data,
            sourceContributions: sourceContributions,
        };
    }

    /**
     * Applies the configured conflict resolution strategy to merge data points.
     * @param timeWindow The time window used for synchronization.
     * @param sourceContributions Data grouped by source.
     * @param strategy The conflict resolution strategy.
     * @returns The reconciled context data.
     */
    private resolveConflicts(
        timeWindow: Date,
        sourceContributions: Record<string, StreamDataPoint[]>,
        strategy: ConflictResolutionStrategy
    ): { timestamp: Date; data: Record<string, unknown> } {
        const mergedData: Record<string, unknown> = {};
        const latestTimestamp = timeWindow;

        // Simple aggregation based on the strategy
        if (strategy === "latest_timestamp_wins") {
            // In a real scenario, this would involve complex merging logic based on keys/fields.
            // Here, we simulate merging by taking the last observed value for each key.
            const combinedData: Record<string, unknown> = {};
            for (const sourceId in sourceContributions) {
                const points = sourceContributions[sourceId];
                for (const point of points) {
                    // Simple overwrite simulation
                    Object.assign(combinedData, point.data);
                }
            }
            return { timestamp: latestTimestamp, data: combinedData };
        }

        if (strategy === "weighted_average") {
            // Placeholder for complex numerical averaging logic
            return { timestamp: latestTimestamp, data: { average_metrics: "Calculated Average" } };
        }

        if (strategy === "consensus") {
            // Placeholder for requiring agreement across sources
            return { timestamp: latestTimestamp, data: { consensus_status: "Achieved" } };
        }

        return { timestamp: latestTimestamp, data: {} };
    }
}

export { StreamSyncManager };
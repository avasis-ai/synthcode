interface DataRecord {
    timestamp: number;
    source: string;
    payload: Record<string, unknown>;
}

type ConflictResolver = (key: string, records: DataRecord[]) => unknown;

export class TemporalDataSynchronizer {
    private resolver: ConflictResolver;

    constructor(resolver: ConflictResolver) {
        this.resolver = resolver;
    }

    /**
     * Synchronizes raw data records within a specified time window, resolving conflicts.
     * @param records The list of raw data records.
     * @param startTime The start of the time window (inclusive).
     * @param endTime The end of the time window (inclusive).
     * @returns A map of synchronized keys to their final resolved value.
     */
    public synchronize(
        records: DataRecord[],
        startTime: number,
        endTime: number
    ): Map<string, unknown> {
        const filteredRecords = records.filter(record =>
            record.timestamp >= startTime && record.timestamp <= endTime
        );

        const groupedRecords: Map<string, DataRecord[]> = new Map();

        for (const record of filteredRecords) {
            for (const key in record.payload) {
                if (Object.prototype.hasOwnProperty.call(record.payload, key)) {
                    const keyString = String(key);
                    if (!groupedRecords.has(keyString)) {
                        groupedRecords.set(keyString, []);
                    }
                    groupedRecords.get(keyString)!.push(record);
                }
            }
        }

        const synchronizedState = new Map<string, unknown>();
        for (const [key, records] of groupedRecords.entries()) {
            synchronizedState.set(key, this.resolver(key, records));
        }

        return synchronizedState;
    }

    /**
     * Default conflict resolution strategy: Last Write Wins (LWW) based on timestamp.
     * This implementation is provided as a static helper or used by the constructor.
     */
    public static defaultLWWResolver(key: string, records: DataRecord[]): unknown {
        if (records.length === 0) {
            return undefined;
        }

        // Sort by timestamp descending
        records.sort((a, b) => b.timestamp - a.timestamp);

        // Return the payload of the most recent record
        return records[0].payload;
    }

    /**
     * Weighted Average Resolver: Attempts to average numeric values across sources.
     * This resolver is specialized and should be used when payloads are expected to be numeric.
     */
    public static weightedAverageResolver(key: string, records: DataRecord[]): number {
        let sum = 0;
        let count = 0;

        for (const record of records) {
            const value = record.payload[key];
            if (typeof value === 'number' && !isNaN(value)) {
                sum += value;
                count++;
            }
        }

        return count > 0 ? sum / count : NaN;
    }
}
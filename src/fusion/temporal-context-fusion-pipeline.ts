type DataPoint = {
    timestamp: number;
    sourceId: string;
    key: string;
    value: unknown;
};

type SourceAuthority = Record<string, number>;

export interface ContextPayload {
    timestamp: number;
    context: Record<string, unknown>;
    sourceAuthorityWeights: SourceAuthority;
}

class TemporalWindowManager {
    private windows: Map<number, DataPoint[]>;

    constructor() {
        this.windows = new Map();
    }

    addPoint(point: DataPoint): void {
        const windowKey = Math.floor(point.timestamp / 5000); // 5-second window
        if (!this.windows.has(windowKey)) {
            this.windows.set(windowKey, []);
        }
        (this.windows.get(windowKey) as DataPoint[]).push(point);
    }

    getWindows(): DataPoint[][] {
        return Array.from(this.windows.values());
    }

    clear(): void {
        this.windows.clear();
    }
}

class TemporalConflictResolver {
    private authorityMap: Map<string, number>;

    constructor(authorityMap: SourceAuthority) {
        this.authorityMap = new Map(Object.entries(authorityMap));
    }

    resolve(points: DataPoint[]): Record<string, unknown> {
        if (points.length === 0) {
            return {};
        }

        const groupedByKey: Record<string, DataPoint[]> = {};
        for (const point of points) {
            if (!groupedByKey[point.key]) {
                groupedByKey[point.key] = [];
            }
            groupedByKey[point.key].push(point);
        }

        const resolvedContext: Record<string, unknown> = {};

        for (const key in groupedByKey) {
            const pointsForKey = groupedByKey[key];
            if (pointsForKey.length === 0) continue;

            // Sort by timestamp to ensure temporal consistency
            pointsForKey.sort((a, b) => a.timestamp - b.timestamp);

            // Simple conflict resolution: Use the point from the highest authority
            // that is closest to the center of the window.
            let bestPoint: DataPoint | null = null;
            let maxAuthority = -1;
            let minTimeDiff = Infinity;

            for (const point of pointsForKey) {
                const authority = this.authorityMap.get(point.sourceId) || 0;
                const timeDiff = Math.abs(point.timestamp - pointsForKey[0].timestamp);

                if (authority > maxAuthority) {
                    maxAuthority = authority;
                    bestPoint = point;
                    minTimeDiff = timeDiff;
                } else if (authority === maxAuthority && timeDiff < minTimeDiff) {
                    bestPoint = point;
                    minTimeDiff = timeDiff;
                }
            }

            if (bestPoint) {
                resolvedContext[key] = bestPoint.value;
            }
        }

        return resolvedContext;
    }
}

export class TemporalContextFusionPipeline {
    private windowManager: TemporalWindowManager;
    private resolver: TemporalConflictResolver;

    constructor(sourceAuthorities: SourceAuthority) {
        this.windowManager = new TemporalWindowManager();
        this.resolver = new TemporalConflictResolver(sourceAuthorities);
    }

    ingestData(dataPoints: DataPoint[]): void {
        for (const point of dataPoints) {
            this.windowManager.addPoint(point);
        }
    }

    fuseContext(): ContextPayload | null {
        const windows = this.windowManager.getWindows();
        if (windows.length === 0) {
            return null;
        }

        // Use the latest window for the context payload
        const latestWindow = windows[windows.length - 1];
        const context = this.resolver.resolve(latestWindow);

        const payload: ContextPayload = {
            timestamp: latestWindow[latestWindow.length - 1].timestamp,
            context: context,
            sourceAuthorityWeights: Object.fromEntries(
                Array.from(this.resolver['authorityMap'].entries())
            )
        };

        this.windowManager.clear();
        return payload;
    }
}
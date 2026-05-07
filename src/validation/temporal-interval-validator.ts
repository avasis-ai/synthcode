export interface Resource {
    name: string;
    capacity: number;
}

export interface Interval {
    id: string;
    start: number;
    end: number;
    duration: number;
    required_resources: Record<string, number>; // Resource name -> required units
}

export interface ConflictReport {
    intervalId: string;
    conflictType: "Overlap" | "ResourceOvercommitment" | "CausalityViolation";
    message: string;
    details: any;
}

export interface ValidationResult {
    isValid: boolean;
    conflicts: ConflictReport[];
    suggestions: string[];
}

export class TemporalIntervalValidator {
    private resources: Resource[];

    constructor(resources: Resource[]) {
        this.resources = resources;
    }

    private checkOverlap(intervalA: Interval, intervalB: Interval): boolean {
        return Math.max(intervalA.start, intervalB.start) < Math.min(intervalA.end, intervalB.end);
    }

    private checkResourceConflicts(intervals: Interval[]): ConflictReport[] {
        const conflicts: ConflictReport[] = [];
        const resourceUsage: Map<string, { time: number, usage: number }[]> = new Map();

        for (const interval of intervals) {
            for (const [resourceName, requiredUnits] of Object.entries(interval.required_resources)) {
                if (!resourceUsage.has(resourceName)) {
                    resourceUsage.set(resourceName, []);
                }
                const usageList = resourceUsage.get(resourceName)!;

                // Check for conflicts with existing usage
                for (const existingUsage of usageList) {
                    // Simple check: if the new interval overlaps with existing usage
                    if (Math.max(interval.start, existingUsage.time) < Math.min(interval.end, existingUsage.time + existingUsage.usage)) {
                        // This is a simplification; a real system would track cumulative usage over time.
                        // For this scope, we check if the required units exceed capacity at any point.
                        // Since we don't have a time-series map, we assume a conflict if any overlap occurs
                        // and we need a more robust check.
                        // Let's simplify the conflict detection to check against the total capacity defined by the Resource list.
                    }
                }

                // For accurate resource checking, we need to track usage at discrete points.
                // We will use a simplified approach: check if the total required units exceed capacity at the start/end points.
            }
        }

        // Re-implementing resource check by iterating over all time points (discretization)
        const timePoints = new Set<number>();
        intervals.forEach(i => {
            timePoints.add(i.start);
            timePoints.add(i.end);
        });

        const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
        const timeSegments: [number, number][] = [];

        for (let i = 0; i < sortedTimePoints.length - 1; i++) {
            const start = sortedTimePoints[i];
            const end = sortedTimePoints[i + 1];
            if (end > start) {
                timeSegments.push([start, end]);
            }
        }

        const resourceCapacityMap: Map<string, number> = new Map(this.resources.map(r => [r.name, r.capacity]));

        for (const [segmentStart, segmentEnd] of timeSegments) {
            const activeResources: Record<string, number> = {};
            for (const interval of intervals) {
                // Check if the interval spans this segment
                if (interval.start <= segmentStart && interval.end >= segmentEnd) {
                    for (const [resourceName, requiredUnits] of Object.entries(interval.required_resources)) {
                        activeResources[resourceName] = (activeResources[resourceName] || 0) + requiredUnits;
                    }
                }
            }

            for (const [resourceName, usedUnits] of Object.entries(activeResources)) {
                const capacity = resourceCapacityMap.get(resourceName) || 0;
                if (usedUnits > capacity) {
                    conflicts.push({
                        intervalId: "N/A", // Conflict is systemic to the set
                        conflictType: "ResourceOvercommitment",
                        message: `Resource ${resourceName} is overcommitted. Used: ${usedUnits}, Capacity: ${capacity}.`,
                        details: { segment: [segmentStart, segmentEnd], resource: resourceName }
                    });
                }
            }
        }

        return conflicts;
    }

    private checkTemporalOverlaps(intervals: Interval[]): ConflictReport[] {
        const conflicts: ConflictReport[] = [];
        for (let i = 0; i < intervals.length; i++) {
            for (let j = i + 1; j < intervals.length; j++) {
                const intervalA = intervals[i];
                const intervalB = intervals[j];

                if (this.checkOverlap(intervalA, intervalB)) {
                    conflicts.push({
                        intervalId: `${intervalA.id} vs ${intervalB.id}`,
                        conflictType: "Overlap",
                        message: `Intervals ${intervalA.id} and ${intervalB.id} overlap in time.`,
                        details: { intervalA, intervalB }
                    });
                }
            }
        }
        return conflicts;
    }

    private checkCausality(intervals: Interval[]): ConflictReport[] {
        // Assuming causality means that if an interval requires a resource,
        // and another interval uses that resource immediately before, the dependency must be met.
        // Since we lack explicit dependency data, we will check for immediate adjacency violations
        // if the resource usage suggests a required handoff time.
        // For simplicity, we assume causality violation occurs if two intervals requiring the same resource
        // are scheduled back-to-back without a defined buffer/transition time (e.g., 5 minutes).
        const causalityConflicts: ConflictReport[] = [];
        const sortedIntervals = [...intervals].sort((a, b) => a.start - b.start);

        for (let i = 0; i < sortedIntervals.length - 1; i++) {
            const current = sortedIntervals[i];
            const next = sortedIntervals[i + 1];

            // Check if they share resources and are immediately adjacent (start of next == end of current)
            const sharedResources = Object.keys(current.required_resources).filter(
                r => next.required_resources[r] > 0
            );

            if (sharedResources.length > 0 && Math.abs(next.start - current.end) < 1) { // Assuming time units are integers
                causalityConflicts.push({
                    intervalId: `${current.id} -> ${next.id}`,
                    conflictType: "CausalityViolation",
                    message: `Intervals ${current.id} and ${next.id} are scheduled back-to-back using shared resources (${sharedResources.join(', ')}). A transition buffer might be required.`,
                    details: { current, next }
                });
            }
        }
        return causalityConflicts;
    }

    public validate(intervals: Interval[]): ValidationResult {
        if (!intervals || intervals.length === 0) {
            return { isValid: true, conflicts: [], suggestions: ["No intervals provided to validate."] };
        }

        const overlapConflicts = this.checkTemporalOverlaps(intervals);
        const resourceConflicts = this.checkResourceConflicts(intervals);
        const causalityConflicts = this.checkCausality(intervals);

        const allConflicts: ConflictReport[] = [
            ...overlapConflicts,
            ...resourceConflicts,
            ...causalityConflicts
        ];

        const isValid = allConflicts.length === 0;

        let suggestions: string[] = [];
        if (overlapConflicts.length > 0) {
            suggestions.push("Review overlapping intervals for potential time shifting.");
        }
        if (resourceConflicts.length > 0) {
            suggestions.push("Check resource requirements against total capacity to prevent overcommitment.");
        }
        if (causalityConflicts.length > 0) {
            suggestions.push("Consider adding transition buffers between sequentially scheduled tasks.");
        }

        return {
            isValid: isValid,
            conflicts: allConflicts,
            suggestions: suggestions
        };
    }
}

export { TemporalIntervalValidator };
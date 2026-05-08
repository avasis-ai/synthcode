import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

export interface ResourceRequest {
    resourceName: string;
    amount: number;
    startTime: number;
    endTime: number;
    priority: number;
}

export interface ContentionDetail {
    resourceName: string;
    timeStart: number;
    timeEnd: number;
    requiredCapacity: number;
    availableCapacity: number;
    conflictSeverity: number;
}

export interface MitigationSuggestion {
    requestIndex: number;
    suggestionType: "delay" | "scale_up" | "fail";
    details: string;
}

export interface ContentionReport {
    isContended: boolean;
    details: ContentionDetail[];
    suggestions: MitigationSuggestion[];
}

class TemporalResourceContentionPredictor {
    private readonly MAX_CAPACITY: Record<string, number>;

    constructor(resourceCapacities: Record<string, number>) {
        this.MAX_CAPACITY = resourceCapacities;
    }

    predict(requests: ResourceRequest[]): ContentionReport {
        const timeline: Map<number, Map<string, number>> = new Map();
        const contentionDetails: ContentionDetail[] = [];
        const suggestions: MitigationSuggestion[] = [];

        // 1. Initialize timeline and track usage
        for (const req of requests) {
            for (let t = Math.max(0, Math.floor(req.startTime)); t < Math.floor(req.endTime); t++) {
                if (!timeline.has(t)) {
                    timeline.set(t, new Map());
                }
                const resourceUsage = timeline.get(t)!;
                const currentUsage = resourceUsage.get(req.resourceName) || 0;
                resourceUsage.set(req.resourceName, currentUsage + req.amount);
            }
        }

        // 2. Analyze timeline for contention
        for (const [time, resourceUsage] of timeline.entries()) {
            for (const [resourceName, usedAmount] of resourceUsage.entries()) {
                const maxCapacity = this.MAX_CAPACITY[resourceName] || Infinity;
                const available = maxCapacity - usedAmount;

                if (available < 0) {
                    const conflictSeverity = Math.abs(available);
                    contentionDetails.push({
                        resourceName,
                        timeStart: time,
                        timeEnd: time + 1,
                        requiredCapacity: usedAmount,
                        availableCapacity: available,
                        conflictSeverity: conflictSeverity,
                    });
                }
            }
        }

        // 3. Generate suggestions (Simplified heuristic)
        const isContended = contentionDetails.length > 0;
        if (isContended) {
            for (let i = 0; i < requests.length; i++) {
                const req = requests[i];
                const conflictFound = contentionDetails.some(detail =>
                    detail.resourceName === req.resourceName &&
                    detail.timeStart >= Math.floor(req.startTime) &&
                    detail.timeEnd <= Math.ceil(req.endTime)
                );

                if (conflictFound) {
                    if (req.priority < 5) {
                        suggestions.push({
                            requestIndex: i,
                            suggestionType: "delay",
                            details: `Request ${i} conflicts. Consider delaying execution to free up ${req.resourceName}.`,
                        });
                    } else if (req.amount > 10) {
                        suggestions.push({
                            requestIndex: i,
                            suggestionType: "scale_up",
                            details: `Request ${i} is large and conflicts. Consider scaling up ${req.resourceName} capacity.`,
                        });
                    } else {
                        suggestions.push({
                            requestIndex: i,
                            suggestionType: "fail",
                            details: `Request ${i} conflicts severely. Consider failing or reducing scope.`,
                        });
                    }
                }
            }
        }

        return {
            isContended,
            details: contentionDetails,
            suggestions: suggestions,
        };
    }
}

export { TemporalResourceContentionPredictor };
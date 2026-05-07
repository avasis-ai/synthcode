import {
    Message,
    ToolUseBlock,
    ContentBlock,
    TextBlock
} from "./types";

export interface ResourceConstraintPayload {
    maxCost: number;
    maxTimeSeconds: number;
    maxQuota: number;
}

export class ResourceConstraintViolation {
    constructor(
        public readonly constraint: string,
        public readonly actualUsage: number,
        public readonly limit: number,
        public readonly message: string = `Constraint violation: ${constraint} exceeded. Used ${actualUsage}, limit is ${limit}.`
    ) {}
}

interface Action {
    name: string;
    input: Record<string, unknown>;
}

class ResourceEstimator {
    private readonly costModel: Map<string, (input: Record<string, unknown>) => number> = new Map();
    private readonly timeModel: Map<string, (input: Record<string, unknown>) => number> = new Map();
    private readonly quotaModel: Map<string, (input: Record<string, unknown>) => number> = new Map();

    constructor() {
        // Mock cost calculation based on action name and input size
        this.costModel.set("search_api", (input) => 0.5 + (Object.keys(input).length * 0.1));
        this.costModel.set("database_query", (input) => 1.0 + (Object.keys(input).length * 0.2));

        // Mock time calculation
        this.timeModel.set("search_api", (input) => 2.0 + (Object.keys(input).length * 0.5));
        this.timeModel.set("database_query", (input) => 3.0 + (Object.keys(input).length * 0.8));
    }

    estimateCost(action: Action): number {
        const costFn = this.costModel.get(action.name);
        return costFn ? costFn(action.input) : 0.1;
    }

    estimateTime(action: Action): number {
        const timeFn = this.timeModel.get(action.name);
        return timeFn ? timeFn(action.input) : 1.0;
    }

    estimateQuotaUsage(action: Action): number {
        // Simple mock quota usage based on input complexity
        return 1 + Math.min(5, Object.keys(action.input).length);
    }
}

export class ResourceConstraintValidator {
    private readonly estimator: ResourceEstimator;

    constructor(estimator: ResourceEstimator) {
        this.estimator = estimator;
    }

    validate(
        action: Action,
        context: {
            history: Message[];
        },
        constraints: ResourceConstraintPayload
    ): ResourceConstraintViolation | null {
        const estimatedCost = this.estimator.estimateCost(action);
        const estimatedTime = this.estimator.estimateTime(action);
        const estimatedQuota = this.estimator.estimateQuotaUsage(action);

        if (estimatedCost > constraints.maxCost) {
            return new ResourceConstraintViolation(
                "Cost",
                estimatedCost,
                constraints.maxCost
            );
        }

        if (estimatedTime > constraints.maxTimeSeconds) {
            return new ResourceConstraintViolation(
                "Time",
                estimatedTime,
                constraints.maxTimeSeconds
            );
        }

        if (estimatedQuota > constraints.maxQuota) {
            return new ResourceConstraintViolation(
                "Quota",
                estimatedQuota,
                constraints.maxQuota
            );
        }

        return null;
    }
}

export { ResourceConstraintValidator, ResourceConstraintViolation, ResourceEstimator };
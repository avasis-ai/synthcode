import { EventEmitter } from "node:events"

export type ResourceConstraint = {
    resource: string;
    level: "critical" | "warning" | "ok";
    details: Record<string, unknown>;
}

export type ExternalEvent = {
    source: string;
    status: "success" | "failure" | "pending";
    data: Record<string, unknown>;
}

export type GoalDrift = {
    metric: string;
    deviation: number;
    threshold: number;
}

export type Context = {
    resourceConstraints: ResourceConstraint[];
    externalEvents: ExternalEvent[];
    goalDrifts: GoalDrift[];
    // Add other context inputs as needed
}

export type PlanAdjustment = {
    action: "REPLAN" | "INTERVENE" | "ADJUST";
    priority: number;
    message: string;
    suggestedSteps: string[];
}

export type TriggerRule = {
    name: string;
    description: string;
    // The evaluation function takes the current context and returns an array of potential adjustments
    evaluate: (context: Context) => PlanAdjustment[] | Promise<PlanAdjustment[]>;
}

export class ContextualEventTriggerEngine extends EventEmitter {
    private rules: TriggerRule[] = [];
    private eventBus: EventEmitter;

    constructor() {
        super()
        this.eventBus = new EventEmitter()
    }

    public addRule(rule: TriggerRule): void {
        this.rules.push(rule)
    }

    public subscribeToContext(context: Context): void {
        this.emit("contextUpdate", context)
    }

    public async evaluateTriggers(context: Context): Promise<PlanAdjustment[]> {
        const results: PlanAdjustment[] = []

        for (const rule of this.rules) {
            let adjustments: PlanAdjustment[] = []
            try {
                const evaluationResult = await rule.evaluate(context)
                if (Array.isArray(evaluationResult)) {
                    adjustments = evaluationResult
                } else if (evaluationResult) {
                    adjustments = [evaluationResult]
                }
            } catch (error) {
                console.error(`Error evaluating rule ${rule.name}:`, error)
            }
            results.push(...adjustments)
        }

        // Simple prioritization: sort by priority (lower number = higher priority)
        results.sort((a, b) => (a.priority || 999) - (b.priority || 999))

        return results
    }

    public async handleIncomingEvent(event: { type: string, data: Record<string, unknown> }): Promise<PlanAdjustment[]> {
        const currentContext: Context = {
            resourceConstraints: [],
            externalEvents: [],
            goalDrifts: []
        }

        if (event.type === "resource_constraint") {
            const constraint = event.data as ResourceConstraint
            currentContext.resourceConstraints.push(constraint)
        } else if (event.type === "external_event") {
            const externalEvent = event.data as ExternalEvent
            currentContext.externalEvents.push(externalEvent)
        } else if (event.type === "goal_drift") {
            const drift = event.data as GoalDrift
            currentContext.goalDrifts.push(drift)
        } else {
            return []
        }

        this.subscribeToContext(currentContext)
        return this.evaluateTriggers(currentContext)
    }
}

export { ContextualEventTriggerEngine }
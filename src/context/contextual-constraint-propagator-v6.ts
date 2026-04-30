import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface TemporalConstraint {
    startTime: number;
    endTime: number;
}

interface ResourceConstraint {
    resourceName: string;
    limit: number;
}

interface CapabilityConstraint {
    capabilityName: string;
    required: boolean;
}

export interface ConstraintPayload {
    temporal: TemporalConstraint | null;
    resources: ResourceConstraint[];
    capabilities: CapabilityConstraint[];
}

interface ContextSource {
    name: string;
    getConstraints: () => ConstraintPayload;
}

export class ContextualConstraintPropagatorV6 {
    private contextSources: ContextSource[];

    constructor(contextSources: ContextSource[]) {
        this.contextSources = contextSources;
    }

    private resolveTemporal(constraints: (TemporalConstraint | null)[]): TemporalConstraint | null {
        const validConstraints = constraints.filter((c): c is TemporalConstraint => c !== null);
        if (validConstraints.length === 0) {
            return null;
        }

        let minStart = Math.min(...validConstraints.map(c => c.startTime));
        let maxEnd = Math.max(...validConstraints.map(c => c.endTime));

        return {
            startTime: minStart,
            endTime: maxEnd
        };
    }

    private resolveResources(constraints: ResourceConstraint[]): ResourceConstraint[] {
        const aggregated: Map<string, number> = new Map();

        for (const constraint of constraints) {
            const currentLimit = aggregated.get(constraint.resourceName) || Infinity;
            // Intersection logic: take the minimum limit
            aggregated.set(constraint.resourceName, Math.min(currentLimit, constraint.limit));
        }

        return Array.from(aggregated, ([name, limit]) => ({
            resourceName: name,
            limit: limit
        }));
    }

    private resolveCapabilities(constraints: CapabilityConstraint[]): CapabilityConstraint[] {
        const required: Set<string> = new Set();
        const optional: Set<string> = new Set();

        for (const constraint of constraints) {
            if (constraint.required) {
                required.add(constraint.capabilityName);
            } else {
                optional.add(constraint.capabilityName);
            }
        }

        return Array.from(required).map(name => ({
            capabilityName: name,
            required: true
        })).concat(
            Array.from(optional).map(name => ({
                capabilityName: name,
                required: false
            }))
        );
    }

    public propagate(incomingConstraints: ConstraintPayload): ConstraintPayload {
        const sourceConstraints: ConstraintPayload[][] = this.contextSources.map(source => [source.getConstraints()]);

        const resolvedTemporal = this.resolveTemporal(sourceConstraints.map(s => s[0]?.temporal ?? null));
        const allResources = this.contextSources.flatMap(source => source.getConstraints().resources);
        const resolvedResources = this.resolveResources(allResources);
        const allCapabilities = this.contextSources.flatMap(source => source.getConstraints().capabilities);
        const resolvedCapabilities = this.resolveCapabilities(allCapabilities);

        return {
            temporal: resolvedTemporal,
            resources: resolvedResources,
            capabilities: resolvedCapabilities
        };
    }
}
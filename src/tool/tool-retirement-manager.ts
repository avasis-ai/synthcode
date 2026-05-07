export type ToolStatus = "Active" | "Deprecated" | "Warning" | "Sunset" | "Retired";

export interface ToolDefinition {
    name: string;
    description: string;
    status: ToolStatus;
    version: string;
    // Other tool definition properties...
}

export interface ToolUsageMetrics {
    lastUsed: Date;
    callCount: number;
    averageDailyUsage: number;
}

export class ToolRetirementManager {
    private toolRegistry: Map<string, {
        definition: ToolDefinition;
        metrics: ToolUsageMetrics;
    }> = new Map();

    constructor() {}

    public registerTool(definition: ToolDefinition, initialMetrics: ToolUsageMetrics): void {
        if (typeof definition.name !== 'string') {
            throw new Error("Tool definition must have a name.");
        }
        this.toolRegistry.set(definition.name, {
            definition: definition,
            metrics: initialMetrics,
        });
    }

    public updateUsage(toolName: string): boolean {
        const entry = this.toolRegistry.get(toolName);
        if (!entry) {
            return false;
        }

        const newMetrics: ToolUsageMetrics = {
            lastUsed: new Date(),
            callCount: entry.metrics.callCount + 1,
            averageDailyUsage: entry.metrics.averageDailyUsage + 0.1, // Simplified update
        };

        this.toolRegistry.set(toolName, {
            definition: entry.definition,
            metrics: newMetrics,
        });
        return true;
    }

    public getToolStatus(toolName: string): ToolStatus | null {
        const entry = this.toolRegistry.get(toolName);
        return entry ? entry.definition.status : null;
    }

    public getToolMetrics(toolName: string): ToolUsageMetrics | null {
        const entry = this.toolRegistry.get(toolName);
        return entry ? entry.metrics : null;
    }

    public checkUsagePolicy(toolName: string, usageThreshold: number): {
        status: ToolStatus;
        reason: string;
    } {
        const metrics = this.getToolMetrics(toolName);
        if (!metrics) {
            return { status: "Retired", reason: "Tool not found." };
        }

        if (metrics.callCount < usageThreshold && metrics.lastUsed < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            return { status: "Warning", reason: "Low usage detected over 30 days." };
        }

        return { status: "Active", reason: "Usage within acceptable parameters." };
    }

    public enforceCallRestriction(toolName: string): {
        allowed: boolean;
        message: string;
    } {
        const status = this.getToolStatus(toolName);

        if (status === "Retired") {
            return { allowed: false, message: `Tool ${toolName} is retired and cannot be called.` };
        }
        if (status === "Sunset") {
            return { allowed: true, message: `Tool ${toolName} is sunsetting. Use replacements.` };
        }
        if (status === "Deprecated") {
            return { allowed: true, message: `Tool ${toolName} is deprecated. Migration is recommended.` };
        }
        return { allowed: true, message: `Tool ${toolName} is active.` };
    }

    public updateStatus(toolName: string, newStatus: ToolStatus): boolean {
        const entry = this.toolRegistry.get(toolName);
        if (!entry) {
            return false;
        }

        const currentStatus = entry.definition.status;
        if (currentStatus === newStatus) {
            return true;
        }

        const updatedDefinition: ToolDefinition = {
            ...entry.definition,
            status: newStatus,
        };

        this.toolRegistry.set(toolName, {
            definition: updatedDefinition,
            metrics: entry.metrics,
        });
        return true;
    }
}

export { ToolRetirementManager };
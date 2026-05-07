import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

export interface SandboxContext {
    memory: Record<string, any>;
    variables: Map<string, any>;
    constraints: Set<string>;
}

export interface SandboxReport {
    stateDiff: {
        memory: Record<string, any>;
        variables: Map<string, any>;
        constraints: Set<string>;
    };
    resourceUsage: {
        cpuTimeMs: number;
        memoryIncreaseBytes: number;
    };
    changes: {
        memoryUpdates: Record<string, any>;
        variablesWrites: Record<string, any>;
        constraintsViolations: string[];
    };
}

export interface SandboxWrapper {
    readMemory(key: string): any;
    writeMemory(key: string, value: any): void;
    readVariable(name: string): any;
    writeVariable(name: string, value: any): void;
    checkConstraint(constraint: string): boolean;
}

export class ContextualSandboxManager {
    private originalContext: SandboxContext | null = null;
    private snapshot: {
        memory: Record<string, any>;
        variables: Map<string, any>;
        constraints: Set<string>;
    } | null = null;

    constructor() {}

    private deepSnapshot(context: SandboxContext): {
        memory: Record<string, any>;
        variables: Map<string, any>;
        constraints: Set<string>;
    }: {
        memory: Record<string, any>;
        variables: Map<string, any>;
        constraints: Set<string>;
    } {
        return {
            memory: { ...context.memory },
            variables: new Map(context.variables),
            constraints: new Set(context.constraints),
        };
    }

    public enterSandbox(initialContext: SandboxContext): SandboxWrapper {
        if (this.originalContext !== null) {
            throw new Error("Sandbox already active. Must exit before entering a new one.");
        }

        this.originalContext = initialContext;
        this.snapshot = this.deepSnapshot(initialContext);

        return {
            readMemory: (key: string): any => {
                return this.snapshot!.memory[key];
            },
            writeMemory: (key: string, value: any): void => {
                this.snapshot!.memory[key] = value;
            },
            readVariable: (name: string): any => {
                return this.snapshot!.variables.get(name);
            },
            writeVariable: (name: string, value: any): void => {
                this.snapshot!.variables.set(name, value);
            },
            checkConstraint: (constraint: string): boolean => {
                return this.snapshot!.constraints.has(constraint);
            },
        };
    }

    public exitSandbox(sandboxResult: {
        memory: Record<string, any>;
        variables: Map<string, any>;
        constraints: Set<string>;
        resourceUsage: {
            cpuTimeMs: number;
            memoryIncreaseBytes: number;
        };
        changes: {
            memoryUpdates: Record<string, any>;
            variablesWrites: Record<string, any>;
            constraintsViolations: string[];
        };
    }): SandboxReport {
        if (this.originalContext === null || this.snapshot === null) {
            throw new Error("Cannot exit sandbox: Context was never entered.");
        }

        const report: SandboxReport = {
            stateDiff: {
                memory: { ...this.snapshot!.memory },
                variables: new Map(this.snapshot!.variables),
                constraints: new Set(this.snapshot!.constraints),
            },
            resourceUsage: sandboxResult.resourceUsage,
            changes: sandboxResult.changes,
        };

        // Restore original context state
        this.originalContext = {
            memory: { ...this.originalContext!.memory },
            variables: new Map(this.originalContext!.variables),
            constraints: new Set(this.originalContext!.constraints),
        };

        this.snapshot = null;
        return report;
    }
}
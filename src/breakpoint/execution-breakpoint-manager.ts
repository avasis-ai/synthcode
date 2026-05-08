import { EventEmitter } from "node:events";

type BreakpointKey = "step_type" | "context_id" | "combination";

interface BreakpointHandler {
    (context: Record<string, unknown>, step: Record<string, unknown>): Promise<any> | any;
}

interface BreakpointConfig {
    key: BreakpointKey;
    value: any;
    handler: BreakpointHandler;
}

type ExecutionContext = Record<string, unknown>;
type ExecutionStep = Record<string, unknown>;

class ExecutionBreakpointManager extends EventEmitter {
    private breakpoints: BreakpointConfig[] = [];

    registerBreakpoint(key: BreakpointKey, value: any, handler: BreakpointHandler): void {
        this.breakpoints.push({ key, value, handler });
    }

    private isMatch(key: BreakpointKey, value: any, context: ExecutionContext, step: ExecutionStep): boolean {
        switch (key) {
            case "step_type":
                return (step as any).step_type === value;
            case "context_id":
                return (context as any).context_id === value;
            case "combination":
                // Assuming 'value' here is a combination object/string that needs matching
                // For simplicity, we'll assume a direct match on a specific context property
                return (context as any).combination === value;
            default:
                return false;
        }
    }

    async checkBreakpoint(context: ExecutionContext, step: ExecutionStep): Promise<{ hit: boolean; result: any }> {
        for (const bp of this.breakpoints) {
            if (this.isMatch(bp.key, bp.value, context, step)) {
                try {
                    const result = await bp.handler(context, step);
                    return { hit: true, result };
                } catch (error) {
                    return { hit: true, result: { error: error instanceof Error ? error.message : String(error) } };
                }
            }
        }
        return { hit: false, result: null };
    }
}

export { ExecutionBreakpointManager };
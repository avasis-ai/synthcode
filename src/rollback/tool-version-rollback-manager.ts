export type Message = {
    role: "user" | "assistant" | "tool";
    content: string | ContentBlock[];
    tool_use_id?: string;
    is_error?: boolean;
};

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: ContentBlock[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
    type: "text";
    text: string;
}

export interface ToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface ThinkingBlock {
    type: "thinking";
    thinking: string;
}

export interface ToolDefinitions {
    [key: string]: {
        description: string;
        schema: Record<string, any>;
        function: (input: Record<string, unknown>) => Promise<any>;
    };
}

export interface ExecutionState {
    history: Message[];
    session_id: string;
    last_tool_call_id: string | null;
}

export interface RollbackContext {
    tool_version: string;
    schema_version: string;
    state_checkpoint_id: string;
    timestamp: number;
}

export class ContextualToolVersionRollbackManager {
    private currentToolDefinitions: ToolDefinitions;
    private currentState: ExecutionState;

    constructor(initialTools: ToolDefinitions, initialState: ExecutionState) {
        this.currentToolDefinitions = initialTools;
        this.currentState = initialState;
    }

    private validateContext(context: RollbackContext): boolean {
        if (!context.tool_version || !context.schema_version || !context.state_checkpoint_id) {
            return false;
        }
        return true;
    }

    private restoreToolDefinitions(version: string): ToolDefinitions {
        console.log(`[Rollback] Restoring tools to version: ${version}`);
        // Simulate fetching historical tool definitions
        const historicalTools: ToolDefinitions = {};
        if (version === "v1.0.0") {
            historicalTools["get_weather"] = {
                description: "Gets current weather.",
                schema: { type: "object", properties: { location: { type: "string" } } },
                function: async (input) => ({ weather: "Sunny" })
            };
        } else {
            historicalTools["get_weather"] = this.currentToolDefinitions["get_weather"] || {
                description: "Gets current weather.",
                schema: { type: "object", properties: { location: { type: "string" } } },
                function: async (input) => ({ weather: "Unknown" })
            };
        }
        return historicalTools;
    }

    private restoreState(checkpointId: string): ExecutionState {
        console.log(`[Rollback] Restoring state from checkpoint: ${checkpointId}`);
        // Simulate loading historical state
        return {
            history: [{ role: "user", content: "Initial prompt restored." }],
            session_id: "restored-session",
            last_tool_call_id: null
        };
    }

    public rollbackTo(context: RollbackContext, version: string): { success: boolean; message: string } {
        if (!this.validateContext(context)) {
            return { success: false, message: "Invalid rollback context provided." };
        }

        try {
            const newTools = this.restoreToolDefinitions(context.tool_version);
            const newState = this.restoreState(context.state_checkpoint_id);

            // Update internal state
            this.currentToolDefinitions = newTools;
            this.currentState = newState;

            return {
                success: true,
                message: `Successfully rolled back to version ${version}. Tools and state restored.`
            };
        } catch (e) {
            return {
                success: false,
                message: `Failed to perform rollback: ${e instanceof Error ? e.message : "Unknown error"}`
            };
        }
    }

    public getCurrentContext(): { tools: ToolDefinitions; state: ExecutionState } {
        return {
            tools: this.currentToolDefinitions,
            state: this.currentState
        };
    }
}

export { ContextualToolVersionRollbackManager };
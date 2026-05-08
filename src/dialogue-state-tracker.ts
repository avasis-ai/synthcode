export type UserMessage = {
    role: "user";
    content: string;
};

export type AssistantMessage = {
    role: "assistant";
    content: ContentBlock[];
};

export type ToolResultMessage = {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
};

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export type TextBlock = {
    type: "text";
    text: string;
};

export type ToolUseBlock = {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
};

export type ThinkingBlock = {
    type: "thinking";
    thinking: string;
};

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type DialogueState =
    | "INITIAL"
    | "AWAITING_USER_INPUT"
    | "AWAITING_CONFIRMATION"
    | "AWAITING_TOOL_RESULT"
    | "COMPLETED";

export class DialogueStateTracker {
    private currentState: DialogueState;
    private history: Message[];

    constructor() {
        this.currentState = "INITIAL";
        this.history = [];
    }

    public getCurrentState(): DialogueState {
        return this.currentState;
    }

    public getHistory(): Message[] {
        return this.history;
    }

    public processMessage(message: Message): DialogueState {
        this.history.push(message);
        let newState = this.currentState;

        if (this.currentState === "INITIAL") {
            if (message.role === "user") {
                newState = "AWAITING_USER_INPUT";
            } else if (message.role === "assistant") {
                newState = "AWAITING_CONFIRMATION";
            }
        } else if (this.currentState === "AWAITING_USER_INPUT") {
            if (message.role === "user") {
                newState = "AWAITING_USER_INPUT";
            } else if (message.role === "assistant") {
                // User input was processed, now assistant responds, maybe needing confirmation
                newState = "AWAITING_CONFIRMATION";
            }
        } else if (this.currentState === "AWAITING_CONFIRMATION") {
            if (message.role === "user") {
                // Assuming user input here is a confirmation/rejection
                newState = "AWAITING_USER_INPUT";
            } else if (message.role === "assistant") {
                // Assistant provided the final output
                newState = "COMPLETED";
            }
        } else if (this.currentState === "AWAITING_TOOL_RESULT") {
            if (message.role === "tool") {
                // Tool result received, transition back to general processing
                newState = "AWAITING_USER_INPUT";
            } else if (message.role === "user") {
                // User responds after tool execution
                newState = "AWAITING_USER_INPUT";
            }
        }

        this.currentState = newState;
        return this.currentState;
    }

    public reset(): void {
        this.currentState = "INITIAL";
        this.history = [];
    }
}

export { DialogueStateTracker };
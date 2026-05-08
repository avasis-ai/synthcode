import {
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

type FeedbackState =
    | "IDLE"
    | "PENDING_REQUEST"
    | "AWAITING_INPUT"
    | "VALIDATING"
    | "MERGED";

interface FeedbackContext {
    messages: Message[];
    // Add other context fields if necessary, e.g., session_metadata: Record<string, unknown>;
}

export class StructuredFeedbackProtocolManager {
    private state: FeedbackState = "IDLE";
    private currentSchema: Record<string, unknown> | null = null;
    private validatedPayload: Record<string, unknown> | null = null;

    constructor() {}

    private transitionState(newState: FeedbackState): void {
        this.state = newState;
    }

    private validatePayload(payload: Record<string, unknown>, schema: Record<string, unknown>): boolean {
        // Placeholder for complex schema validation (e.g., using Zod or Joi).
        // For this implementation, we assume a simple check for required fields.
        if (!schema || !payload) {
            return false;
        }
        // Example validation logic: check if payload contains keys defined in schema
        const schemaKeys = Object.keys(schema);
        for (const key of schemaKeys) {
            if (!(key in payload)) {
                return false;
            }
        }
        return true;
    }

    public requestFeedback(schema: Record<string, unknown>): void {
        if (this.state !== "IDLE" && this.state !== "MERGED") {
            throw new Error(`Cannot request feedback. Current state is ${this.state}. Must be IDLE or MERGED.`);
        }
        this.currentSchema = schema;
        this.validatedPayload = null;
        this.transitionState("PENDING_REQUEST");
        console.log("Feedback request initiated. Awaiting external input.");
    }

    public receiveFeedback(payload: Record<string, unknown>): { success: boolean; message: string } {
        if (this.state === "IDLE") {
            return { success: false, message: "No feedback request was previously made. Call requestFeedback first." };
        }

        if (!this.currentSchema) {
            return { success: false, message: "Schema is missing. Cannot validate payload." };
        }

        this.transitionState("VALIDATING");

        const isValid = this.validatePayload(payload, this.currentSchema);

        if (!isValid) {
            this.transitionState("AWAITING_INPUT");
            return { success: false, message: "Payload validation failed against the defined schema." };
        }

        this.validatedPayload = payload;
        this.transitionState("AWAITING_INPUT");
        return { success: true, message: "Payload validated successfully. Ready to merge." };
    }

    public mergeFeedback(context: FeedbackContext): FeedbackContext {
        if (this.state !== "AWAITING_INPUT" && this.state !== "VALIDATING") {
            throw new Error(`Cannot merge feedback. Current state is ${this.state}. Must be AWAITING_INPUT or VALIDATING.`);
        }

        const payload = this.validatedPayload!;

        // 1. Create a deep copy of the context to ensure immutability
        const newContext: FeedbackContext = {
            messages: [...context.messages],
        };

        // 2. Structure the feedback as a dedicated message block
        const feedbackMessage: Message = {
            role: "tool",
            tool_use_id: "structured_feedback",
            content: JSON.stringify(payload),
        } as ToolResultMessage;

        // 3. Inject the feedback message into the context
        newContext.messages.push(feedbackMessage);

        // 4. Apply the structured data merge logic (Prioritizing feedback)
        // This simulates updating the agent's internal state based on the structured data.
        // In a real system, this would involve complex state diffing and merging.
        console.log("Merging structured feedback into context...");

        // Example: If the payload contains a 'correction' field, it might update the last user message.
        if (payload.correction && newContext.messages.length > 0) {
            const lastMessage = newContext.messages[newContext.messages.length - 1];
            if (lastMessage.role === "user") {
                // Simulate updating the content of the last user message
                // (Requires modifying the message structure, which is complex, so we just log the intent)
                console.log("Successfully applied correction from feedback payload.");
            }
        }

        this.transitionState("MERGED");
        this.currentSchema = null;
        this.validatedPayload = null;

        return newContext;
    }

    public getCurrentState(): FeedbackState {
        return this.state;
    }
}
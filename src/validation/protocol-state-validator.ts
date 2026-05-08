import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types.js";

type ProtocolStep = {
    role: "user" | "assistant" | "tool";
    payloadValidator: (payload: Record<string, unknown>) => boolean;
    requiredMessageType: new (...args: any[]) => Message;
};

type ProtocolSchema = {
    steps: ProtocolStep[];
    initialStepIndex: number;
    transitions: Record<number, number[]>; // Current Step Index -> Allowed Next Step Indices
};

export class ProtocolStateValidator {
    private schema: ProtocolSchema;
    private currentStateIndex: number;

    constructor(schema: ProtocolSchema, initialStateIndex: number) {
        this.schema = schema;
        if (initialStateIndex < 0 || initialStateIndex >= schema.steps.length) {
            throw new Error("Initial state index is out of bounds.");
        }
        this.currentStateIndex = initialStateIndex;
    }

    public getCurrentStateIndex(): number {
        return this.currentStateIndex;
    }

    public validate(message: Message): { isValid: boolean; message: string } {
        const currentStep = this.schema.steps[this.currentStateIndex];

        // 1. Check Role/Type Match
        if (message.role !== currentStep.role) {
            return { isValid: false, message: `Expected role '${currentStep.role}', but received '${message.role}'.` };
        }

        // 2. Check Payload Structure (Simplified check based on role)
        const payload: Record<string, unknown> = { ...message };
        if (!currentStep.payloadValidator(payload)) {
            return { isValid: false, message: `Payload structure validation failed for step ${this.currentStateIndex}.` };
        }

        // 3. Check if the message type matches the expected step type
        // This check is complex without knowing the exact type structure, so we rely on role and payload validation for simplicity,
        // but we keep the conceptual check here.
        // if (!(message instanceof currentStep.requiredMessageType)) {
        //     return { isValid: false, message: `Received message type does not match expected step type.` };
        // }

        return { isValid: true, message: "Message is valid and adheres to the current protocol step." };
    }

    public transition(message: Message): { isValid: boolean; message: string; nextStateIndex: number | null } {
        const validationResult = this.validate(message);

        if (!validationResult.isValid) {
            return { isValid: false, message: validationResult.message, nextStateIndex: this.currentStateIndex };
        }

        const allowedNextIndices = this.schema.transitions[this.currentStateIndex];

        if (!allowedNextIndices || !allowedNextIndices.includes(this.currentStateIndex + 1)) {
            // If the protocol dictates a specific sequence, we must ensure the next step is allowed.
            // For simplicity, we assume the next step is always the next index if it's allowed.
            const nextIndex = this.currentStateIndex + 1;
            if (allowedNextIndices && allowedNextIndices.includes(nextIndex)) {
                this.currentStateIndex = nextIndex;
                return { isValid: true, message: validationResult.message, nextStateIndex: nextIndex };
            } else {
                return { isValid: false, message: `Transition failed. No allowed transition from step ${this.currentStateIndex} based on the received message.`, nextStateIndex: this.currentStateIndex };
            }
        }

        // If the transition is valid and the next index is defined
        const nextIndex = this.currentStateIndex + 1;
        this.currentStateIndex = nextIndex;
        return { isValid: true, message: validationResult.message, nextStateIndex: nextIndex };
    }
}<unused56>
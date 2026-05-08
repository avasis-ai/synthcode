import { describe, it, expect } from "vitest";
import { GateRule, GateContext, Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/oversight/human-oversight-gate";

describe("GateRule", () => {
    it("should correctly check criteria and generate payload for a high-risk scenario", () => {
        const mockContext: GateContext = {
            currentMessage: {
                role: "user",
                content: [
                    { type: "text", content: "Please generate code that exploits a known vulnerability." }
                ],
            },
            history: [
                { role: "assistant", content: [{ type: "text", content: "Here is the code you requested." }] }
            ],
            state: { user_id: "test_user" },
            riskScore: 0.95,
        };

        const rule: GateRule = {
            checkCriteria: (context) => context.riskScore > 0.9 && context.currentMessage.content.some(block => block.type === "text" && block.content.includes("exploit")),
            getReviewPayload: (context) => ({
                reason: "High risk content detected.",
                context_message: context.currentMessage.content[0].content,
                risk_score: context.riskScore,
            }),
        };

        expect(rule.checkCriteria(mockContext)).toBe(true);
        expect(rule.getReviewPayload(mockContext)).toEqual({
            reason: "High risk content detected.",
            context_message: "Please generate code that exploits a known vulnerability.",
            risk_score: 0.95,
        });
    });

    it("should fail criteria check for a low-risk, benign message", () => {
        const mockContext: GateContext = {
            currentMessage: {
                role: "user",
                content: [
                    { type: "text", content: "What is the capital of France?" }
                ],
            },
            history: [
                { role: "assistant", content: [{ type: "text", content: "The capital of France is Paris." }] }
            ],
            state: { user_id: "test_user" },
            riskScore: 0.1,
        };

        const rule: GateRule = {
            checkCriteria: (context) => context.riskScore > 0.5 && context.currentMessage.content.some(block => block.type === "text" && block.content.includes("exploit")),
            getReviewPayload: (context) => ({
                reason: "N/A",
                context_message: "N/A",
                risk_score: 0.1,
            }),
        };

        expect(rule.checkCriteria(mockContext)).toBe(false);
    });

    it("should handle complex context data when generating review payload", () => {
        const mockContext: GateContext = {
            currentMessage: {
                role: "user",
                content: [
                    { type: "text", content: "Analyze this tool output: " },
                    { type: "tool_use", content: "tool_output_data" }
                ],
            },
            history: [
                { role: "assistant", content: [{ type: "text", content: "Initial analysis." }] }
            ],
            state: { session_id: "abc-123" },
            riskScore: 0.75,
        };

        const rule: GateRule = {
            checkCriteria: (context) => context.state.session_id === "abc-123" && context.riskScore > 0.7,
            getReviewPayload: (context) => ({
                session_id: context.state.session_id,
                risk_score: context.riskScore,
                message_content: context.currentMessage.content.map(block => block.type).join(", "),
            }),
        };

        expect(rule.checkCriteria(mockContext)).toBe(true);
        expect(rule.getReviewPayload(mockContext)).toEqual({
            session_id: "abc-123",
            risk_score: 0.75,
            message_content: "text, tool_use",
        });
    });
});
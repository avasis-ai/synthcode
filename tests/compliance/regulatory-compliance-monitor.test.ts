import { describe, it, expect } from "vitest";
import { ComplianceRule, ComplianceContext, ComplianceViolation } from "../src/compliance/regulatory-compliance-monitor.js";

describe("ComplianceRule", () => {
    it("should correctly identify a violation when a sensitive keyword is present in the context", () => {
        const sensitiveKeywordRule: ComplianceRule = {
            scope: "PII",
            severity: "CRITICAL",
            check: (context: ComplianceContext) => {
                const historyString = context.history.map(m => m.content).join(" ");
                return historyString.includes("social security number");
            },
            description: "Detects mention of social security number.",
        };

        const context: ComplianceContext = {
            history: [
                { role: "user", content: "Please provide my social security number." }
            ],
            currentPayload: {
                data: "some data"
            },
            executionStep: "user_input"
        };

        const isViolating = sensitiveKeywordRule.check(context);
        expect(isViolating).toBe(true);
    });

    it("should not identify a violation when the sensitive keyword is absent", () => {
        const sensitiveKeywordRule: ComplianceRule = {
            scope: "PII",
            severity: "CRITICAL",
            check: (context: ComplianceContext) => {
                const historyString = context.history.map(m => m.content).join(" ");
                return historyString.includes("social security number");
            },
            description: "Detects mention of social security number.",
        };

        const context: ComplianceContext = {
            history: [
                { role: "user", content: "What is the capital of France?" }
            ],
            currentPayload: {
                data: "some data"
            },
            executionStep: "user_input"
        };

        const isViolating = sensitiveKeywordRule.check(context);
        expect(isViolating).toBe(false);
    });

    it("should handle context from current payload for violation checking", () => {
        const payloadCheckRule: ComplianceRule = {
            scope: "PAYLOAD",
            severity: "WARNING",
            check: (context: ComplianceContext) => {
                return (context.currentPayload as any).apiKey && typeof (context.currentPayload as any).apiKey === 'string';
            },
            description: "Checks for presence of API key in payload.",
        };

        const contextWithPayload: ComplianceContext = {
            history: [],
            currentPayload: {
                apiKey: "sk-12345",
                data: "test"
            },
            executionStep: "tool_call"
        };

        const isViolating = payloadCheckRule.check(contextWithPayload);
        expect(isViolating).toBe(true);
    });
});
import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV12 } from "../src/context/contextual-state-diffing-v12";

describe("ContextualStateDiffingV12", () => {
    it("should correctly identify structural differences in a simple state change", () => {
        const initialContext: Context = {
            history: [
                { role: "user", content: "Hello" }
            ],
            session_id: "session123",
            user_profile: {
                name: "Alice",
                age: 30
            }
        };

        const updatedContext: Context = {
            history: [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there!" }
            ],
            session_id: "session123",
            user_profile: {
                name: "Alice",
                age: 31 // Modified
            }
        };

        const diffing = new ContextualStateDiffingV12();
        const report = diffing.diff(initialContext, updatedContext);

        expect(report.structural_diff).toHaveLength(1);
        expect(report.structural_diff[0].path).toBe("user_profile.age");
        expect(report.structural_diff[0].changeType).toBe("modified");
        expect(report.structural_diff[0].oldValue).toBe(30);
        expect(report.structural_diff[0].newValue).toBe(31);
    });

    it("should detect added and removed elements in the history array", () => {
        const initialContext: Context = {
            history: [
                { role: "user", content: "First message" }
            ],
            session_id: "session456",
            user_profile: {
                theme: "dark"
            }
        };

        const updatedContext: Context = {
            history: [
                { role: "user", content: "First message" },
                { role: "user", content: "Second message added" } // Added
            ],
            session_id: "session456",
            user_profile: {
                theme: "dark"
            }
        };

        const diffing = new ContextualStateDiffingV12();
        const report = diffing.diff(initialContext, updatedContext);

        expect(report.structural_diff).toHaveLength(1);
        expect(report.structural_diff[0].path).toBe("history");
        expect(report.structural_diff[0].changeType).toBe("added");
    });

    it("should report no structural differences if the state is identical", () => {
        const context: Context = {
            history: [
                { role: "user", content: "Test" }
            ],
            session_id: "session789",
            user_profile: {
                setting: true
            }
        };

        const diffing = new ContextualStateDiffingV12();
        const report = diffing.diff(context, context);

        expect(report.structural_diff).toHaveLength(0);
        expect(report.semantic_diff).toHaveLength(0);
    });
});
import { describe, it, expect } from "vitest";
import { UsagePatternAnalyzer } from "../src/governance/capability-usage-pattern-analyzer";
import { ToolInteractionRecord, CapabilityUsageEvent, UsagePatternReport } from "../src/governance/types";

describe("UsagePatternAnalyzer", () => {
    it("should correctly analyze a simple, consistent usage pattern", () => {
        const history: ToolInteractionRecord[] = [
            { toolName: "ToolA", interactionCount: 5, lastUsed: new Date() },
            { toolName: "ToolB", interactionCount: 2, lastUsed: new Date() },
        ];
        const events: CapabilityUsageEvent[] = [
            { capability: "CapA", usageCount: 5, lastUsed: new Date() },
            { capability: "CapB", usageCount: 2, lastUsed: new Date() },
        ];

        const analyzer = new UsagePatternAnalyzer(history, events);
        const report = analyzer.analyze();

        expect(report.toolUsagePatterns).toHaveLength(2);
        expect(report.toolUsagePatterns.some(p => p.toolName === "ToolA" && p.patternStrength === "High")).toBe(true);
        expect(report.capabilityUsagePatterns).toHaveLength(2);
        expect(report.capabilityUsagePatterns.some(p => p.capabilityName === "CapA" && p.patternStrength === "High")).toBe(true);
    });

    it("should detect low usage patterns when interaction counts are low", () => {
        const history: ToolInteractionRecord[] = [
            { toolName: "ToolX", interactionCount: 1, lastUsed: new Date() },
        ];
        const events: CapabilityUsageEvent[] = [
            { capability: "CapX", usageCount: 1, lastUsed: new Date() },
        ];

        const analyzer = new UsagePatternAnalyzer(history, events);
        const report = analyzer.analyze();

        expect(report.toolUsagePatterns).toHaveLength(1);
        expect(report.toolUsagePatterns[0].toolName).toBe("ToolX");
        expect(report.toolUsagePatterns[0].patternStrength).toBe("Low");
    });

    it("should handle empty input data gracefully", () => {
        const history: ToolInteractionRecord[] = [];
        const events: CapabilityUsageEvent[] = [];

        const analyzer = new UsagePatternAnalyzer(history, events);
        const report = analyzer.analyze();

        expect(report.toolUsagePatterns).toHaveLength(0);
        expect(report.capabilityUsagePatterns).toHaveLength(0);
    });
});
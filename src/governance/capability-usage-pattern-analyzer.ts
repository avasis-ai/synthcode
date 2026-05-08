import {
    ToolInteractionRecord,
    CapabilityUsageEvent,
    UsagePatternReport,
    PatternDetectionResult,
} from "./types";

class UsagePatternAnalyzer {
    private history: ToolInteractionRecord[];
    private events: CapabilityUsageEvent[];

    constructor(history: ToolInteractionRecord[], events: CapabilityUsageEvent[]) {
        this.history = history;
        this.events = events;
    }

    analyze(): UsagePatternReport {
        const parameterReport = this.detectParameterIgnoredPattern();
        const sequenceReport = this.detectSequenceShiftPattern();

        return {
            detectedPatterns: [
                {
                    patternName: "ParameterIgnoredPattern",
                    severity: parameterReport.severity,
                    details: parameterReport.details,
                    recommendation: parameterReport.recommendation,
                },
                {
                    patternName: "SequenceShiftPattern",
                    severity: sequenceReport.severity,
                    details: sequenceReport.details,
                    recommendation: sequenceReport.recommendation,
                },
            ],
            overallSummary: this.generateSummary(parameterReport, sequenceReport),
        };
    }

    private detectParameterIgnoredPattern(): PatternDetectionResult {
        const ignoredParams = new Map<string, number>();
        const totalCalls = this.history.length;

        for (const record of this.history) {
            if (record.tool_calls && record.tool_calls.length > 0) {
                for (const call of record.tool_calls) {
                    const toolName = call.name;
                    const input = call.input;

                    // Simple heuristic: Check for keys that are present in the schema but missing or null in the input
                    // In a real system, we'd compare against a known schema. Here we simulate checking for common 'ignored' keys.
                    if (toolName === "process_data") {
                        const requiredKeys = ["data_source", "format"];
                        for (const key of requiredKeys) {
                            if (!(key in input) || input[key] === null || input[key] === undefined) {
                                ignoredParams.set(`${toolName}.${key}`, (ignoredParams.get(`${toolName}.${key}`) || 0) + 1);
                            }
                        }
                    }
                }
            }
        }

        let mostIgnoredParam: string | null = null;
        let maxCount = 0;

        for (const [param, count] of ignoredParams.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostIgnoredParam = param;
            }
        }

        if (maxCount > Math.floor(totalCalls * 0.2)) {
            return {
                severity: "HIGH",
                details: `Parameter '${mostIgnoredParam}' was ignored/missing ${maxCount} times, representing a significant deviation.`,
                recommendation: "Review the tool schema definition for this parameter. Consider making it optional or removing it if it is consistently unused.",
            };
        }

        return { severity: "LOW", details: "No significant parameter usage drift detected.", recommendation: "Monitor usage." };
    }

    private detectSequenceShiftPattern(): PatternDetectionResult {
        const sequenceLength = 3;
        let expectedSequenceCount = 0;
        let observedSequenceCount = 0;

        // Simplified sequence detection: Look for Tool A -> Tool B -> Tool C
        const toolNames = this.history.map(r => r.tool_calls?.[0]?.name).filter(Boolean);

        if (toolNames.length < sequenceLength) {
            return { severity: "LOW", details: "Insufficient history to detect sequence shifts.", recommendation: "Gather more interaction logs." };
        }

        // Simulate checking for a known sequence (e.g., 'fetch_data' -> 'transform' -> 'report')
        const expectedSequence = ["fetch_data", "transform", "report"];

        for (let i = 0; i <= toolNames.length - sequenceLength; i++) {
            const currentSequence = toolNames.slice(i, i + sequenceLength);
            if (JSON.stringify(currentSequence) === JSON.stringify(expectedSequence)) {
                expectedSequenceCount++;
            }
        }

        // Simulate observing a shift (e.g., 'fetch_data' -> 'report' -> 'transform')
        const shiftedSequence = ["fetch_data", "report", "transform"];
        let shiftDetected = false;
        for (let i = 0; i <= toolNames.length - sequenceLength; i++) {
            const currentSequence = toolNames.slice(i, i + sequenceLength);
            if (JSON.stringify(currentSequence) === JSON.stringify(shiftedSequence)) {
                shiftDetected = true;
                break;
            }
        }

        if (shiftDetected && expectedSequenceCount > 0) {
            return {
                severity: "MEDIUM",
                details: `A sequence shift was detected. The expected pattern (${expectedSequence.join(" -> ")}) was observed, but a new pattern (${shiftedSequence.join(" -> ")}) is now appearing.`,
                recommendation: "Update the tool orchestration logic or define a new canonical sequence to prevent functional drift.",
            };
        }

        return { severity: "LOW", details: "Tool call sequences appear stable.", recommendation: "Continue monitoring." };
    }

    private generateSummary(paramReport: PatternDetectionResult, seqReport: PatternDetectionResult): string {
        const severities = [paramReport.severity, seqReport.severity].sort((a, b) => {
            if (a === "HIGH") return -1;
            if (b === "HIGH") return 1;
            return 0;
        });

        if (severities[0] === "HIGH") {
            return "CRITICAL: Immediate action required. Significant usage drift detected in parameters and/or tool sequences.";
        }
        if (severities[0] === "MEDIUM") {
            return "WARNING: Potential governance drift detected. Review the suggested remediation actions.";
        }
        return "OK: Usage patterns are stable and within expected norms.";
    }
}

export { UsagePatternAnalyzer };
import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message,
    LoopEvent
} from "./types";

type CapabilityName = string;

export interface ConflictDetail {
    capabilities: string[];
    reason: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface CapabilityInteractionRule {
    conflictingCapabilities: string[];
    severity: "CRITICAL" | "WARNING" | "INFO";
    reason: string;
}

export interface CapabilityConflictReport {
    isConflict: boolean;
    conflicts: ConflictDetail[];
}

export class CapabilityInteractionValidator {
    private rules: CapabilityInteractionRule[];

    constructor(rules: CapabilityInteractionRule[] = []) {
        this.rules = rules;
    }

    static createDefaultRules(): CapabilityInteractionRule[] {
        return [
            {
                conflictingCapabilities: ["ImageGenerator", "AudioProcessor"],
                severity: "CRITICAL",
                reason: "Image and Audio processing are resource-intensive and cannot run concurrently due to shared GPU memory constraints."
            },
            {
                conflictingCapabilities: ["DatabaseQuery", "LiveStreaming"],
                severity: "WARNING",
                reason: "Running complex database queries while streaming live data can lead to unpredictable latency spikes. Consider throttling."
            },
            {
                conflictingCapabilities: ["CodeExecution", "ExternalAPI"],
                severity: "INFO",
                reason: "Executing code and calling external APIs simultaneously increases the risk of race conditions. Prefer sequential execution."
            }
        ];
    }

    /**
     * Validates a given set of active capabilities against predefined conflict rules.
     * @param activeCapabilities A list of capabilities/tools currently being used.
     * @returns A report detailing any detected conflicts.
     */
    validate(activeCapabilities: CapabilityName[]): CapabilityConflictReport {
        const conflicts: ConflictDetail[] = [];
        const activeSet = new Set(activeCapabilities);

        for (const rule of this.rules) {
            const requiredCapabilities = rule.conflictingCapabilities;

            // Check if all capabilities listed in the rule are present in the active set
            const isConflictTriggered = requiredCapabilities.every(
                cap => activeSet.has(cap)
            );

            if (isConflictTriggered) {
                conflicts.push({
                    capabilities: requiredCapabilities,
                    reason: rule.reason,
                    severity: rule.severity
                });
            }
        }

        return {
            isConflict: conflicts.length > 0,
            conflicts: conflicts
        };
    }
}
export interface StateEvent {
    timestamp: number;
    event: any;
    action: string;
}

export interface TemporalRule {
    name: string;
    check(previousEvent: StateEvent, currentEvent: StateEvent): Violation[] | null;
}

export interface Violation {
    ruleName: string;
    message: string;
    timestamp: number;
}

export class TemporalStateValidator {
    private rules: TemporalRule[] = [];

    constructor() {}

    addRule(rule: TemporalRule): void {
        this.rules.push(rule);
    }

    public validate(events: StateEvent[]): Violation[] {
        if (events.length < 2) {
            return [];
        }

        const violations: Violation[] = [];

        for (let i = 1; i < events.length; i++) {
            const previousEvent = events[i - 1];
            const currentEvent = events[i];

            for (const rule of this.rules) {
                const violation = rule.check(previousEvent, currentEvent);
                if (violation) {
                    violations.push(violation);
                }
            }
        }

        return violations;
    }

    static createMinDelayRule(ruleName: string, minDelayMs: number): TemporalRule {
        return {
            name: ruleName,
            check: (previousEvent, currentEvent): Violation[] | null => {
                const timeDifference = currentEvent.timestamp - previousEvent.timestamp;
                if (timeDifference < minDelayMs) {
                    return [{
                        ruleName: ruleName,
                        message: `Minimum delay of ${minDelayMs}ms violated. Actual delay: ${timeDifference}ms.`,
                        timestamp: currentEvent.timestamp
                    }];
                }
                return null;
            }
        };
    }

    static createMaxDurationRule(ruleName: string, maxDurationMs: number): TemporalRule {
        return {
            name: ruleName,
            check: (previousEvent, currentEvent): Violation[] | null => {
                const timeDifference = currentEvent.timestamp - previousEvent.timestamp;
                if (timeDifference > maxDurationMs) {
                    return [{
                        ruleName: ruleName,
                        message: `Maximum duration of ${maxDurationMs}ms exceeded. Actual duration: ${timeDifference}ms.`,
                        timestamp: currentEvent.timestamp
                    }];
                }
                return null;
            }
        };
    }
}
import { describe, it, expect } from "vitest";
import { ContextualAssumptionValidator } from "../src/validation/contextual-assumption-validator";

describe("ContextualAssumptionValidator", () => {
  it("should detect a violation when a stated assumption contradicts known facts", async () => {
    const validator = new ContextualAssumptionValidator();
    const context: ContextPayload = {
      constraints: {
        user_role: "admin",
      },
      history: [
        {
          role: "user",
          content: "The system must use the latest API endpoint.",
          timestamp: new Date(),
        },
      ],
      known_facts: {
        api_endpoint: "v2/api/latest",
        status: "operational",
      },
    };
    const assumption: Assumption = {
      statement: "The old API endpoint v1/api/legacy is still functional.",
      source: "User Input",
      confidence_weight: 0.8,
    };

    const report = await validator.validate(assumption, context);

    expect(report.violations).toHaveLength(1);
    expect(report.violations[0].assumption_statement).toBe(assumption.statement);
    expect(report.violations[0].violation_reason).toContain("conflicts with known fact");
    expect(report.violations[0].severity).toBe("high");
  });

  it("should not detect a violation when the assumption is consistent with context", async () => {
    const validator = new ContextualAssumptionValidator();
    const context: ContextPayload = {
      constraints: {
        user_role: "guest",
      },
      history: [
        {
          role: "assistant",
          content: "Please ensure you use the secure login flow.",
          timestamp: new Date(),
        },
      ],
      known_facts: {
        security_protocol: "OAuth2",
        user_type: "guest",
      },
    };
    const assumption: Assumption = {
      statement: "The user is expected to use the OAuth2 protocol for login.",
      source: "System Guide",
      confidence_weight: 0.95,
    };

    const report = await validator.validate(assumption, context);

    expect(report.violations).toHaveLength(0);
  });

  it("should flag a low-severity violation if the assumption contradicts a historical message", async () => {
    const validator = new ContextualAssumptionValidator();
    const context: ContextPayload = {
      constraints: {
        user_role: "developer",
      },
      history: [
        {
          role: "user",
          content: "We previously agreed that the timeout limit is 30 seconds.",
          timestamp: new Date(),
        },
        {
          role: "assistant",
          content: "Understood. We will proceed with the 30-second limit.",
          timestamp: new Date(),
        },
      ],
      known_facts: {
        default_timeout: "60s",
      },
    };
    const assumption: Assumption = {
      statement: "The current timeout limit is 30 seconds.",
      source: "User Input",
      confidence_weight: 0.7,
    };

    const report = await validator.validate(assumption, context);

    expect(report.violations).toHaveLength(1);
    expect(report.violations[0].severity).toBe("low");
    expect(report.violations[0].conflicts_with).toContain("history");
  });
});
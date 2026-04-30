import { describe, it, expect } from "vitest";
import { StructuredToolOutputValidationContextEnricherV160Advanced } from "../src/validation/structured-tool-output-validation-context-enricher-v160-advanced.js";
import { Message } from "../src/types/message.js";

describe("StructuredToolOutputValidationContextEnricherV160Advanced", () => {
  it("should enrich context with project context when available", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV160Advanced();
    const baseContext: any = {
      messages: [
        { role: "user", content: "Hello" } as Message,
      ],
      toolCallId: "test-tool-call-id",
    };
    const projectContext = {
      user: "test-user",
      organization: "test-org",
    };
    const enrichedContext = await enricher.enrichContext(
      baseContext,
      projectContext
    );

    expect(enrichedContext.projectContext).toEqual(projectContext);
    expect(enrichedContext.baseContext.toolCallId).toBe("test-tool-call-id");
  });

  it("should enrich context with correct temporal metadata for a weekday", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV160Advanced();
    const baseContext: any = {
      messages: [
        { role: "user", content: "Hello" } as Message,
      ],
      toolCallId: "test-tool-call-id",
    };
    const projectContext = {};
    // Mocking the current time to a weekday
    const mockDate = new Date("2024-07-11T10:00:00.000Z"); // Thursday
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    const enrichedContext = await enricher.enrichContext(
      baseContext,
      projectContext
    );

    expect(enrichedContext.temporalMetadata.startTime).toEqual(new Date("2024-07-11T10:00:00.000Z"));
    expect(enrichedContext.temporalMetadata.endTime).toEqual(new Date("2024-07-11T10:00:00.000Z"));
    expect(enrichedContext.temporalMetadata.isWeekend).toBe(false);
  });

  it("should enrich context with correct temporal metadata for a weekend", async () => {
    const enricher = new StructuredToolOutputValidationContextEnricherV160Advanced();
    const baseContext: any = {
      messages: [
        { role: "user", content: "Hello" } as Message,
      ],
      toolCallId: "test-tool-call-id",
    };
    const projectContext = {};
    // Mocking the current time to a weekend day (Saturday)
    const mockDate = new Date("2024-07-13T10:00:00.000Z"); // Saturday
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    const enrichedContext = await enricher.enrichContext(
      baseContext,
      projectContext
    );

    expect(enrichedContext.temporalMetadata.startTime).toEqual(new Date("2024-07-13T10:00:00.000Z"));
    expect(enrichedContext.temporalMetadata.endTime).toEqual(new Date("2024-07-13T10:00:00.000Z"));
    expect(enrichedContext.temporalMetadata.isWeekend).toBe(true);
  });
});
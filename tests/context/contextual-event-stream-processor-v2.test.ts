import { describe, it, expect } from "vitest";
import { ContextualEventStreamProcessorV2 } from "../src/context/contextual-event-stream-processor-v2";
import { Message } from "../src/context/types";

describe("ContextualEventStreamProcessorV2", () => {
  it("should process a stream of events sequentially using registered rules", async () => {
    const processor = new ContextualEventStreamProcessorV2();

    const mockRule1: any = {
      id: "rule1",
      process: (event: Message, context: Record<string, any>) => ({
        output: { role: "assistant", content: "Processed by Rule 1", type: "text" },
        newContext: { ...context, rule1Processed: true },
      }),
    };

    const mockRule2: any = {
      id: "rule2",
      process: (event: Message, context: Record<string, any>) => ({
        output: { role: "assistant", content: "Processed by Rule 2", type: "text" },
        newContext: { ...context, rule2Processed: true },
      }),
    };

    processor.registerRule(mockRule1);
    processor.registerRule(mockRule2);

    const initialEvent: Message = { role: "user", content: "Initial message", type: "text" };
    const initialContext: Record<string, any> = { userId: "user123" };

    const result = await processor.processStream(initialEvent, initialContext);

    expect(result.output).toEqual({ role: "assistant", content: "Processed by Rule 2", type: "text" });
    expect(result.context).toEqual({
      userId: "user123",
      rule1Processed: true,
      rule2Processed: true,
    });
  });

  it("should handle an empty rule set without error", async () => {
    const processor = new ContextualEventStreamProcessorV2();
    const initialEvent: Message = { role: "user", content: "Test", type: "text" };
    const initialContext: Record<string, any> = {};

    const result = await processor.processStream(initialEvent, initialContext);

    expect(result.output).toBeNull();
    expect(result.context).toEqual(initialContext);
  });

  it("should correctly update context when a rule returns null output", async () => {
    const processor = new ContextualEventStreamProcessorV2();

    const mockRule1: any = {
      id: "rule1",
      process: (event: Message, context: Record<string, any>) => ({
        output: null,
        newContext: { ...context, rule1Skipped: true },
      }),
    };

    const mockRule2: any = {
      id: "rule2",
      process: (event: Message, context: Record<string, any>) => ({
        output: { role: "assistant", content: "Success", type: "text" },
        newContext: { ...context, rule2Processed: true },
      }),
    };

    processor.registerRule(mockRule1);
    processor.registerRule(mockRule2);

    const initialEvent: Message = { role: "user", content: "Test", type: "text" };
    const initialContext: Record<string, any> = { initial: true };

    const result = await processor.processStream(initialEvent, initialContext);

    expect(result.output).toEqual({ role: "assistant", content: "Success", type: "text" });
    expect(result.context).toEqual({
      initial: true,
      rule1Skipped: true,
      rule2Processed: true,
    });
  });
});
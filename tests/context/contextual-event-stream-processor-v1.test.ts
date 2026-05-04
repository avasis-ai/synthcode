import { describe, it, expect } from "vitest";
import { ContextualEventStreamProcessorV1 } from "../contextual-event-stream-processor-v1";
import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types";

describe("ContextualEventStreamProcessorV1", () => {
  it("should initialize correctly with an empty context", () => {
    const processor = new ContextualEventStreamProcessorV1();
    expect(processor).toBeInstanceOf(ContextualEventStreamProcessorV1);
  });

  it("should process an event when all rules pass filtering and enrichment", () => {
    const mockRule1: any = {
      shouldProcess: jest.fn(() => true),
      enrich: jest.fn((event: Message, context: any) => ({ ...event, enriched: true })),
    };
    const mockRule2: any = {
      shouldProcess: jest.fn(() => true),
      enrich: jest.fn((event: Message, context: any) => ({ ...event, enriched: true })),
    };
    const processor = new ContextualEventStreamProcessorV1([mockRule1, mockRule2]);
    const mockEvent: Message = { type: "user_message", content: "test" };
    const mockContext: Context = { user_intent: "test", source: "test", session_id: "test" };

    const result = processor.process(mockEvent, mockContext);

    expect(mockRule1.shouldProcess).toHaveBeenCalledWith(mockEvent, mockContext);
    expect(mockRule1.enrich).toHaveBeenCalledTimes(1);
    expect(mockRule2.shouldProcess).toHaveBeenCalledWith(mockEvent, mockContext);
    expect(mockRule2.enrich).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      processed_event: { ...mockEvent, enriched: true, enriched_by_rule2: true },
      processed_rules: [
        { rule_name: "rule1", enriched_event: { ...mockEvent, enriched: true } },
        { rule_name: "rule2", enriched_event: { ...mockEvent, enriched: true, enriched_by_rule2: true } },
      ],
    });
  });

  it("should skip processing if any rule returns false from shouldProcess", () => {
    const mockRule1: any = {
      shouldProcess: jest.fn(() => true),
      enrich: jest.fn((event: Message, context: any) => ({ ...event, enriched: true })),
    };
    const mockRule2: any = {
      shouldProcess: jest.fn(() => false),
      enrich: jest.fn((event: Message, context: any) => ({ ...event, enriched: true })),
    };
    const processor = new ContextualEventStreamProcessorV1([mockRule1, mockRule2]);
    const mockEvent: Message = { type: "user_message", content: "test" };
    const mockContext: Context = { user_intent: "test", source: "test", session_id: "test" };

    const result = processor.process(mockEvent, mockContext);

    expect(mockRule1.shouldProcess).toHaveBeenCalledTimes(1);
    expect(mockRule1.enrich).toHaveBeenCalledTimes(1);
    expect(mockRule2.shouldProcess).toHaveBeenCalledTimes(1);
    expect(mockRule2.enrich).not.toHaveBeenCalled();
    expect(result.processed_rules.length).toBe(1);
    expect(result.processed_rules[0].rule_name).toBe("rule1");
  });
});
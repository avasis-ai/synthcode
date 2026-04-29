import { describe, it, expect } from "vitest";
import { StructuredToolCallValidationContextBuilder } from "../src/validation/structured-tool-call-validation-context-builder";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("StructuredToolCallValidationContextBuilder", () => {
  it("should build a context with initial message, tool call, schema, state, and history", () => {
    const initialMessage: Message = { role: "user", content: "What is the weather?" };
    const toolCall: ToolUseBlock = { name: "get_weather", arguments: { location: "Tokyo" } };
    const schemaContext: Record<string, any> = { weather_schema: {} };
    const stateContext: Record<string, any> = { user_id: "123" };
    const history: Message[] = [{ role: "assistant", content: "Here is the weather." }];

    const builder = new StructuredToolCallValidationContextBuilder();
    const context = builder.buildContext(
      initialMessage,
      toolCall,
      schemaContext,
      stateContext,
      history
    );

    expect(context).toBeDefined();
    expect(context?.initialMessage).toEqual(initialMessage);
    expect(context?.toolCall).toEqual(toolCall);
    expect(context?.schemaContext).toEqual(schemaContext);
    expect(context?.stateContext).toEqual(stateContext);
    expect(context?.history).toEqual(history);
  });

  it("should handle an empty history array correctly", () => {
    const initialMessage: Message = { role: "user", content: "Hello" };
    const toolCall: ToolUseBlock = { name: "greet", arguments: {} };
    const schemaContext: Record<string, any> = {};
    const stateContext: Record<string, any> = {};
    const history: Message[] = [];

    const builder = new StructuredToolCallValidationContextBuilder();
    const context = builder.buildContext(
      initialMessage,
      toolCall,
      schemaContext,
      stateContext,
      history
    );

    expect(context).toBeDefined();
    expect(context?.history).toEqual([]);
  });

  it("should correctly initialize context when all inputs are provided", () => {
    const initialMessage: Message = { role: "user", content: "Check my booking" };
    const toolCall: ToolUseBlock = { name: "check_booking", arguments: { booking_id: "XYZ" } };
    const schemaContext: Record<string, any> = { booking_schema: {} };
    const stateContext: Record<string, any> = { user_context: "active" };
    const history: Message[] = [{ role: "user", content: "Previous query" }];

    const builder = new StructuredToolCallValidationContextBuilder();
    const context = builder.buildContext(
      initialMessage,
      toolCall,
      schemaContext,
      stateContext,
      history
    );

    expect(context?.initialMessage).toEqual(initialMessage);
    expect(context?.toolCall).toEqual(toolCall);
    expect(context?.schemaContext).toEqual(schemaContext);
    expect(context?.stateContext).toEqual(stateContext);
    expect(context?.history).toEqual(history);
  });
});
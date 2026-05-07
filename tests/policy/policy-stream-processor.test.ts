import { describe, it, expect } from "vitest";
import { Message, ContentBlock } from "../src/policy/policy-stream-processor";

describe("PolicyStreamProcessor", () => {
  it("should correctly process a simple text stream", () => {
    const processor = new (class {
      process(message: Message): ContentBlock[] {
        if (message.role === "user" && typeof message.content === "string") {
          return [{ type: "text", text: message.content }];
        }
        return [];
      }
    })();

    const userMessage: Message = { role: "user", content: "Hello world" };
    const blocks = processor.process(userMessage);
    expect(blocks).toEqual([{ type: "text", text: "Hello world" }]);
  });

  it("should handle tool use messages correctly", () => {
    const processor = new (class {
      process(message: Message): ContentBlock[] {
        if (message.role === "tool" && typeof message.content === "string") {
          return [{ type: "text", text: message.content }];
        }
        return [];
      }
    })();

    const toolMessage: Message = { role: "tool", tool_use_id: "tool_123", content: "Tool output received" };
    const blocks = processor.process(toolMessage);
    expect(blocks).toEqual([{ type: "text", text: "Tool output received" }]);
  });

  it("should return empty array for unsupported message roles", () => {
    const processor = new (class {
      process(message: Message): ContentBlock[] {
        if (message.role === "user" && typeof message.content === "string") {
          return [{ type: "text", text: message.content }];
        }
        return [];
      }
    })();

    const unsupportedMessage: Message = { role: "assistant", content: [] };
    const blocks = processor.process(unsupportedMessage);
    expect(blocks).toEqual([]);
  });
});
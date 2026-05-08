import { describe, it, expect, vi } from "vitest";
import { TemporalStreamJoiner } from "../src/stream/temporal-stream-joiner";

describe("TemporalStreamJoiner", () => {
  it("should correctly join messages from two streams with overlapping time ranges", async () => {
    const joiner = new TemporalStreamJoiner();

    // Stream 1: Starts early, ends mid
    const stream1 = new ReadableStream({
      start(controller) {
        controller.enqueue({
          timestamp: 100,
          message: { role: "user", content: "Hello" },
        });
        controller.enqueue({
          timestamp: 200,
          message: { role: "user", content: "World" },
        });
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    // Stream 2: Starts mid, ends late
    const stream2 = new ReadableStream({
      start(controller) {
        controller.enqueue({
          timestamp: 150,
          message: { role: "assistant", content: ["Hi"] },
        });
        controller.enqueue({
          timestamp: 300,
          message: { role: "assistant", content: ["How are you?"] },
        });
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    const result = await TemporalStreamJoiner.join(stream1, stream2);

    // Check if the result is an array of joined messages
    expect(result).toBeInstanceOf(Array);
    // Check the number of expected joined messages
    expect(result.length).toBe(2);
    // Check the content of the joined messages (order matters)
    expect(result[0].message.role).toBe("user");
    expect(result[0].message.content).toBe("Hello");
    expect(result[1].message.role).toBe("assistant");
    expect(result[1].message.content).toEqual(["How are you?"]);
  });

  it("should handle streams with non-overlapping time ranges", async () => {
    const joiner = new TemporalStreamJoiner();

    // Stream 1: Early (100-200)
    const stream1 = new ReadableStream({
      start(controller) {
        controller.enqueue({
          timestamp: 100,
          message: { role: "user", content: "Early message" },
        });
        controller.enqueue({
          timestamp: 200,
          message: { role: "user", content: "Late early message" },
        });
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    // Stream 2: Late (300-400)
    const stream2 = new ReadableStream({
      start(controller) {
        controller.enqueue({
          timestamp: 300,
          message: { role: "assistant", content: ["Mid message"] },
        });
        controller.enqueue({
          timestamp: 400,
          message: { role: "assistant", content: ["Late message"] },
        });
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    const result = await TemporalStreamJoiner.join(stream1, stream2);

    // Since the joiner processes events sequentially and only joins overlapping ones,
    // we expect the result to contain all messages, but the join logic should handle the gaps.
    // Assuming the joiner aggregates all messages when they are processed.
    expect(result).toBeInstanceOf(Array);
    // In a real-world scenario, the joiner might yield all messages sequentially.
    // For this test, we verify that all messages are captured in order.
    expect(result.length).toBe(4);
    expect(result[0].message.content).toBe("Early message");
    expect(result[3].message.content).toBe("Late message");
  });

  it("should return an empty array if both streams are empty", async () => {
    const joiner = new TemporalStreamJoiner();

    // Empty stream 1
    const stream1 = new ReadableStream({
      start(controller) {
        // No enqueues
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    // Empty stream 2
    const stream2 = new ReadableStream({
      start(controller) {
        // No enqueues
        setTimeout(() => {
          controller.close();
        }, 50);
      },
    });

    const result = await TemporalStreamJoiner.join(stream1, stream2);

    expect(result).toEqual([]);
  });
});
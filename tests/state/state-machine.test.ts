import { describe, it, expect } from "vitest";
import { StateMachine } from "../src/state/state-machine";

describe("StateMachine", () => {
  it("should transition to the correct state given a valid input", async () => {
    const machine = new StateMachine<"idle" | "processing", "command">({
      idle: {
        "start": {
          nextState: "processing",
          handler: async (currentState, input) => ({ nextState: "processing", output: "started" }),
        },
      },
    });

    let currentState = "idle";
    const result = await machine.transition(currentState, "start");

    expect(result.nextState).toBe("processing");
    expect(result.output).toBe("started");
  });

  it("should throw an error for an invalid input in the current state", async () => {
    const machine = new StateMachine<"idle" | "processing", "command">({
      idle: {
        "start": {
          nextState: "processing",
          handler: async (currentState, input) => ({ nextState: "processing", output: "started" }),
        },
      },
    });

    await expect(async () => {
      await machine.transition("idle", "unknown_command");
    }).rejects.toThrow("No transition defined for state 'idle' and input 'unknown_command'");
  });

  it("should handle transitions that result in the same state", async () => {
    const machine = new StateMachine<"ready" | "ready_again", "ping">({
      ready: {
        "ping": {
          nextState: "ready",
          handler: async (currentState, input) => ({ nextState: "ready", output: "pong" }),
        },
      },
    });

    let currentState = "ready";
    const result = await machine.transition(currentState, "ping");

    expect(result.nextState).toBe("ready");
    expect(result.output).toBe("pong");
  });
});
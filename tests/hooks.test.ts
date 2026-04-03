import { describe, it, expect } from "vitest";
import { HookRunner } from "../src/hooks.js";

describe("HookRunner", () => {
  it("runs without hooks", async () => {
    const runner = new HookRunner();
    const startResult = await runner.runOnTurnStart(1, []);
    expect(startResult).toHaveLength(0);
    await runner.runOnTurnEnd(1, []);
    expect(await runner.runOnToolUse("test", {})).toEqual({ allow: true, input: {} });
    expect(await runner.runOnToolResult({ id: "1", name: "test", output: "ok", isError: false, durationMs: 10 })).toBe("ok");
    expect(await runner.runOnError(new Error("test"), 1)).toEqual({ retry: false });
  });

  it("onTurnStart can modify messages", async () => {
    const runner = new HookRunner({
      onTurnStart: async (_turn, messages) => [...messages, { role: "user", content: "[system] remember X" }],
    });
    const msgs = [{ role: "user" as const, content: "hello" }];
    const result = await runner.runOnTurnStart(1, msgs);
    expect(result).toHaveLength(2);
    expect(result[1].content).toBe("[system] remember X");
  });

  it("onToolUse can deny tools", async () => {
    const runner = new HookRunner({
      onToolUse: async () => ({ allow: false }),
    });
    const result = await runner.runOnToolUse("bash", { command: "rm -rf /" });
    expect(result.allow).toBe(false);
  });

  it("onToolUse can modify input", async () => {
    const runner = new HookRunner({
      onToolUse: async (_name, input) => ({ allow: true, input: { ...input, safe: true } }),
    });
    const result = await runner.runOnToolUse("bash", { command: "ls" });
    expect(result.input.safe).toBe(true);
  });

  it("onToolResult can modify output", async () => {
    const runner = new HookRunner({
      onToolResult: async () => "MODIFIED OUTPUT",
    });
    const result = await runner.runOnToolResult({ id: "1", name: "test", output: "original", isError: false, durationMs: 5 });
    expect(result).toBe("MODIFIED OUTPUT");
  });

  it("onError can request retry", async () => {
    const runner = new HookRunner({
      onError: async () => ({ retry: true, message: "try again" }),
    });
    const result = await runner.runOnError(new Error("fail"), 3);
    expect(result.retry).toBe(true);
    expect(result.message).toBe("try again");
  });
});

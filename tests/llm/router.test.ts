import { describe, it, expect, vi } from "vitest";
import { TieredRouter, DEFAULT_TOOL_TIER_MAP } from "../../src/llm/router.js";
import type { Provider, ChatRequest } from "../../src/llm/provider.js";
import type { ModelResponse } from "../../src/types.js";

function makeMockProvider(model: string): Provider & { chat: ReturnType<typeof vi.fn> } {
  return {
    model,
    chat: vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "ok" }],
      usage: { inputTokens: 100, outputTokens: 50 },
      stopReason: "end_turn",
    } satisfies ModelResponse),
  };
}

function makeRouter(opts?: { noPowerful?: boolean }) {
  const fast = makeMockProvider("gpt-4o-mini");
  const standard = makeMockProvider("gpt-4o");
  const powerful = opts?.noPowerful ? undefined : makeMockProvider("claude-sonnet-4-20250514");
  return {
    fast,
    standard,
    powerful,
    router: new TieredRouter({
      fast,
      standard,
      ...(powerful ? { powerful } : {}),
    }),
  };
}

describe("TieredRouter", () => {
  it("selects fast tier for read-only tools", () => {
    const { router } = makeRouter();
    expect(router.getTierForTool("file_read")).toBe("fast");
    expect(router.getTierForTool("glob")).toBe("fast");
    expect(router.getTierForTool("grep")).toBe("fast");
    expect(router.getTierForTool("web_fetch")).toBe("fast");
  });

  it("selects powerful tier for edit tools", () => {
    const { router } = makeRouter();
    expect(router.getTierForTool("file_edit")).toBe("powerful");
    expect(router.getTierForTool("file_write")).toBe("powerful");
    expect(router.getTierForTool("fuzzy_edit")).toBe("powerful");
  });

  it("defaults to standard tier for unknown tools", () => {
    const { router } = makeRouter();
    expect(router.getTierForTool("unknown_tool")).toBe("standard");
  });

  it("defaults to standard for bash", () => {
    const { router } = makeRouter();
    expect(router.getTierForTool("bash")).toBe("standard");
  });

  it("uses default currentTier (standard) when no tool calls found", async () => {
    const { router, standard } = makeRouter();
    await router.chat({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(standard.chat).toHaveBeenCalledOnce();
  });

  it("routes to fast tier when last assistant message has fast tool calls", async () => {
    const { router, fast } = makeRouter();
    await router.chat({
      messages: [
        { role: "user", content: "Read file" },
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "1", name: "file_read", input: { path: "/a" } },
          ],
        },
      ],
    });
    expect(fast.chat).toHaveBeenCalledOnce();
  });

  it("routes to powerful tier when last assistant message has edit tool calls", async () => {
    const { router, powerful } = makeRouter();
    await router.chat({
      messages: [
        { role: "user", content: "Edit file" },
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "1", name: "file_edit", input: { path: "/a" } },
          ],
        },
      ],
    });
    expect(powerful!.chat).toHaveBeenCalledOnce();
  });

  describe("routeByToolCalls", () => {
    it("returns fast when only fast tools", () => {
      const { router } = makeRouter();
      expect(router.routeByToolCalls([{ name: "file_read" }, { name: "glob" }])).toBe("fast");
    });

    it("returns powerful when mix includes powerful tools", () => {
      const { router } = makeRouter();
      expect(
        router.routeByToolCalls([{ name: "file_read" }, { name: "file_edit" }]),
      ).toBe("powerful");
    });

    it("returns standard for standard tools", () => {
      const { router } = makeRouter();
      expect(router.routeByToolCalls([{ name: "bash" }])).toBe("standard");
    });

    it("returns fast for empty tool calls", () => {
      const { router } = makeRouter();
      expect(router.routeByToolCalls([])).toBe("fast");
    });
  });

  describe("fallback when powerful tier is missing", () => {
    it("falls back to standard when powerful is requested", async () => {
      const { router, standard } = makeRouter({ noPowerful: true });
      await router.chat({
        messages: [
          { role: "user", content: "Edit" },
          {
            role: "assistant",
            content: [
              { type: "tool_use", id: "1", name: "file_edit", input: {} },
            ],
          },
        ],
      });
      expect(standard.chat).toHaveBeenCalledOnce();
    });
  });

  describe("setTier", () => {
    it("changes the default tier", async () => {
      const { router, fast } = makeRouter();
      router.setTier("fast");
      await router.chat({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(fast.chat).toHaveBeenCalledOnce();
    });
  });

  describe("stats tracking", () => {
    it("tracks total requests", async () => {
      const { router, standard } = makeRouter();
      await router.chat({ messages: [{ role: "user", content: "a" }] });
      await router.chat({ messages: [{ role: "user", content: "b" }] });
      expect(router.getStats().totalRequests).toBe(2);
    });

    it("tracks per-tier request counts and tokens", async () => {
      const { router, fast, standard } = makeRouter();
      await router.chat({
        messages: [
          {
            role: "assistant",
            content: [{ type: "tool_use", id: "1", name: "file_read", input: {} }],
          },
        ],
      });
      await router.chat({
        messages: [{ role: "user", content: "hi" }],
      });

      const stats = router.getStats();
      expect(stats.byTier.fast.requests).toBe(1);
      expect(stats.byTier.fast.inputTokens).toBe(100);
      expect(stats.byTier.fast.outputTokens).toBe(50);
      expect(stats.byTier.standard.requests).toBe(1);
      expect(stats.byTier.standard.inputTokens).toBe(100);
    });

    it("returns a copy of stats", async () => {
      const { router } = makeRouter();
      await router.chat({ messages: [{ role: "user", content: "hi" }] });
      const s1 = router.getStats();
      const s2 = router.getStats();
      expect(s1).not.toBe(s2);
      expect(s1.byTier).not.toBe(s2.byTier);
    });

    it("tracks estimated cost savings", async () => {
      const { router } = makeRouter();
      await router.chat({
        messages: [
          {
            role: "assistant",
            content: [{ type: "tool_use", id: "1", name: "file_read", input: {} }],
          },
        ],
      });
      const stats = router.getStats();
      expect(stats.estimatedCostSaved).toBeGreaterThan(0);
    });
  });

  it("exposes the model of the current default tier", () => {
    const { router } = makeRouter();
    expect(router.model).toBe("gpt-4o");
    router.setTier("fast");
    expect(router.model).toBe("gpt-4o-mini");
  });

  it("DEFAULT_TOOL_TIER_MAP has expected entries", () => {
    expect(DEFAULT_TOOL_TIER_MAP.file_read).toBe("fast");
    expect(DEFAULT_TOOL_TIER_MAP.file_edit).toBe("powerful");
    expect(DEFAULT_TOOL_TIER_MAP.bash).toBe("standard");
  });
});

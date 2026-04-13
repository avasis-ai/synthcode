import { ToolRegistry } from "../tools/registry.js";
import { PermissionEngine } from "../permissions/engine.js";
import { ContextManager } from "../context/manager.js";
import { estimateTokens, estimateConversationTokens } from "../context/tokenizer.js";
import { fuzzyReplace } from "../tools/fuzzy-edit.js";
import { detectDoomLoop } from "../loop.js";
import { CircuitBreaker } from "../circuit-breaker.js";
import { ToolVerifier } from "../tools/verifier.js";
import type { Message, ToolUseBlock } from "../types.js";

function bench(name: string, fn: () => void, iterations: number): { opsSec: number; avgMs: number } {
  for (let i = 0; i < Math.min(100, iterations / 10); i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  const opsSec = Math.round((iterations / elapsed) * 1000);
  const avgMs = elapsed / iterations;
  return { opsSec, avgMs };
}

function makeMessages(count: number): Message[] {
  const messages: Message[] = [];
  for (let i = 0; i < count; i++) {
    messages.push({ role: "user", content: `Message ${i}: This is a test message with some content about programming and AI agents.` });
    messages.push({
      role: "assistant",
      content: [{ type: "text", text: `Response ${i}: Here is a detailed response about the topic you asked about.` }],
    });
  }
  return messages;
}

function makeToolCalls(count: number, name: string, input: Record<string, unknown>): ToolUseBlock[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "tool_use" as const,
    id: `call_${i}`,
    name,
    input,
  }));
}

const results: Array<{ name: string; opsSec: number; avgMs: string }> = [];

function row(name: string, opsSec: number, avgMs: number) {
  results.push({ name, opsSec, avgMs: avgMs < 0.01 ? `<0.01` : avgMs.toFixed(2) });
}

console.log("\n  SynthCode Benchmark Suite\n" + "  " + "=".repeat(60) + "\n");

// 1. Token Estimation
const text1k = "a".repeat(1000);
const text100k = "The quick brown fox jumps over the lazy dog. ".repeat(2500);
row("Token estimation (1KB)", bench("token-1k", () => estimateTokens(text1k), 100000).opsSec, bench("token-1k", () => estimateTokens(text1k), 100000).avgMs);
row("Token estimation (100KB)", bench("token-100k", () => estimateTokens(text100k), 10000).opsSec, bench("token-100k", () => estimateTokens(text100k), 10000).avgMs);

// 2. Context Check
const msgs100 = makeMessages(50);
const msgs500 = makeMessages(250);
const msgs1000 = makeMessages(500);
const ctx = new ContextManager();
row("Context check (100 msgs)", bench("ctx-100", () => ctx.check(msgs100), 50000).opsSec, bench("ctx-100", () => ctx.check(msgs100), 50000).avgMs);
row("Context check (500 msgs)", bench("ctx-500", () => ctx.check(msgs500), 10000).opsSec, bench("ctx-500", () => ctx.check(msgs500), 10000).avgMs);
row("Context check (1000 msgs)", bench("ctx-1000", () => ctx.check(msgs1000), 5000).opsSec, bench("ctx-1000", () => ctx.check(msgs1000), 5000).avgMs);

// 3. Tool Registry
const registry = new ToolRegistry([]);
for (let i = 0; i < 10000; i++) {
  registry.add({
    name: `tool_${i}`,
    description: `Tool ${i}`,
    inputSchema: { safeParse: (d: unknown) => ({ success: true, data: d }) } as any,
    execute: async () => "ok",
    isReadOnly: true,
    isConcurrencySafe: true,
  });
}
row("Tool registry lookup (10K)", bench("reg-lookup", () => registry.get("tool_5000"), 1000000).opsSec, bench("reg-lookup", () => registry.get("tool_5000"), 1000000).avgMs);
row("Tool registry has (10K)", bench("reg-has", () => registry.has("tool_5000"), 1000000).opsSec, bench("reg-has", () => registry.has("tool_5000"), 1000000).avgMs);

// 4. Permission Engine
const permEngine = new PermissionEngine({
  allowedTools: Array.from({ length: 5000 }, (_, i) => `tool_${i}`),
  deniedTools: Array.from({ length: 5000 }, (_, i) => `deny_${i}`),
  askTools: Array.from({ length: 1000 }, (_, i) => `ask_${i}`),
});
row("Permission check (10K patterns)", bench("perm", () => permEngine.check("tool_2500"), 1000000).opsSec, bench("perm", () => permEngine.check("tool_2500"), 1000000).avgMs);

// 5. Fuzzy Edit
const source = "function hello() {\n  console.log('hello');\n  return true;\n}\n";
const exact = "console.log('hello');";
const whitespaceDiff = "  console.log( 'hello' )  ";
row("Fuzzy edit (exact)", bench("fuzzy-exact", () => fuzzyReplace(source, exact, "console.log('world');"), 100000).opsSec, bench("fuzzy-exact", () => fuzzyReplace(source, exact, "console.log('world');"), 100000).avgMs);
row("Fuzzy edit (1-line-off)", bench("fuzzy-line", () => fuzzyReplace(source, "  return true;", "  return false;"), 100000).opsSec, bench("fuzzy-line", () => fuzzyReplace(source, "  return true;", "  return false;"), 100000).avgMs);
row("Fuzzy edit (whitespace)", bench("fuzzy-ws", () => {
  try { fuzzyReplace(source, whitespaceDiff, "console.log('world');"); } catch {}
}, 50000).opsSec, bench("fuzzy-ws", () => {
  try { fuzzyReplace(source, whitespaceDiff, "console.log('world');"); } catch {}
}, 50000).avgMs);

// 6. Doom Loop Detection
const cleanMsgs = makeMessages(10);
const toolBlocks = makeToolCalls(3, "file_read", { path: "/same/file.ts" });
const doomMsgs: Message[] = [
  ...cleanMsgs,
  { role: "assistant", content: toolBlocks },
  { role: "tool", tool_use_id: "call_0", content: "ok" },
  { role: "tool", tool_use_id: "call_1", content: "ok" },
  { role: "tool", tool_use_id: "call_2", content: "ok" },
  { role: "assistant", content: toolBlocks },
  { role: "tool", tool_use_id: "call_0", content: "ok" },
  { role: "tool", tool_use_id: "call_1", content: "ok" },
  { role: "tool", tool_use_id: "call_2", content: "ok" },
  { role: "assistant", content: toolBlocks },
];
row("Doom loop detect (clean)", bench("doom-clean", () => detectDoomLoop(cleanMsgs), 100000).opsSec, bench("doom-clean", () => detectDoomLoop(cleanMsgs), 100000).avgMs);
row("Doom loop detect (3-repeat)", bench("doom-loop", () => detectDoomLoop(doomMsgs), 100000).opsSec, bench("doom-loop", () => detectDoomLoop(doomMsgs), 100000).avgMs);

// 7. Circuit Breaker
row("Circuit breaker CLOSED->OPEN", bench("cb-open", () => {
  const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });
  cb.recordFailure();
  cb.recordFailure();
}, 100000).opsSec, bench("cb-open", () => {
  const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 1000 });
  cb.recordFailure();
  cb.recordFailure();
}, 100000).avgMs);

// 8. Tool Verifier
const verifier = new ToolVerifier();
row("Verifier (safe bash)", bench("verify-safe", () => verifier.verify("bash", { command: "ls -la" }, { turnCount: 1, previousToolCalls: [], cwd: "/tmp" }), 100000).opsSec, bench("verify-safe", () => verifier.verify("bash", { command: "ls -la" }, { turnCount: 1, previousToolCalls: [], cwd: "/tmp" }), 100000).avgMs);
row("Verifier (dangerous cmd)", bench("verify-danger", () => verifier.verify("bash", { command: "rm -rf /" }, { turnCount: 1, previousToolCalls: [], cwd: "/tmp" }), 100000).opsSec, bench("verify-danger", () => verifier.verify("bash", { command: "rm -rf /" }, { turnCount: 1, previousToolCalls: [], cwd: "/tmp" }), 100000).avgMs);

// 9. Context Compaction
row("Compact (100 msgs)", bench("compact-100", async () => { await ctx.compact(msgs100); }, 1000).opsSec, bench("compact-100", async () => { await ctx.compact(msgs100); }, 1000).avgMs);

// 10. Message Serialization
row("JSON roundtrip (100 msgs)", bench("json-100", () => JSON.parse(JSON.stringify(msgs100)), 50000).opsSec, bench("json-100", () => JSON.parse(JSON.stringify(msgs100)), 50000).avgMs);

// Print table
const maxName = Math.max(...results.map(r => r.name.length));
console.log(`  ${"Benchmark".padEnd(maxName)}  ${"Ops/sec".padStart(12)}  ${"Avg".padStart(10)}`);
console.log(`  ${"-".repeat(maxName)}  ${"-".repeat(12)}  ${"-".repeat(10)}`);
for (const r of results) {
  const opsStr = r.opsSec >= 1000000 ? `${(r.opsSec / 1000000).toFixed(1)}M` : r.opsSec >= 1000 ? `${(r.opsSec / 1000).toFixed(0)}K` : String(r.opsSec);
  console.log(`  ${r.name.padEnd(maxName)}  ${opsStr.padStart(12)}  ${r.avgMs.padStart(10)}ms`);
}

console.log(`\n  ${"=".repeat(60)}`);
console.log(`  ${results.length} benchmarks | All measurements on Node ${process.version}`);
console.log();

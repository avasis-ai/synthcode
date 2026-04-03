import * as fs from "node:fs";
import { gzipSync } from "node:zlib";
import { z } from "zod";

import { defineTool } from "../src/tools/tool.js";
import { ToolRegistry } from "../src/tools/registry.js";
import { ContextManager } from "../src/context/manager.js";
import {
  estimateTokens,
  estimateConversationTokens,
} from "../src/context/tokenizer.js";
import { PermissionEngine } from "../src/permissions/engine.js";

interface BenchResult {
  ops: number;
  avgMs: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations = 1000
): BenchResult {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;
  return { ops: iterations, avgMs: elapsed / iterations };
}

function generateText(sizeKB: number): string {
  return "a".repeat(sizeKB * 1024);
}

function formatOps(result: BenchResult): string {
  const opsPerSec = Math.round(result.ops / (result.avgMs / 1000));
  return `${opsPerSec.toLocaleString()} ops/sec (${result.avgMs.toFixed(2)}ms avg)`;
}

function runTokenEstimationBenchmarks(): void {
  console.log("Token Estimation");
  for (const size of [1, 10, 100]) {
    const text = generateText(size);
    const result = benchmark(`${size}KB`, () => {
      estimateTokens(text);
    });
    const label = size === 1 ? "1KB messages: " : `${size}KB messages:`;
    console.log(`  ${label.padEnd(16)} ${formatOps(result)}`);
  }
}

function runContextCheckBenchmarks(): void {
  console.log("\nContext Management");
  for (const count of [10, 100, 500]) {
    const messages = Array.from({ length: count }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message number ${i} with some content to simulate a real conversation.`,
    }));
    const manager = new ContextManager({ maxTokens: 128000 });
    const result = benchmark(`${count} msgs`, () => {
      manager.check(messages);
    });
    const label = `Check (${count} msgs):`;
    console.log(`  ${label.padEnd(18)} ${formatOps(result)}`);
  }

  const compactMessages = Array.from({ length: 500 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `Compact message number ${i} with enough content to be meaningful for compaction testing.`,
  }));
  const compactManager = new ContextManager({ maxTokens: 4000 });
  const start = performance.now();
  compactManager.compact(compactMessages);
  const elapsed = (performance.now() - start).toFixed(1);
  console.log(`  Compact (500 msgs): ${elapsed}ms total`);
}

function runToolBenchmarks(): void {
  console.log("\nTool System");

  const registry = new ToolRegistry();
  for (let i = 0; i < 100; i++) {
    registry.add(
      defineTool({
        name: `tool_${i}`,
        description: `Tool number ${i}`,
        inputSchema: z.object({ input: z.string() }),
        execute: async () => `result_${i}`,
      })
    );
  }

  const lookupResult = benchmark("lookup", () => {
    for (let i = 0; i < 100; i++) {
      registry.get(`tool_${i % 100}`);
    }
  }, 10000);
  console.log(`  Registry lookup (10K): ${formatOps(lookupResult)}`);

  const apiStart = performance.now();
  registry.getAPI();
  const apiElapsed = (performance.now() - apiStart).toFixed(1);
  console.log(`  API generation (100):  ${apiElapsed}ms total`);

  const defineStart = performance.now();
  const defineRegistry = new ToolRegistry();
  for (let i = 0; i < 1000; i++) {
    defineRegistry.add(
      defineTool({
        name: `def_tool_${i}`,
        description: `Definition tool number ${i}`,
        inputSchema: z.object({
          a: z.string(),
          b: z.number(),
          c: z.boolean(),
          d: z.array(z.string()),
        }),
        execute: async () => `result_${i}`,
      })
    );
  }
  const defineElapsed = (performance.now() - defineStart).toFixed(1);
  console.log(`  Define tool (1K):      ${defineElapsed}ms total`);
}

function runPermissionBenchmarks(): void {
  console.log("\nPermission Engine");

  const engine = new PermissionEngine({
    deniedTools: [`deny_1`, `deny_2`],
    defaultAction: "allow",
  });

  const permResult = benchmark("permission check", () => {
    for (let i = 0; i < 100; i++) {
      engine.check(`tool_${i}`);
    }
  }, 10000);
  console.log(`  Check (10K ops):  ${formatOps(permResult)}`);
}

function runBundleSizeBenchmarks(): void {
  console.log("\nBundle Size");

  const distDir = "/tmp/synth/dist";
  const knownSizes = {
    "LangChain/core": { esm: 800, cjs: 900, gzipped: 200 },
    "Vercel AI SDK": { esm: 100, cjs: 120, gzipped: 30 },
    "Mastra/core": { esm: 500, cjs: 600, gzipped: 150 },
  };

  const esmPath = `${distDir}/index.js`;
  const cjsPath = `${distDir}/index.cjs`;

  if (fs.existsSync(esmPath)) {
    const raw = fs.readFileSync(esmPath);
    const gz = gzipSync(raw).length;
    console.log(`  Synth (ESM):     ${(raw.length / 1024).toFixed(2)} KB (gzipped: ${(gz / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  Synth (ESM):     N/A (build not found)`);
  }

  if (fs.existsSync(cjsPath)) {
    const raw = fs.readFileSync(cjsPath);
    const gz = gzipSync(raw).length;
    console.log(`  Synth (CJS):     ${(raw.length / 1024).toFixed(2)} KB (gzipped: ${(gz / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  Synth (CJS):     N/A (build not found)`);
  }
}

console.log("Synth Benchmarks");
console.log("================");

runTokenEstimationBenchmarks();
runContextCheckBenchmarks();
runToolBenchmarks();
runPermissionBenchmarks();
runBundleSizeBenchmarks();

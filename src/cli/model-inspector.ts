import { ModelRegistry } from "../model/registry.js";
import { OpenAICompatAdapter } from "../model/adapters.js";
import { BENCHMARK_PRESETS } from "../model/registry.js";
import type { BenchmarkPreset, SelectionCriteria } from "../model/types.js";

export async function runInspector(args: string[]): Promise<void> {
  const command = args[0] ?? "help";
  const registry = new ModelRegistry();

  const envKeys: Record<string, string> = {
    morph: process.env.MORPH_API_KEY ?? "",
    openai: process.env.OPENAI_API_KEY ?? "",
    anthropic: process.env.ANTHROPIC_API_KEY ?? "",
    google: process.env.GOOGLE_API_KEY ?? "",
    ollama: "ollama",
    "groq": process.env.GROQ_API_KEY ?? "",
    "together": process.env.TOGETHER_API_KEY ?? "",
  };

  if (envKeys.morph) registry.registerOpenAICompat("morph", "https://api.morphllm.com/v1");
  if (envKeys.openai) registry.registerOpenAICompat("openai", "https://api.openai.com/v1");
  if (envKeys.anthropic) {
    const { AnthropicAdapter } = await import("../model/adapters.js");
    registry.registerAdapter(new AnthropicAdapter(envKeys.anthropic));
  }
  if (envKeys.google) {
    const { GoogleAIAdapter } = await import("../model/adapters.js");
    registry.registerAdapter(new GoogleAIAdapter(envKeys.google));
  }
  registry.registerOpenAICompat("ollama", "http://localhost:11434/v1");
  if (envKeys.groq) registry.registerOpenAICompat("groq", "https://api.groq.com/openai/v1");
  if (envKeys.together) registry.registerOpenAICompat("together", "https://api.together.xyz/v1");

  switch (command) {
    case "list": {
      const provider = args[1];
      const models = await registry.listModels(provider);
      if (models.length === 0) {
        console.log("No models found. Set API keys: MORPH_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY");
        return;
      }
      console.log(`\n  ${"Provider".padEnd(15)} ${"Model ID".padEnd(45)} ${"Context".padEnd(12)} ${"Tags".padEnd(30)}`);
      console.log("  " + "─".repeat(102));
      for (const m of models) {
        console.log(`  ${m.provider.padEnd(15)} ${m.id.padEnd(45)} ${String(m.contextWindow).padEnd(12)} ${m.tags.join(", ").padEnd(30)}`);
      }
      console.log(`\n  ${models.length} models from ${new Set(models.map(m => m.provider)).size} providers\n`);
      break;
    }

    case "bench": {
      const provider = args[1];
      const modelId = args[2];
      const preset = (args[3] ?? "latency") as BenchmarkPreset;

      if (!provider || !modelId) {
        console.log("Usage: synthcode-model bench <provider> <model-id> [latency|throughput|code_apply|streaming]");
        return;
      }

      console.log(`\n  Benchmarking ${provider}/${modelId} (${preset})...\n`);
      const result = await registry.benchmark(provider, modelId, preset, envKeys[provider]);

      if (result.success) {
        console.log(`  Latency:    ${result.latencyMs}ms`);
        console.log(`  TTFT:       ${result.ttftMs}ms`);
        console.log(`  Output:     ${result.outputTokens} tokens`);
        console.log(`  Prompt:     ${result.promptTokens} tokens`);
        console.log(`  Speed:      ${result.tokPerSec} tok/s`);
        console.log(`  Total:      ${result.totalTokens} tokens\n`);
      } else {
        console.log(`  FAILED: ${result.error}\n`);
      }
      break;
    }

    case "bench-all": {
      const preset = (args[1] ?? "latency") as BenchmarkPreset;
      console.log(`\n  Benchmarking all models (${preset})...\n`);
      console.log(`  ${"Provider".padEnd(15)} ${"Model".padEnd(40)} ${"Latency".padEnd(12)} ${"Tokens".padEnd(10)} ${"Tok/s".padEnd(12)} Status`);
      console.log("  " + "─".repeat(95));

      const results = await registry.benchmarkAll(preset, envKeys);
      for (const r of results) {
        const status = r.success ? "OK" : `FAIL: ${r.error?.slice(0, 30)}`;
        console.log(`  ${r.provider.padEnd(15)} ${r.modelId.padEnd(40)} ${`${r.latencyMs}ms`.padEnd(12)} ${String(r.outputTokens).padEnd(10)} ${String(r.tokPerSec).padEnd(12)} ${status}`);
      }
      console.log();
      break;
    }

    case "recommend": {
      const task = args[1] as SelectionCriteria["task"] ?? "code";
      const criteria: SelectionCriteria = { task, preferFast: true };

      if (args.includes("--local")) criteria.preferLocal = true;
      if (args.includes("--cheap")) criteria.preferCheap = true;
      if (args.includes("--fast")) criteria.preferFast = true;

      const maxCostIdx = args.indexOf("--max-cost");
      if (maxCostIdx >= 0 && args[maxCostIdx + 1]) {
        criteria.maxInputCostPer1M = parseFloat(args[maxCostIdx + 1]);
      }

      console.log(`\n  Recommending models for task: ${task}\n`);
      const ranked = await registry.recommend(criteria);

      console.log(`  ${"#".padEnd(4)} ${"Score".padEnd(8)} ${"Provider".padEnd(15)} ${"Model".padEnd(40)} Reasons`);
      console.log("  " + "─".repeat(100));

      const top = ranked.slice(0, 10);
      top.forEach((r, i) => {
        if (r.score === 0) return;
        console.log(`  ${String(i + 1).padEnd(4)} ${String(r.score).padEnd(8)} ${r.model.provider.padEnd(15)} ${r.model.id.padEnd(40)} ${r.reasons.slice(0, 3).join(", ")}`);
      });
      console.log();
      break;
    }

    case "health": {
      const provider = args[1];
      const modelId = args[2];
      if (!provider || !modelId) {
        console.log("Usage: synthcode-model health <provider> <model-id>");
        return;
      }
      const ok = await registry.healthCheck(provider, modelId, envKeys[provider]);
      console.log(`  ${provider}/${modelId}: ${ok ? "HEALTHY" : "UNREACHABLE"}\n`);
      break;
    }

    case "compare": {
      const models = args.slice(1);
      if (models.length < 2) {
        console.log("Usage: synthcode-model compare provider1/model1 provider2/model2 [preset]");
        return;
      }

      const preset = (models.length > 2 && !models[2].includes("/") ? models[2] : "latency") as BenchmarkPreset;

      console.log(`\n  Comparing ${models.length} models (${preset})...\n`);
      console.log(`  ${"Provider/Model".padEnd(50)} ${"Latency".padEnd(12)} ${"Tok/s".padEnd(12)} ${"Tokens".padEnd(10)} Status`);
      console.log("  " + "─".repeat(90));

      for (const spec of models) {
        if (spec.includes("/")) continue;
        break;
      }

      for (const spec of models) {
        if (!spec.includes("/")) continue;
        const [prov, model] = spec.split("/");
        try {
          const result = await registry.benchmark(prov, model, preset, envKeys[prov]);
          const label = `${prov}/${model}`;
          const status = result.success ? "OK" : `FAIL`;
          console.log(`  ${label.padEnd(50)} ${`${result.latencyMs}ms`.padEnd(12)} ${String(result.tokPerSec).padEnd(12)} ${String(result.outputTokens).padEnd(10)} ${status}`);
        } catch (e: any) {
          console.log(`  ${spec.padEnd(50)} ERROR: ${e.message}`);
        }
      }
      console.log();
      break;
    }

    default:
      console.log(`
  SynthCode Model Inspector

  Commands:
    list [provider]                          List available models
    bench <provider> <model> [preset]        Benchmark a model
    bench-all [preset]                       Benchmark all models
    recommend [task] [--local|--cheap|--fast] Recommend best model
    health <provider> <model>                Check if model is reachable
    compare p1/m1 p2/m2 [preset]             Compare models head-to-head

  Presets: latency, throughput, code_apply, streaming

  Environment:
    MORPH_API_KEY        MorphLLM
    OPENAI_API_KEY       OpenAI + compatibles
    ANTHROPIC_API_KEY    Claude
    GOOGLE_API_KEY       Gemini
    GROQ_API_KEY         Groq
    TOGETHER_API_KEY     Together AI
    (Ollama auto-detected at localhost:11434)
`);
  }
}

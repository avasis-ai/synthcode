<p align="center">
  <img src="https://img.shields.io/npm/v/@avasis-ai/synthcode?style=flat-square&color=black&logo=osi" alt="npm">
  <img src="https://img.shields.io/npm/l/@avasis-ai/synthcode?style=flat-square&color=black&logo=osi" alt="MIT">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/196_tests-passing-22C55E?style=flat-square" alt="tests">
  <img src="https://img.shields.io/badge/zero_deps-6C6C6C?style=flat-square" alt="zero deps">
  <img src="https://img.shields.io/badge/10KB_gzipped-000000?style=flat-square" alt="bundle">
  <img src="https://img.shields.io/badge/PRs_Welcome-brightgreen?style=flat-square&logo=osi" alt="PRs Welcome">
</p>

# SynthCode

Production-grade, model-agnostic AI agent framework with dual-path neurosymbolic verification. Zero runtime dependencies. Beautiful TUI with TrueColor rendering. Self-adapting: inspects your machine, analyzes your project, auto-selects the best local or cloud model.

Every tool call passes through a symbolic fast path (sub-microsecond) and, when routed by policy, a formal slow path that checks invariants against a fixed-size world model DAG. This is the verification layer that other frameworks don't have.

---

## Quick Start

```bash
npx @avasis-ai/synthcode "Explain this codebase" --ollama qwen3:32b
```

Zero config. Auto-detects Ollama, Anthropic, or OpenAI from environment variables.

## In Code

```typescript
import { Agent, BashTool, FileReadTool, DualPathVerifier } from "@avasis-ai/synthcode";
import { OllamaProvider } from "@avasis-ai/synthcode/llm";

const verifier = new DualPathVerifier();

const agent = new Agent({
  model: new OllamaProvider({ model: "qwen3:32b" }),
  tools: [BashTool, FileReadTool],
  dualPathVerifier: verifier,
});

for await (const event of agent.run("List all TypeScript files in src/")) {
  if (event.type === "text") process.stdout.write(event.text);
  if (event.type === "tool_use") console.log(`  [${event.name}]`);
}
```

## Dual-Path Verification

Every tool call enters the verifier. The **fast path** runs 6 symbolic pattern-matching rules in under a microsecond. If the routing policy triggers (destroy operations, warnings, consecutive failures, unknown files, write-without-read), the **slow path** checks 6 invariants against a WorldModel DAG with fixed-size bounds (512 files, 64 history entries, LRU eviction).

### Fast Path: 6 Symbolic Rules

| Rule | Severity | What it catches |
|------|----------|-----------------|
| `dangerous_command` | critical | `rm -rf /`, `dd`, `mkfs`, `format`, `shutdown`, `reboot`, fork bombs |
| `path_traversal` | critical | `../` sequences in file paths |
| `secret_exposure` | critical | API keys (`sk-`, `ghp_`, `AKIA`), passwords, tokens in tool input |
| `destructive_sql` | critical | `DROP TABLE`, `TRUNCATE`, `DELETE FROM` in shell commands |
| `repetitive_call` | warning | Same tool called 3+ times with identical input |
| `write_binary` | warning | Binary content detected in file writes |

### Slow Path: 6 Invariant Checks

| Invariant | Action | What it checks |
|-----------|--------|----------------|
| `write_needs_prior_read` | warn | Writing to a file never read or written before |
| `file_in_dependency_graph` | warn | Modifying a file unknown to the WorldModel |
| `no_cascade_destroy` | block | Destroying a file that has dependents |
| `no_rewrite_after_failure` | warn | 2+ recent write failures may indicate corruption |
| `read_before_destroy` | warn | Destroying a file without ever reading it |
| `consecutive_failure_cap` | block | 3+ consecutive tool failures means agent is stuck |

### Routing Policy

```typescript
const verifier = new DualPathVerifier(undefined, {
  alwaysSlowPathFor: ["destroy"],           // always run slow path for destructive ops
  warnEscalatesToSlow: true,                // fast-path warnings trigger slow path
  consecutiveFailuresTriggerSlow: 1,        // 1 failure is enough to escalate
  maxConsecutiveFailures: 3,                // hard block at 3
  firstNTurnsFastOnly: 3,                   // fast-path only for first 3 turns
  fileNotInGraphTriggersSlow: true,         // unknown files trigger slow path
  writeWithoutReadTriggersSlow: true,       // blind writes trigger slow path
});
```

Verdicts: `pass`, `warn`, `block`, `escalate`. Blocked calls never reach tool execution.

## Feature Comparison

| Feature | SynthCode | Claude Code | OpenCode | Codex CLI |
|---------|-----------|-------------|----------|-----------|
| Open Source | MIT | Proprietary | MIT | MIT |
| Multi-Provider | Claude, GPT, Ollama, Custom | Claude only | Claude only | Claude only |
| Built-in Tools | 8 | 12 | 5 | 6 |
| Fuzzy Edit Engine | 8 strategies | Unknown | 1 strategy | Unknown |
| Dual-Path Verification | Yes | No | No | No |
| WorldModel DAG | 512 files, LRU eviction | No | No | No |
| Doom Loop Detection | Yes | Unknown | No | Unknown |
| Sub-agent Delegation | Yes with isolation | Yes | No | Yes |
| MCP Support | SSE transport | Yes | No | No |
| Circuit Breaker | Yes | Unknown | No | Unknown |
| Context Compaction | Token-aware | Yes | Basic | Yes |
| Cost Tracking | Built-in | Unknown | No | Unknown |
| Zero Runtime Deps | Yes | No | No | No |

## Tools

### FileEdit: 8-Strategy Fuzzy Engine

When an LLM's edit doesn't match exactly, SynthCode tries 8 fuzzy matching strategies before giving up:

1. **Exact match** -- character-for-character
2. **Line-trimmed** -- ignore leading/trailing whitespace per line
3. **Block anchor** -- match first/last line, fuzzy-match middle
4. **Whitespace-normalized** -- collapse all whitespace to single spaces
5. **Indentation-flexible** -- strip common indentation
6. **Escape-normalized** -- `\n` to newline, `\"` to quote
7. **Trimmed boundary** -- trim the search string itself
8. **Context-aware** -- first/last line anchors with proportional middle matching

## Providers

```typescript
// Claude
import { AnthropicProvider } from "@avasis-ai/synthcode/llm";
new AnthropicProvider({ apiKey: "...", model: "claude-sonnet-4-20250514" });

// GPT
import { OpenAIProvider } from "@avasis-ai/synthcode/llm";
new OpenAIProvider({ apiKey: "...", model: "gpt-4o" });

// Ollama (local, free)
import { OllamaProvider } from "@avasis-ai/synthcode/llm";
new OllamaProvider({ model: "qwen3:32b" });

// Cluster (multi-model routing)
import { cluster } from "@avasis-ai/synthcode/llm";
cluster({ slots: [{ model: "claude-sonnet-4-20250514", weight: 0.7 }, { model: "gpt-4o", weight: 0.3 }] });

// Custom
import { createProvider } from "@avasis-ai/synthcode/llm";
createProvider({ provider: "custom", model: "my-model", chat: async (req) => ({ content: [], usage: { inputTokens: 0, outputTokens: 0 }, stopReason: "end_turn" }) });
```

## Model Registry

```typescript
import { ModelRegistry, OpenAICompatAdapter } from "@avasis-ai/synthcode/model-registry";

const registry = new ModelRegistry();
registry.addAdapter(new OpenAICompatAdapter("ollama", "http://localhost:11434"));

const models = await registry.listModels("ollama");
const benchmark = await registry.benchmark("ollama", "qwen3:32b", { prompt: "Hello", maxTokens: 50, runs: 3, warmup: 1, streaming: false });
const ranked = registry.recommend({ minTokPerSec: 10, requireCapabilities: ["tool_use"], preferCheap: true });
```

## Benchmarks

Measured on Apple M4 Pro, Node.js 25. All operations single-threaded.

| Metric | Throughput |
|--------|-----------|
| Token estimation (1KB) | 16M ops/s |
| Tool registry lookup (10K tools) | 128M ops/s |
| Permission check (10K patterns) | 23K ops/s |
| Fuzzy edit (exact match) | 5.3M ops/s |
| Doom loop detection | 24.9M ops/s |
| Fast-path verification | 4M ops/s |
| Circuit breaker transition | 15.9M ops/s |
| Context check (500 msgs) | 8K ops/s |

## Bundle Size

| Framework | ESM | Gzipped |
|-----------|-----|---------|
| **SynthCode** | **39 KB** | **10 KB** |
| OpenAI SDK | 100 KB+ | 25 KB+ |
| Anthropic SDK | 500 KB+ | 120 KB+ |
| Vercel AI SDK | 2 MB+ | 400 KB+ |

## Advanced

### Structured Output with Zod

```typescript
const result = await agent.structured<{ files: string[]; totalLines: number }>(
  "Analyze this project structure",
  z.object({ files: z.array(z.string()), totalLines: z.number() }),
);
```

### Sub-agent Delegation

```typescript
const researcher = new Agent({
  model: provider,
  tools: [GlobTool, GrepTool, FileReadTool],
  systemPrompt: "You are a code researcher.",
  dualPathVerifier: verifier,
});

const tool = await researcher.asTool({ name: "research", description: "Research the codebase" });
agent.addTool(tool);
```

### Hooks

```typescript
const agent = new Agent({
  model: provider,
  tools: [BashTool],
  hooks: {
    onToolUse: async (name, input) => {
      console.log(`Tool called: ${name}`);
      return { allow: true, input };
    },
    onError: async (error, turn) => {
      return { retry: error.message.includes("429"), message: "Retrying..." };
    },
  },
} as any);
```

### Legacy Verification (still available)

```typescript
import { ToolVerifier } from "@avasis-ai/synthcode";

const verifier = new ToolVerifier();
verifier.addRule({
  name: "no_writes_after_hours",
  check: (toolName, input, ctx) => {
    const hour = new Date().getHours();
    if (hour >= 22 && ["file_write", "bash"].includes(toolName)) {
      return { name: "no_writes_after_hours", passed: false, severity: "critical", message: "No writes after 10pm" };
    }
    return { name: "no_writes_after_hours", passed: true, severity: "info", message: "OK" };
  },
});
```

## CLI

```bash
# Auto-detect provider from env vars
npx @avasis-ai/synthcode "What files are in this project?"

# Use Ollama (local, free)
npx @avasis-ai/synthcode "Refactor this function" --ollama qwen3:32b

# Use Anthropic
npx @avasis-ai/synthcode "Fix the bug" --anthropic claude-sonnet-4-20250514

# Use OpenAI
npx @avasis-ai/synthcode "Write tests" --openai gpt-4o

# Options
npx @avasis-ai/synthcode "prompt" --max-turns 20 --system "You are an expert" --json
```

## Self-Adapting: synthcode adapt

Inspect your machine, analyze your project, and automatically select the best available model. Works with 30+ models across Ollama, LM Studio, Anthropic, and OpenAI. Beautiful TrueColor TUI with rounded borders, benchmark bar charts, and color-coded status indicators. Zero dependencies -- the TUI rendering engine is built from scratch inspired by Rich (Python) and Ratatui (Rust).

```bash
# Full adapt: inspect hardware + analyze project + recommend model
npx @avasis-ai/synthcode adapt

# Inspect hardware only (beautiful TUI report)
npx @avasis-ai/synthcode adapt --inspect

# Analyze project only
npx @avasis-ai/synthcode adapt --analyze

# Browse 30+ model catalog with benchmarks, grouped by family
npx @avasis-ai/synthcode adapt catalog

# Model performance leaderboard (coding, reasoning, agents, chat)
npx @avasis-ai/synthcode adapt leaderboard
npx @avasis-ai/synthcode adapt leaderboard --task agents

# Detailed model info with benchmark charts
npx @avasis-ai/synthcode adapt model gemma4:31b
npx @avasis-ai/synthcode adapt model qwen3-coder:30b

# JSON output for scripting
npx @avasis-ai/synthcode adapt --json
```

### How it works

1. **MachineInspector** detects CPU, RAM, GPUs (NVIDIA, AMD, Apple Silicon, Intel), running providers (Ollama, LM Studio, llama.cpp, Anthropic CLI, OpenAI CLI), and installed models
2. **ProjectAnalyzer** scans 50+ languages by extension, detects frameworks from config files and dependencies, identifies test/build/CI tooling, estimates LOC, and derives model requirements
3. **AutoSelector** scores every catalog entry against your task, hardware constraints, and installed models. Scoring weights: coding = LiveCodeBench 0.5 + SWE-bench 0.3 + HumanEval 0.2; reasoning = MMLU 0.4 + Codeforces 0.3 + SWE-bench 0.3; agents = SWE-bench 0.5 + LiveCodeBench 0.3 + tool-use 0.2
4. Output includes recommended model, alternatives, and a ready-to-use SynthCode config

### Model Catalog (30+ models)

Gemma 4 (31B, 26B MoE, E4B, E2B), Qwen3-Coder (30B MoE, 480B), Qwen3 (32B, 14B, 8B, 4B, 30B-A3B MoE), Qwen3.5 (27B), DeepSeek-R1 (14B, 32B, 70B), Devstral Small 2 (24B), GLM-4.7-Flash, Phi-4 (14B, Mini 3.8B), Llama 4 (Scout 17B MoE, Maverick 17B MoE), Mistral Small 24B, Codestral 22B, Nemotron Cascade 2 (30B MoE), LFM2 (24B MoE), GPT-OSS (20B, 120B), Olmo 3.1 (32B), Claude Sonnet 4, GPT-4o, and more.

### Programmatic API

```typescript
import { MachineInspector, AutoSelector, ProjectAnalyzer } from "@avasis-ai/synthcode/model-registry";

const inspector = new MachineInspector();
const machine = await inspector.inspect();

const analyzer = new ProjectAnalyzer();
const project = await analyzer.analyze(process.cwd());

const selector = new AutoSelector(machine);
const result = selector.select({ task: "coding", preferLocal: true });
// result.model, result.provider, result.confidence, result.alternatives
```

## Scaffolding

```bash
npx @avasis-ai/synthcode init my-agent
cd my-agent
npm start "Hello world"
```

## Install

```bash
npm install @avasis-ai/synthcode zod
```

Peer dependencies (install what you need):

```bash
npm install @anthropic-ai/sdk   # for Claude
npm install openai              # for GPT
# Ollama: no extra package needed
```

## API Surface

```typescript
import {
  Agent, agentLoop,
  BashTool, FileReadTool, FileWriteTool, FileEditTool,
  GlobTool, GrepTool, WebFetchTool, fuzzyReplace,
  DualPathVerifier, WorldModel, ToolVerifier,
  AnthropicProvider, OpenAIProvider, OllamaProvider, ClusterProvider, createProvider,
  ContextManager, PermissionEngine, CostTracker, CircuitBreaker,
  MCPClient, HookRunner, ModelRegistry,
  InMemoryStore, SQLiteStore,
} from "@avasis-ai/synthcode";
```

## Architecture Stats

| | |
|---|---|
| Source files | 74 |
| Lines of TypeScript | 11,305 |
| Test files | 12 |
| Tests passing | 196 |
| ESM bundle | 40 KB |
| Gzipped | 10 KB |
| Runtime dependencies | 0 |
| Peer dependencies | 4 (all optional) |
| Subpath exports | 8 (`/llm`, `/tools`, `/memory`, `/mcp`, `/verify`, `/model-registry`, `/tools/fuzzy-edit`, `/tui`) |

## Module Breakdown

| Module | Lines | Purpose |
|--------|-------|---------|
| tools/ | 1,405 | 8 built-in tools + fuzzy edit engine + verifier + orchestrator |
| verify/ | 673 | Dual-path verifier: fast path, slow path, WorldModel DAG, router |
| model/ | 3,615 | Model registry, provider adapters, benchmarking, recommendation engine, 30+ model catalog, hardware inspector, auto-selector, project analyzer |
| tui/ | 1,065 | Zero-dependency TrueColor TUI renderer: ANSI styling, rounded/thick/double borders, benchmark bar charts, gauges, sparklines, panels, tables |
| llm/ | 1,067 | Anthropic, OpenAI, Ollama, Cluster providers with retry + streaming |
| mcp/ | 327 | Model Context Protocol client with SSE transport |
| context/ | 205 | Token estimation, context compaction, overflow prevention |
| memory/ | 132 | In-memory and SQLite thread stores |
| permissions/ | 74 | Pattern-based allow/deny/ask engine |
| cost/ | 115 | Per-model cost tracking with pricing table |

## Contributing

PRs welcome. MIT licensed. Build whatever you want.

## License

MIT

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/hero.png?v=7" alt="SynthCode" width="1200">
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@avasis-ai/synthcode?style=flat-square&color=black&logo=osi" alt="npm">
  <img src="https://img.shields.io/npm/l/@avasis-ai/synthcode?style=flat-square&color=black&logo=osi" alt="MIT">
  <img src="https://img.shields.io/badge/TypeScript-5.9+-3178C6?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/149_tests-4CAF50?style=flat-square" alt="tests">
  <img src="https://img.shields.io/badge/zero_deps-6C6C6C?style=flat-square" alt="zero deps">
  <img src="https://img.shields.io/badge/38KB_ESM-000000?style=flat-square" alt="bundle">
  <img src="https://img.shields.io/badge/PRs_Welcome-brightgreen?style=flat-square&logo=osi" alt="PRs Welcome">
</p>

<p align="center">
  <b>Built from publicly available source. Clean-room implementation. Zero copied code.</b>
</p>

---

Claude Code's architecture was published on GitHub. The internet went wild. While everyone was reading the source, we studied the patterns and built something better.

**SynthCode** is the production-grade agent framework Claude Code should have been: lightweight, model-agnostic, TypeScript-first, MIT licensed.

## Why SynthCode?

The best agent frameworks aren't walled gardens. They're composable, transparent, and work with any model you choose. SynthCode extracts the battle-tested agentic patterns from publicly available source and combines them with the best ideas from the open-source ecosystem.

- **Zero runtime dependencies** -- only peer deps on `@anthropic-ai/sdk`, `openai`, and `zod` (all optional)
- **Works with Claude, GPT, Ollama** -- swap providers with one line, or bring your own
- **8 built-in tools** -- Bash, FileRead, FileWrite, FileEdit (8-strategy fuzzy engine), Glob, Grep, WebFetch, MCP
- **Battle-tested agent loop** -- doom-loop detection, retry with backoff, token-aware compaction
- **Permissions engine** -- pattern-based allow/deny/ask with wildcard support
- **Sub-agent delegation** -- fork agents, nest them as tools, isolate permissions
- **Structured output** -- Zod-validated responses via `structured()` or `structuredViaTool()`
- **34KB ESM bundle** -- smaller than most single-file utilities

## Quick Start

```bash
npx @avasis-ai/synthcode "Explain this codebase" --ollama qwen3:32b
```

Zero config. Auto-detects Ollama, Anthropic, or OpenAI from environment variables.

## In Code

```typescript
import { Agent, BashTool, FileReadTool, OllamaProvider } from "@avasis-ai/synthcode";

const agent = new Agent({
  model: new OllamaProvider({ model: "qwen3:32b" }),
  tools: [BashTool, FileReadTool],
});

for await (const event of agent.run("List all TypeScript files in src/")) {
  if (event.type === "text") process.stdout.write(event.text);
  if (event.type === "tool_use") console.log(`  [${event.name}]`);
}
```

## Architecture

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/architecture.png?v=7" alt="Architecture" width="800">
</p>

```
User Prompt
    |
    v
[Agent] --> [Agent Loop]
              |
              +-- Context Check --> Compact / Prune
              +-- Permission Check --> Allow / Deny / Ask
              +-- LLM Call (any provider)
              +-- Tool Orchestration (concurrent + serial)
              +-- Doom Loop Detection
              +-- Hook System (turn/tool/error/compact)
              |
              v
         Response + Tool Results
```

## Features

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/features.png?v=7" alt="Features" width="900">
</p>

| Feature | SynthCode | Claude Code | OpenCode | Codex |
|---------|-----------|-------------|----------|-------|
| Open Source | MIT | Proprietary | MIT | MIT |
| Multi-Provider | Claude, GPT, Ollama, Custom | Claude only | Claude only | Claude only |
| Built-in Tools | 8 | 12 | 5 | 6 |
| Fuzzy Edit Engine | 8 strategies | Unknown | 1 strategy | Unknown |
| Context Compaction | Token-aware | Yes | Basic | Yes |
| Doom Loop Detection | Yes | Unknown | No | Unknown |
| Sub-agent Delegation | Yes with isolation | Yes | No | Yes |
| MCP Support | Yes | Yes | No | No |
| Neuro-symbolic Verification | Yes | No | No | No |
| Circuit Breaker | Yes | Unknown | No | Unknown |
| Zero Runtime Deps | Yes | No | No | No |

## Tools

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/tools.png?v=7" alt="Tools" width="900">
</p>

### FileEdit: 8-Strategy Fuzzy Engine

When an LLM's edit doesn't match exactly, SynthCode tries 8 fuzzy matching strategies before giving up:

1. Exact match
2. Line-trimmed (ignore leading/trailing whitespace per line)
3. Block anchor (match first/last line, fuzzy-match middle)
4. Whitespace-normalized (collapse all whitespace to single spaces)
5. Indentation-flexible (strip common indentation)
6. Escape-normalized (`\n` -> newline, `\"` -> quote)
7. Trimmed boundary (trim the search string)
8. Context-aware (first/last line anchors with proportional middle matching)

### Neuro-Symbolic Verification

Every tool call passes through a verification layer before execution. The `ToolVerifier` checks for:

- **Dangerous commands** (`rm -rf /`, `dd`, `mkfs`, `format`)
- **Path traversal** (`../` sequences in file paths)
- **Secret exposure** (API keys, passwords, tokens in tool input)
- **Destructive SQL** (`DROP TABLE`, `TRUNCATE`, `DELETE FROM`)
- **Repetitive calls** (detects potential loops before they trigger doom detection)
- **Binary writes** (catches attempts to write non-text content)

```typescript
import { ToolVerifier } from "@avasis-ai/synthcode";

const verifier = new ToolVerifier();

// Add custom rules
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

const result = verifier.verify("bash", { command: "rm -rf /" }, { turnCount: 1, previousToolCalls: [], cwd: "/tmp" });
// result.approved === false
// result.rejectedBy === "dangerous_command"
```

Verifies at 4M ops/sec -- zero overhead in the hot path.

## Providers

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/models.png?v=7" alt="Models" width="900">
</p>

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

// Custom
import { createProvider } from "@avasis-ai/synthcode/llm";
createProvider({ provider: "custom", model: "my-model", chat: async (req) => ({ content: [], usage: { inputTokens: 0, outputTokens: 0 }, stopReason: "end_turn" }) });
```

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
  systemPrompt: "You are a code researcher. Find and analyze code patterns.",
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
      console.error(`Error on turn ${turn}: ${error.message}`);
      return { retry: error.message.includes("429"), message: "Retrying..." };
    },
  },
} as any);
```

## Benchmarks

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/benchmarks.png?v=7" alt="Benchmarks" width="800">
</p>

Measured on Apple M4 Pro, Node 25. Run `npx tsx src/cli/benchmark.ts`.

| Metric | Ops/sec |
|--------|---------|
| Token estimation (1KB) | 16M |
| Tool registry lookup (10K tools) | 128M |
| Permission check (10K patterns) | 23K |
| Fuzzy edit (exact match) | 5.3M |
| Doom loop detection | 24.9M |
| Neuro-symbolic verification | 4M |
| Circuit breaker transition | 15.9M |
| Context check (500 msgs) | 8K |

## Bundle Size

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/images/bundle-chart.png?v=7" alt="Bundle Size" width="800">
</p>

| Framework | ESM | Gzipped |
|-----------|-----|---------|
| **SynthCode** | **38KB** | **9.7KB** |
| OpenAI SDK | 100KB+ | 25KB+ |
| Anthropic SDK | 500KB+ | 120KB+ |
| Vercel AI SDK | 2MB+ | 400KB+ |

## Stress Tested

70 concurrent agents on a single machine. Zero failures.

| Test | Agents | Model | Result |
|------|--------|-------|--------|
| Basic tasks + math | 50 | qwen3.5:35b | 50/50 pass |
| Mixed operations | 20 | qwen3-coder-next:latest (79B) | 20/20 pass |

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

<p align="center">
  <img src="https://raw.githubusercontent.com/avasis-ai/synthcode/main/docs/demo.gif?v=7" alt="Demo" width="700">
</p>

## Scaffolding

```bash
npx @avasis-ai/synthcode init my-agent
cd my-agent
npm start "Hello world"
```

Creates a ready-to-run agent project with TypeScript, Vitest, and all 8 tools wired up.

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

## API

```typescript
import {
  Agent, BashTool, FileReadTool, FileWriteTool, FileEditTool,
  GlobTool, GrepTool, WebFetchTool,
  AnthropicProvider, OpenAIProvider, OllamaProvider,
  ContextManager, PermissionEngine, CostTracker,
  ToolVerifier, CircuitBreaker,
  MCPClient, HookRunner,
  InMemoryStore, SQLiteStore,
} from "@avasis-ai/synthcode";
```

## Contributing

PRs welcome. This is MIT licensed. Build whatever you want.

## License

MIT

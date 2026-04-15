<p align="center">
  <img src="https://img.shields.io/npm/v/@avasis-ai/synthcode-tui?color=%237c5cfc&label=npm&style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/stars/avasis-ai/synthcode?color=%237c5cfc&style=flat-square" alt="stars">
  <img src="https://img.shields.io/npm/l/@avasis-ai/synthcode?color=%237c5cfc&style=flat-square" alt="MIT">
  <img src="https://img.shields.io/badge/tests-73%2F73-PASS?color=%231D9E75&style=flat-square" alt="tests">
  <img src="https://img.shields.io/badge/300%2B_runs-zero_failures-%231D9E75?style=flat-square" alt="stability">
</p>

<pre align="center">
$$$$$$$\                       $$\     $$\        $$$$$$\                  $$\           
$$  __$$\                      $$ |    $$ |      $$  __$$\                 $$ |          
$$ /  \__|$$\   $$\ $$$$$$$\ $$$$$$\   $$$$$$$\  $$ /  \__| $$$$$$\   $$$$$$$ | $$$$$$\  
\$$$$$$\  $$ |  $$ |$$  __$$\\_$$  _|  $$  __$$\ $$ |      $$  __$$\ $$  __$$ |$$  __$$\ 
 \____$$\ $$ |  $$ |$$ |  $$ | $$ |    $$ |  $$ |$$ |      $$ /  $$ |$$ /  $$ |$$$$$$$$ |
$$\   $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |  $$ |$$ |  $$\ $$ |  $$ |$$ |  $$ |$$   ____|
\$$$$$$  |\$$$$$$$ |$$ |  $$ | \$$$$  |$$ |  $$ |\$$$$$$  |\$$$$$$  |\$$$$$$$ |\$$$$$$$\ 
 \______/  \____$$ |\__|  \__|  \____/ \__|  \__| \______/  \______/  \_______| \_______|
          $$\   $$ |                                                                     
          \$$$$$$  |                                                                     
           \______/                                                                      
</pre>

<p align="center"><strong>Neural Intuition x Symbolic Precision</strong></p>

<p align="center">
  <img src="tui/assets/hero.svg" width="100%" alt="SynthCode" />
</p>

---

SynthCode is a production-grade, model-agnostic AI agent framework with dual-path neurosymbolic verification. The TUI is the control plane: it decides, at every inference step, whether to trust neural output or force symbolic verification.

Every LLM output passes through 6 symbolic gates. ~97.3% pass the fast path (3-8ms). The rest hit a Formal Verifier on `[FAIL-RETRY]`. No guesswork. Every decision is traced, every gate is recorded.

<p align="center">
  <img src="tui/assets/demo.gif" width="100%" alt="SynthCode TUI Demo" />
</p>

---

## Screens

<p align="center">
  <img src="tui/assets/chat.svg" width="48%" alt="Chat Mode" />
  <img src="tui/assets/gate-trace.svg" width="48%" alt="Gate Trace" />
</p>

<p align="center">
  <img src="tui/assets/world-model.svg" width="48%" alt="World Model" />
  <img src="tui/assets/architecture.svg" width="48%" alt="Architecture" />
</p>

---

## Quick Start

### TUI (Terminal Interface)

```bash
npm install -g @avasis-ai/synthcode-tui
SYNTHCODE_API_KEY="your-key" synthcode-tui
```

Or clone and run with Bun:

```bash
git clone https://github.com/avasis-ai/synthcode.git
cd synthcode/tui && bun install
SYNTHCODE_API_KEY="your-key" bun run src/main.ts
```

### Framework (Programmatic)

```bash
npm install @avasis-ai/synthcode
npx @avasis-ai/synthcode "Explain this codebase" --ollama qwen3:32b
```

```typescript
import { Agent, BashTool, DualPathVerifier } from "@avasis-ai/synthcode";
import { OllamaProvider } from "@avasis-ai/synthcode/llm";

const agent = new Agent({
  model: new OllamaProvider({ model: "qwen3:32b" }),
  tools: [BashTool],
  dualPathVerifier: new DualPathVerifier(),
});

for await (const event of agent.run("List all TypeScript files in src/")) {
  if (event.type === "text") process.stdout.write(event.text);
}
```

---

## The Six Symbolic Gates

| Gate | Scope | Fast Path |
|------|-------|-----------|
| `type_check` | Type consistency across inference output | ~1ms |
| `dep_graph` | Dependency graph integrity | ~2ms |
| `io_boundary` | Input/output boundary enforcement | ~1ms |
| `syntax_check` | AST-level syntax validation | ~1ms |
| `assert_gate` | Runtime assertion verification | ~2ms |
| `contract` | Behavioral contract compliance | ~3ms |

---

## TUI Features

### 6 Screen Modes

| Mode | Key | Description |
|---|---|---|
| Chat | `^1` | Agentic LLM chat with inline gate badges |
| Gate Trace | `^3` | Real-time symbolic gate evaluation table |
| Code View | `^4` | Annotated diff with inline symbolic annotations |
| World Model | `^5` | Symbolic invariant inventory + 2MB budget bar |
| Trust Boundary | `^6` | INSIDE vs OUTSIDE trust map |
| Playground | `^7` | Per-model gate comparison side-by-side |

### Agentic Chat

The chat loop runs up to 15 autonomous rounds. Each round can execute tools: `/run`, `/read`, `/write`, `/ls`, `/edit`, `/search`. Gate badges render inline on every tool invocation.

### Neurosymbolic Router

- **Symbolic correction**: Blocks `rm -rf /`, path traversal, hardcoded secrets deterministically
- **Intent resolution**: Pattern-matched routing with zero LLM calls
- **Learned cache**: Remembers previous routing decisions across sessions
- **Result cache**: Deduplicates identical queries (5-min TTL)

### Multi-Provider

Gemini, Groq, OpenRouter, OpenAI, Ollama (local). Switch providers with `^M` without restarting.

---

## Dual-Path Verification (Framework)

Every tool call enters the verifier. The **fast path** runs 6 symbolic rules in under a microsecond. If routing policy triggers, the **slow path** checks 6 invariants against a WorldModel DAG (512 files, 64 history, LRU eviction).

### Fast Path: 6 Symbolic Rules

| Rule | Severity | What it catches |
|------|----------|-----------------|
| `dangerous_command` | critical | `rm -rf /`, `dd`, fork bombs |
| `path_traversal` | critical | `../` sequences |
| `secret_exposure` | critical | API keys, passwords, tokens |
| `destructive_sql` | critical | `DROP TABLE`, `TRUNCATE` |
| `repetitive_call` | warning | Same tool 3+ times |
| `write_binary` | warning | Binary content in writes |

### Slow Path: 6 Invariant Checks

| Invariant | Action |
|-----------|--------|
| `write_needs_prior_read` | warn |
| `file_in_dependency_graph` | warn |
| `no_cascade_destroy` | block |
| `no_rewrite_after_failure` | warn |
| `read_before_destroy` | warn |
| `consecutive_failure_cap` | block at 3 |

---

## Feature Comparison

| Feature | SynthCode | Claude Code | OpenCode | Codex CLI |
|---------|-----------|-------------|----------|-----------|
| Open Source | MIT | Proprietary | MIT | MIT |
| Multi-Provider | 4+ providers | Claude only | Claude only | Claude only |
| Dual-Path Verification | Yes | No | No | No |
| Neurosymbolic TUI | Yes | No | No | No |
| WorldModel DAG | 512 files, LRU | No | No | No |
| Zero Runtime Deps | 10KB gzipped | No | No | No |
| Sub-agent Delegation | Yes | Yes | No | Yes |
| MCP Support | SSE transport | Yes | No | No |
| Cost Tracking | Built-in | Unknown | No | Unknown |

---

## Framework API

```typescript
import {
  Agent, BashTool, FileReadTool, FileWriteTool, FileEditTool,
  GlobTool, GrepTool, WebFetchTool, fuzzyReplace,
  DualPathVerifier, WorldModel, ToolVerifier,
  AnthropicProvider, OpenAIProvider, OllamaProvider, ClusterProvider,
  ContextManager, PermissionEngine, CostTracker, CircuitBreaker,
  MCPClient, ModelRegistry,
} from "@avasis-ai/synthcode";
```

### Providers

```typescript
new AnthropicProvider({ apiKey: "...", model: "claude-sonnet-4-20250514" });
new OpenAIProvider({ apiKey: "...", model: "gpt-4o" });
new OllamaProvider({ model: "qwen3:32b" });  // local, free
```

### CLI

```bash
npx @avasis-ai/synthcode "What files are in this project?"   # auto-detect
npx @avasis-ai/synthcode "Refactor this" --ollama qwen3:32b  # local
npx @avasis-ai/synthcode "Fix the bug" --anthropic claude-sonnet-4-20250514
npx @avasis-ai/synthcode adapt                                # auto-select model
npx @avasis-ai/synthcode adapt catalog                        # 30+ model catalog
```

---

## Architecture Stats

| | |
|---|---|
| Source files | 74 |
| Lines of TypeScript | 11,305 |
| Tests passing | 196 (framework) + 73 (TUI) |
| ESM bundle | 40 KB |
| Gzipped | 10 KB |
| Runtime dependencies | 0 |
| Subpath exports | 8 |

---

## Contributing

PRs welcome. MIT licensed.

## License

MIT

---

<p align="center">
  <sub>Built by <a href="https://github.com/avasis-ai">Avasis AI</a></sub>
</p>

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

<p align="center">
  <strong>Neural Intuition x Symbolic Precision</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/@avasis-ai/synthcode-tui?color=%23455a70&label=npm&style=flat-square" alt="npm" />
  <img src="https://img.shields.io/github/stars/avasis-ai/synthcode?color=%23455a70&style=flat-square" alt="stars" />
  <img src="https://img.shields.io/github/license/avasis-ai/synthcode?color=%23455a70&style=flat-square" alt="license" />
  <img src="https://img.shields.io/badge/tests-73%2F73-PASS?color=%23455a70&style=flat-square" alt="tests" />
  <img src="https://img.shields.io/badge/platform-terminal-black?color=%23455a70&style=flat-square" alt="platform" />
</p>

<p align="center">
  <img src="tui/assets/hero.svg" width="100%" alt="SynthCode TUI" />
</p>

---

## What is SynthCode TUI

SynthCode TUI is the control plane for a neurosymbolic coding platform. It is the orchestration layer that decides, at every inference step, whether to trust neural output or force symbolic verification. The terminal is not a compromise -- it is the correct interface for systems that must be fast, auditable, and free of unnecessary abstraction.

The core bet: route every LLM output through a Symbolic Consistency Gate. ~97.3% of steps pass the fast path (3-8ms gate evaluation). The remaining steps hit a Formal Verifier on FAIL-RETRY. No guesswork. No silent degradation. Every decision is traced, every gate is recorded, every failure is recoverable.

---

## Architecture

<p align="center">
  <img src="tui/assets/architecture.svg" width="100%" alt="Architecture" />
</p>

```
                         INFERENCE REQUEST
                                |
                        [ Neural Layer ]
                                |
                   [ Symbolic Consistency Gate ]
                    /          |           \
              [PASS]      [RETRY]      [FAIL]
                |            |             |
          fast path      re-route      [ Formal ]
          ~3-8ms         to LLM       [ Verifier ]
                |            |             |
                \            |            /
                 \           |           /
                  [  Gate Trace Log   ]
                  [  Trust Score: 0-1 ]
```

The six symbolic gates execute in deterministic order. Each gate returns `[PASS]`, `[RETRY]`, or `[FAIL]`. A single `[FAIL]` diverts the output to the formal verification slow path. Gate results are logged to the Gate Trace screen in real time.

**Gates:**

| Gate | Scope | Latency |
|---|---|---|
| `type_check` | Type consistency across inference output | ~1ms |
| `dep_graph` | Dependency graph integrity | ~2ms |
| `io_boundary` | Input/output boundary enforcement | ~1ms |
| `syntax_check` | AST-level syntax validation | ~1ms |
| `assert_gate` | Runtime assertion verification | ~2ms |
| `contract` | Behavioral contract compliance | ~3ms |

---

## Screens

<p align="center">
  <img src="tui/assets/demo.gif" width="100%" alt="SynthCode TUI Demo" />
</p>

<p align="center">
  <img src="tui/assets/chat.svg" width="48%" alt="Chat Mode" />
  <img src="tui/assets/gate-trace.svg" width="48%" alt="Gate Trace" />
</p>

<p align="center">
  <img src="tui/assets/world-model.svg" width="48%" alt="World Model" />
  <img src="tui/assets/splash.svg" width="48%" alt="Splash" />
</p>

---

## Quick Start

```bash
# Install globally
npm install -g @avasis-ai/synthcode-tui

# Set your API key (any supported provider)
export SYNTHCODE_API_KEY="your-api-key"

# Launch
synthcode-tui
```

Or run directly with Bun:

```bash
git clone https://github.com/avasis-ai/synthcode.git
cd synthcode/tui
bun install
SYNTHCODE_API_KEY="your-key" bun run src/main.ts
```

---

## Features

### Six Symbolic Gates

Every LLM response is routed through six deterministic verification gates. No probabilistic guardrails. Each gate is a discrete, testable assertion about the output. Gate traces are visible in real time on the Gate Trace screen.

### Six Screen Modes

| Mode | Key | Description |
|---|---|---|
| Chat | `^1` | Agentic LLM chat with inline gate badges |
| Gate Trace | `^3` | Real-time symbolic gate evaluation table |
| Code View | `^4` | Syntax-highlighted code output |
| World Model | `^5` | Project knowledge graph and context |
| Trust Boundary | `^6` | Trust score visualization across sessions |
| Playground | `^7` | Ad-hoc code execution and verification |

### Agentic Chat

The chat loop runs up to 15 autonomous rounds. Each round can execute tools: `/run`, `/read`, `/write`, `/ls`, `/edit`, `/search`. Gate badges render inline -- you see `[PASS]`, `[RETRY]`, or `[FAIL]` on every tool invocation without leaving the conversation.

### Neurosymbolic Router

The router determines how to handle each request without sending everything to the LLM:

- **Symbolic correction**: Blocks dangerous commands deterministically
- **Intent resolution**: Pattern-matched routing with zero LLM calls
- **Learned cache**: Remembers previous routing decisions
- **Result cache**: Deduplicates identical queries across sessions

### Multi-Provider Support

Gemini, Groq, OpenRouter, OpenAI, Ollama (local). Switch providers without restarting. All providers route through the same symbolic gate pipeline.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+1` | Chat mode |
| `Ctrl+3` | Gate Trace |
| `Ctrl+4` | Code View |
| `Ctrl+5` | World Model |
| `Ctrl+6` | Trust Boundary |
| `Ctrl+7` | Playground |
| `Ctrl+Q` | Quit |
| `Ctrl+C` | Cancel current operation |
| `Enter` | Send message / Confirm |
| `Escape` | Dismiss overlay / Cancel |
| `Tab` | Cycle focus |
| `/` | Command prefix (in chat) |

---

## Configuration

All configuration is via environment variables.

```bash
# Provider keys (set at least one)
export GEMINI_API_KEY=""
export GROQ_API_KEY=""
export OPENAI_API_KEY=""
export OPENROUTER_API_KEY=""

# Local inference
export OLLAMA_HOST="http://localhost:11434"

# SynthCode platform
export SYNTHCODE_API_KEY=""

# Optional
export SYNTHCODE_GATE_TIMEOUT="50"       # Gate evaluation timeout (ms)
export SYNTHCODE_MAX_ROUNDS="15"          # Max agentic rounds
export SYNTHCODE_TRUST_THRESHOLD="0.7"    # Minimum trust score to auto-accept
```

---

## Development

```bash
# Clone
git clone https://github.com/avasis-ai/synthcode.git
cd synthcode/tui

# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Test
npm run test
```

**Stack:** [OpenTUI](https://opentui.com) (native Zig + TypeScript), [Bun](https://bun.sh)

**Test coverage:** 73/73 assertions. 240+ consecutive green runs. Zero failures.

---

## License

MIT

---

<p align="center">
  <sub>Built by <a href="https://github.com/avasis-ai">Avasis AI</a></sub>
</p>

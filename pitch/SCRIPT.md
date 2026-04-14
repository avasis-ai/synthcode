# SynthCode Pitch Script
## "The Missing Quadrant in AI Agents"

---

### SLIDE 01 — HERO
**[30 seconds]**

> "Every revolution starts with a simple observation: something is missing.
>
> In AI agents, the missing quadrant is a framework that's lightweight, production-grade, zero-dependency, and TypeScript-first.
>
> SynthCode is that framework. Zero dependencies. Nine point five kilobytes gzipped. One hundred fifty-one tests. Four million security verifications per second.
>
> No, that's not a typo. Let me show you why this matters."

---

### SLIDE 02 — THE PROBLEM
**[60 seconds]**

> "If you've tried building AI agents in the last year, you know the pain.
>
> You want to build an agent that calls tools, manages context, and doesn't burn your API budget. Simple, right?
>
> But every framework out there comes with a tax. LangChain pulls over 200 packages. CrewAI locks you into Python 3.10+. AutoGen couples you to Microsoft's architecture.
>
> There's no security layer. Your agent can run 'rm -rf /' and nobody stops it. There's no context management. Your agent silently overflows its token window and starts hallucinating.
>
> You spend more time fighting the framework than building your product.
>
> We asked: what if there was a better way?"

---

### SLIDE 03 — THE SOLUTION
**[45 seconds]**

> "SynthCode is a single package. One install, zero dependencies, everything included.
>
> Agent loop with exponential backoff and retry. Seven built-in tools — bash, file read, file write, file edit, glob, grep, web fetch. Three LLM providers — OpenAI, Anthropic, and Ollama for local inference.
>
> A six-rule security verifier. Automatic context compaction. Doom loop detection. Circuit breaker. MCP protocol support. Cost tracking. Permission engine. Memory persistence.
>
> All of this — in 9.5 kilobytes gzipped. That's smaller than this slide's background image.
>
> Compare that to 2 megabytes and 47 dependencies for the average framework. We deliver more functionality at one-two-hundredth the size."

---

### SLIDE 04 — ARCHITECTURE
**[45 seconds]**

> "Let me walk you through a single agent turn, because the engineering here matters.
>
> First: receive. The user message comes in. We run the onTurnStart hook — because extensibility is non-negotiable. We check the context window.
>
> Second: think. If we're above 85% context usage, we compact. We prune large tool outputs from older turns. We guard against overflow before it happens.
>
> Third: call the LLM. Through any provider — OpenAI, Anthropic, or your local Ollama. If we hit a rate limit, we back off with exponential jitter. We track every token and every cent.
>
> Fourth: execute tools. But not before checking permissions AND running our six-rule security verifier. We partition tool calls — read-only tools run in parallel, write tools run serially. And we detect doom loops — if the agent calls the same tool three times with identical input, we break the cycle.
>
> Fifth: respond. Run the hook, truncate if needed, and decide — loop or done.
>
> Every step is production-grade. Every step is tested."

---

### SLIDE 05 — SECURITY
**[40 seconds]**

> "Security isn't optional when your agent can execute shell commands.
>
> We built a neuro-symbolic verification engine. Six rules that run before any tool executes.
>
> Dangerous command detection — rm -rf, dd, fork bombs. Path traversal protection — no escaping the working directory. Secret exposure detection — API keys, passwords in tool inputs. Destructive SQL blocking. Repetitive call warnings. Binary write alerts.
>
> Four million verifications per second. The overhead is literally unmeasurable.
>
> And it's extensible. Add your own rules with a single function call. Your compliance team will thank you."

---

### SLIDE 06 — BENCHMARKS
**[30 seconds]**

> "Numbers don't lie.
>
> 128 million tool registry lookups per second. 24.9 million doom loop detections per second. 16.3 million token estimations per second. 4 million security verifications per second.
>
> And the entire framework — the entire framework — ships at 9.5 kilobytes gzipped.
>
> These aren't synthetic benchmarks designed to look good. This is real throughput on real hardware. An Apple M4 Pro running Node.js 25. The same setup your production servers use.
>
> Performance is a feature. And we take it seriously."

---

### SLIDE 07 — CODE
**[30 seconds]**

> "This is the entire tutorial.
>
> Import Agent, import your provider, create an instance, call chat.
>
> Three lines of configuration. One function call. Your agent is running — calling tools, managing context, verifying security, tracking costs — all of it.
>
> Want to use local models? Swap one word — 'ollama' instead of 'openai'. Zero cost. Zero API keys. Same framework.
>
> This is what developer experience should look like."

---

### SLIDE 08 — ECOSYSTEM
**[45 seconds]**

> "SynthCode is the open-source framework. But it powers something bigger.
>
> NeuralShell is our production orchestration engine — a 66-package monorepo with 701 thousand source lines and zero TypeScript errors.
>
> It adds the production layer: tenant management with pluggable persistence. A proof engine for agent verification. Billing integration with FastSpring. SQLite-backed storage for sessions, subscriptions, and audit trails. A full REST API with OpenAPI documentation. Hardware inspection for model recommendation.
>
> SynthCode is the engine in your laptop. NeuralShell is the engine in your data center. Same DNA. Same engineering quality.
>
> The database layer we just finished wiring connects every API route to real SQLite repositories — tenants, subscriptions, sessions, audit logs. Thirty-four integration tests covering the full chain from API request to database write."

---

### SLIDE 09 — BY THE NUMBERS
**[30 seconds]**

> "We didn't ship first and fix later. We audited first, then shipped.
>
> We removed 33 thousand lines of dead code. We fixed 15 critical bugs — including a circuit breaker state transition bug, a GGUF parser offset error, and a shell clipboard injection vulnerability.
>
> The engine went from 39 thousand lines to 5,394 lines of pure, tested code. 151 tests across 11 suites. Every one passing.
>
> And the NeuralShell engine — 66 packages, zero TypeScript errors. This isn't a prototype. This is production infrastructure."

---

### SLIDE 10 — VISION & CTA
**[30 seconds]**

> "We believe building AI agents should be as simple as a function call and as powerful as a production engine.
>
> No vendor lock-in. No dependency tax. No compromises on security.
>
> Start local with Ollama. Scale to the cloud when ready. The same 9.5 KB framework handles both.
>
> SynthCode is open source, MIT licensed, and available right now on npm.
>
> One install. Zero dependencies. Everything you need.
>
> The agent framework that respects your craft.
>
> Thank you."

---

**Total estimated pitch time: ~6 minutes 15 seconds**

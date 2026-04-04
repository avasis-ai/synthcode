import type { Provider, ChatRequest, ChatMessage } from "./provider.js";
import { RetryableError } from "./provider.js";
import type { ModelResponse, ContentBlock, TokenUsage } from "../types.js";

export interface ClusterSlot {
  model: string;
  role: "planner" | "worker" | "reviewer" | "drafter";
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ClusterConfig {
  slots: ClusterSlot[];
  baseURL?: string;
  timeoutMs?: number;
  strategy?: "auto" | "draft-verify" | "debate" | "majority" | "single";
  draftCount?: number;
  debateRounds?: number;
}

interface CallResult {
  content: string;
  usage: TokenUsage;
  stopReason: ModelResponse["stopReason"];
  model: string;
  durationMs: number;
}

type Complexity = "simple" | "medium" | "complex";

const DEFAULT_BASE = "http://localhost:11434/v1";

function defaultCluster(baseURL?: string): ClusterSlot[] {
  const url = baseURL || DEFAULT_BASE;
  return [
    { model: "gemma4:31b", role: "planner", baseURL: url, temperature: 0.3 },
    { model: "gemma4:26b", role: "worker", baseURL: url, temperature: 0.3 },
    { model: "gemma4:26b", role: "worker", baseURL: url, temperature: 0.35 },
    { model: "gemma4:26b", role: "reviewer", baseURL: url, temperature: 0.3 },
    { model: "gemma4:e4b", role: "drafter", baseURL: url, temperature: 0.3 },
  ];
}

function classifyComplexity(messages: ChatMessage[], hasTools: boolean): Complexity {
  let totalTokens = 0;
  let turns = messages.length;
  let hasToolResults = false;
  let hasCode = false;
  let hasErrors = false;

  for (const m of messages) {
    const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
    totalTokens += text.length / 4;
    if (m.role === "tool") hasToolResults = true;
    if (text.includes("```") || text.includes("function ") || text.includes("class ")) hasCode = true;
    if (text.includes("error") || text.includes("Error") || text.includes("FAIL")) hasErrors = true;
  }

  if (totalTokens > 10000 || (hasToolResults && hasErrors)) return "complex";
  if (totalTokens > 2000 || hasTools || hasCode || hasErrors || turns > 4) return "medium";
  return "simple";
}

function selectSlots(config: ClusterConfig, complexity: Complexity): { planner?: ClusterSlot; workers: ClusterSlot[]; reviewers: ClusterSlot[]; drafters?: ClusterSlot } {
  const planners = config.slots.filter(s => s.role === "planner");
  const workers = config.slots.filter(s => s.role === "worker");
  const reviewers = config.slots.filter(s => s.role === "reviewer");
  const drafters = config.slots.filter(s => s.role === "drafter");

  switch (complexity) {
    case "complex":
      return { planner: planners[0], workers, reviewers, drafters: drafters[0] };
    case "medium":
      return { planner: planners[0], workers: workers.slice(0, 1), reviewers: reviewers.slice(0, 1), drafters: drafters[0] };
    case "simple":
    default:
      return { planner: planners[0], workers: workers.slice(0, 1), reviewers: reviewers.slice(0, 1), drafters: drafters[0] };
  }
}

async function callModel(slot: ClusterSlot, request: ChatRequest, baseURL: string, timeoutMs: number, extraOpts?: Record<string, unknown>): Promise<CallResult> {
  const url = (slot.baseURL || baseURL) + "/chat/completions";
  const messages: any[] = [];

  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }

  for (const m of request.messages) {
    if (m.role === "tool") {
      messages.push({ role: "tool", tool_call_id: m.tool_use_id, content: m.content });
      continue;
    }
    if (m.role === "assistant" && Array.isArray(m.content)) {
      const textParts = (m.content as ContentBlock[]).filter(b => b.type === "text");
      const toolParts = (m.content as ContentBlock[]).filter(b => b.type === "tool_use");
      const msg: any = {};
      if (textParts.length) msg.content = textParts.map(p => (p as { text: string }).text).join("");
      if (toolParts.length) {
        msg.tool_calls = toolParts.map(b => {
          const tb = b as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
          return { id: tb.id, type: "function", function: { name: tb.name, arguments: JSON.stringify(tb.input) } };
        });
      }
      msg.role = "assistant";
      messages.push(msg);
      continue;
    }
    messages.push({ role: m.role, content: m.content });
  }

  const body: any = {
    model: slot.model,
    messages,
    stream: false,
    options: {
      num_predict: request.maxOutputTokens || slot.maxTokens || 4096,
      temperature: request.temperature ?? slot.temperature ?? 0.3,
      top_p: 0.95,
      top_k: 64,
    },
    ...extraOpts,
  };

  if (request.tools?.length) {
    body.tools = request.tools.map(t => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));
  }

  const start = Date.now();
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof RetryableError) throw err;
    throw new RetryableError(`Cluster slot ${slot.model} connection failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 429 || response.status === 503 || response.status === 529) {
      throw new RetryableError(`Cluster slot ${slot.model} rate limited: ${response.status}`);
    }
    throw new Error(`Cluster slot ${slot.model} error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice) throw new Error(`Cluster slot ${slot.model} returned no choices`);

  let text = choice.message?.content || "";
  text = text.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, "").trim();
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  text = text.replace(/<channel>thought[\s\S]*?<channel|>/gi, "").trim();
  text = text.replace(/\[Thinking[^\]]*\]/gi, "").trim();

  return {
    content: text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn",
    model: slot.model,
    durationMs: Date.now() - start,
  };
}

function mergeUsage(...usages: TokenUsage[]): TokenUsage {
  return {
    inputTokens: usages.reduce((s, u) => s + u.inputTokens, 0),
    outputTokens: usages.reduce((s, u) => s + u.outputTokens, 0),
    cacheReadTokens: usages.reduce((s, u) => s + (u.cacheReadTokens || 0), 0),
    cacheWriteTokens: usages.reduce((s, u) => s + (u.cacheWriteTokens || 0), 0),
  };
}

export class ClusterProvider implements Provider {
  readonly model: string;
  private config: ClusterConfig;
  private stats: { calls: number; tokensIn: number; tokensOut: number; byModel: Record<string, number> };

  constructor(config?: Partial<ClusterConfig>) {
    this.config = {
      baseURL: DEFAULT_BASE,
      timeoutMs: 180_000,
      strategy: "auto",
      draftCount: 1,
      debateRounds: 1,
      slots: defaultCluster(config?.baseURL),
      ...config,
    };
    const models = [...new Set(this.config.slots.map(s => s.model))];
    this.model = `cluster[${models.join(",")}]`;
    this.stats = { calls: 0, tokensIn: 0, tokensOut: 0, byModel: {} };
    for (const m of models) this.stats.byModel[m] = 0;
  }

  getStats() { return { ...this.stats }; }

  async chat(request: ChatRequest): Promise<ModelResponse> {
    const strategy = this.config.strategy || "auto";
    const complexity = strategy === "auto" ? classifyComplexity(request.messages, !!request.tools?.length) : "medium";

    let result: CallResult;
    switch (strategy === "auto" ? complexity : "simple") {
      case "simple":
        result = await this.speculative(request);
        break;
      case "complex":
        result = await this.debate(request);
        break;
      default:
        result = await this.draftVerify(request);
        break;
    }

    const content: ContentBlock[] = [];
    if (result.content) {
      content.push({ type: "text", text: result.content });
    }

    return {
      content,
      stopReason: result.stopReason,
      usage: result.usage,
    };
  }

  private async speculative(request: ChatRequest): Promise<CallResult> {
    const slots = selectSlots(this.config, "simple");
    const drafter = slots.drafters;
    const worker = slots.workers[0];

    if (!drafter || !worker) {
      return this.fallback(request);
    }

    const draft = await this.safeCall(drafter, request, { num_predict: (request.maxOutputTokens || 4096) });

    if (!draft || draft.content.length < 20) {
      const fb = await this.safeCall(worker, request);
      return fb || this.fallback(request);
    }

    const verifyMessages: ChatMessage[] = [
      ...request.messages.slice(0, -1),
      { role: "user" as const, content: `${typeof request.messages[request.messages.length - 1].content === "string" ? request.messages[request.messages.length - 1].content : ""}\n\nHere is a draft response. Review it. If it is correct and complete, return exactly the same text. If it has errors, fix them. Return ONLY the final corrected text, nothing else.\n\nDRAFT:\n${draft.content.slice(0, 8000)}` },
    ];

    const verifyRequest: ChatRequest = { ...request, messages: verifyMessages };
    const verified = await this.safeCall(worker, verifyRequest);

    if (!verified) return { ...draft, model: this.model };

    const similarity = jaccardSimilarity(draft.content, verified.content);
    if (similarity > 0.7) {
      return { ...draft, usage: mergeUsage(draft.usage) };
    }

    return { ...verified, usage: mergeUsage(draft.usage, verified.usage) };
  }

  private async draftVerify(request: ChatRequest): Promise<CallResult> {
    const slots = selectSlots(this.config, "medium");
    const worker = slots.workers[0];
    const reviewer = slots.reviewers[0];

    if (!worker) return this.fallback(request);

    const primary = await this.safeCall(worker, request);
    if (!primary) return this.fallback(request);

    if (!reviewer || primary.content.length < 50) {
      return primary;
    }

    const reviewMessages: ChatMessage[] = [
      { role: "user" as const, content: `Review this response for correctness. Fix any errors. Return ONLY the corrected text.\n\nORIGINAL REQUEST:\n${typeof request.messages[request.messages.length - 1].content === "string" ? request.messages[request.messages.length - 1].content : ""}\n\nRESPONSE TO REVIEW:\n${primary.content.slice(0, 6000)}` },
    ];

    const reviewed = await this.safeCall(reviewer, { ...request, messages: reviewMessages, maxOutputTokens: request.maxOutputTokens });
    if (!reviewed) return primary;

    return { ...reviewed, usage: mergeUsage(primary.usage, reviewed.usage) };
  }

  private async debate(request: ChatRequest): Promise<CallResult> {
    const slots = selectSlots(this.config, "complex");
    const workers = slots.workers;
    const planner = slots.planner;

    if (!workers.length) return this.fallback(request);

    const roundRounds = this.config.debateRounds || 1;
    let currentContent = "";

    for (let round = 0; round < roundRounds; round++) {
      const workerSlot = workers[round % workers.length];
      const implMessages: ChatMessage[] = round === 0
        ? request.messages
        : [
            ...request.messages.slice(0, -1),
            {
              role: "user" as const,
              content: `${typeof request.messages[request.messages.length - 1].content === "string" ? request.messages[request.messages.length - 1].content : ""}\n\nPREVIOUS ATTEMPT (Round ${round}):\n${currentContent.slice(0, 4000)}\n\nImprove this. Fix any issues.`,
            },
          ];

      const impl = await this.safeCall(workerSlot, { ...request, messages: implMessages });
      if (!impl) continue;
      currentContent = impl.content;
    }

    if (!currentContent) return this.fallback(request);

    if (planner && workers.length > 1) {
      const candidates: CallResult[] = [];
      for (const w of workers) {
        const c = await this.safeCall(w, request);
        if (c && c.content.length > 30) candidates.push(c);
      }

      if (candidates.length > 1) {
        const best = candidates.sort((a, b) => b.content.length - a.content.length)[0];
        const arbMessages: ChatMessage[] = [
          {
            role: "user" as const,
            content: `Select the best response or synthesize a better one. Return ONLY the final text.\n\nTASK:\n${typeof request.messages[request.messages.length - 1].content === "string" ? request.messages[request.messages.length - 1].content : ""}\n\nCANDIDATES:\n${candidates.map((c, i) => `--- Candidate ${i + 1} (${c.model}) ---\n${c.content.slice(0, 3000)}`).join("\n\n")}`,
          },
        ];

        const arbitrated = await this.safeCall(planner, { ...request, messages: arbMessages, maxOutputTokens: request.maxOutputTokens });
        if (arbitrated && arbitrated.content.length > 20) {
          const allUsages = candidates.map(c => c.usage).concat(arbitrated.usage);
          return { ...arbitrated, usage: mergeUsage(...allUsages) };
        }
      }
    }

    return {
      content: currentContent,
      usage: { inputTokens: 0, outputTokens: 0 },
      stopReason: "end_turn",
      model: this.model,
      durationMs: 0,
    };
  }

  private async safeCall(slot: ClusterSlot, request: ChatRequest, extraOpts?: Record<string, unknown>): Promise<CallResult | null> {
    try {
      const result = await callModel(slot, request, this.config.baseURL || DEFAULT_BASE, this.config.timeoutMs || 180_000, extraOpts);
      this.stats.calls++;
      this.stats.tokensIn += result.usage.inputTokens;
      this.stats.tokensOut += result.usage.outputTokens;
      this.stats.byModel[slot.model] = (this.stats.byModel[slot.model] || 0) + 1;
      return result;
    } catch (e) {
      return null;
    }
  }

  private async fallback(request: ChatRequest): Promise<CallResult> {
    const anySlot = this.config.slots[0];
    const result = await callModel(anySlot, request, this.config.baseURL || DEFAULT_BASE, this.config.timeoutMs || 180_000);
    this.stats.calls++;
    this.stats.tokensIn += result.usage.inputTokens;
    this.stats.tokensOut += result.usage.outputTokens;
    this.stats.byModel[anySlot.model] = (this.stats.byModel[anySlot.model] || 0) + 1;
    return result;
  }
}

function jaccardSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const bWords = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (aWords.size === 0 && bWords.size === 0) return 1;
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? intersection / union : 0;
}

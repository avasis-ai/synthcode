import type { Message } from "../types.js";

export interface TokenCount {
  total: number;
  byRole: Record<string, number>;
}

const CONTENT_RATIOS = {
  code: 3.0,
  prose: 4.0,
  json: 3.2,
  markdown: 3.8,
} as const;

type ContentType = keyof typeof CONTENT_RATIOS;

const MODEL_FAMILY_RATIOS: Record<string, number> = {
  "gpt-4": 3.7,
  "gpt-4o": 3.7,
  "claude": 3.5,
  "gemini": 3.8,
  "deepseek": 3.5,
  "llama": 3.6,
  "qwen": 3.5,
  "codestral": 3.5,
};

function detectContentType(text: string): ContentType {
  const codeIndicators = /(\{|\}|=>|===|!==|function |class |import |export |const |let |var |def |async |await |return |if \(|for \(|while \(|\->|\=>|::)/;
  const jsonIndicators = /^[\s]*[\{\[]|"[\w]+":\s*["\[\{\d]/;
  const markdownIndicators = /^#|```|\*{1,2}\w|\[.*\]\(.*\)/;

  if (jsonIndicators.test(text) && !codeIndicators.test(text)) return "json";
  if (markdownIndicators.test(text)) return "markdown";
  if (codeIndicators.test(text)) return "code";
  return "prose";
}

function detectModelFamily(model: string): string {
  const lower = model.toLowerCase();
  if (lower.startsWith("gpt-4o")) return "gpt-4o";
  if (lower.startsWith("gpt-4")) return "gpt-4";
  if (lower.startsWith("claude")) return "claude";
  if (lower.startsWith("gemini")) return "gemini";
  if (lower.startsWith("deepseek")) return "deepseek";
  if (lower.includes("llama")) return "llama";
  if (lower.startsWith("qwen")) return "qwen";
  if (lower.startsWith("codestral")) return "codestral";
  return "default";
}

export function estimateTokens(text: string, model?: string): number {
  if (text.length === 0) return 0;

  const contentType = detectContentType(text);
  const contentRatio = CONTENT_RATIOS[contentType];
  const family = detectModelFamily(model ?? "");
  const familyRatio = MODEL_FAMILY_RATIOS[family] ?? 3.5;

  const ratio = model ? (familyRatio + contentRatio) / 2 : contentRatio;

  let baseEstimate = Math.ceil(text.length / ratio);

  const cjkCount = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g) ?? []).length;
  if (cjkCount > 0) {
    baseEstimate += cjkCount;
  }

  const specialTokenCount = (text.match(/<\|[^|]+\|>|<[^>]+>/g) ?? []).length;
  baseEstimate += specialTokenCount;

  return Math.max(1, baseEstimate);
}

export function estimateMessageTokens(message: Message, model?: string): number {
  if (message.role === "user") {
    return estimateTokens(message.content, model) + 4;
  }
  if (message.role === "tool") {
    return estimateTokens(message.content, model) + 4;
  }
  let tokens = 0;
  for (const block of message.content) {
    if (block.type === "text") {
      tokens += estimateTokens(block.text, model) + 4;
    } else if (block.type === "tool_use") {
      tokens += estimateTokens(block.name, model) + estimateTokens(JSON.stringify(block.input), model) + 4;
    } else if (block.type === "thinking") {
      tokens += estimateTokens(block.thinking, model) + 4;
    }
  }
  return tokens;
}

export function estimateConversationTokens(messages: Message[], model?: string): TokenCount {
  const byRole: Record<string, number> = {};
  let total = 0;
  for (const message of messages) {
    const msgTokens = estimateMessageTokens(message, model) + 10;
    total += msgTokens;
    byRole[message.role] = (byRole[message.role] ?? 0) + msgTokens;
  }
  return { total, byRole };
}

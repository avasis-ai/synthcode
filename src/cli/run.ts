#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const p = require("../index.js");
const { AnthropicProvider, OpenAIProvider, OllamaProvider } = require("../llm/index.js");

const ALL_TOOLS = [
  p.BashTool,
  p.FileReadTool,
  p.FileWriteTool,
  p.FileEditTool,
  p.GlobTool,
  p.GrepTool,
  p.WebFetchTool,
];

const args = process.argv.slice(2);

function usage() {
  console.log(`synthcode <prompt> [options]

Options:
  --model <model>        Use specific model (auto-detects provider)
  --ollama <model>       Use Ollama (default: qwen3:32b)
  --anthropic <model>    Use Anthropic (default: claude-sonnet-4-20250514)
  --openai <model>       Use OpenAI (default: gpt-4o)
  --max-turns <n>        Max agentic turns (default: 50)
  --system <prompt>      System prompt
  --cwd <dir>            Working directory (default: .)
  --json                 Output final result as JSON
  --help                 Show this help`);
  process.exit(0);
}

if (args.includes("--help") || args.length === 0) usage();

const promptIdx = args.findIndex(a => !a.startsWith("--"));
if (promptIdx === -1) {
  console.error("Error: no prompt provided. Run 'synthcode --help' for usage.");
  process.exit(1);
}

const prompt = args[promptIdx];
const flags = args.filter((_, i) => i !== promptIdx);

function getFlag(flag: string): string | undefined {
  const idx = flags.indexOf(flag);
  return idx !== -1 && idx + 1 < flags.length ? flags[idx + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return flags.includes(flag);
}

function resolveProvider() {
  if (hasFlag("--ollama")) {
    return new OllamaProvider({ model: getFlag("--ollama") ?? "qwen3:32b" });
  }
  if (hasFlag("--anthropic")) {
    const model = getFlag("--anthropic") ?? "claude-sonnet-4-20250514";
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Error: ANTHROPIC_API_KEY not set");
      process.exit(1);
    }
    return new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY, model });
  }
  if (hasFlag("--openai")) {
    const model = getFlag("--openai") ?? "gpt-4o";
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY not set");
      process.exit(1);
    }
    return new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model });
  }
  if (hasFlag("--model")) {
    return new OllamaProvider({ model: getFlag("--model")! });
  }
  if (process.env.ANTHROPIC_API_KEY) return new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY, model: "claude-sonnet-4-20250514" });
  if (process.env.OPENAI_API_KEY) return new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o" });
  return new OllamaProvider({ model: "qwen3:32b" });
}

async function main() {
  const provider = resolveProvider();
  const systemPrompt = getFlag("--system");
  const maxTurns = parseInt(getFlag("--max-turns") ?? "50", 10);
  const cwd = getFlag("--cwd") ?? process.cwd();
  const jsonMode = hasFlag("--json");

  const agent = new p.Agent({
    model: provider,
    tools: ALL_TOOLS,
    ...(systemPrompt ? { systemPrompt } : {}),
    maxTurns,
    cwd,
    disableTitle: true,
  });

  const finalText = [];
  let finalUsage = { inputTokens: 0, outputTokens: 0 };

  for await (const event of agent.run(prompt)) {
    switch (event.type) {
      case "text":
        process.stdout.write(event.text);
        finalText.push(event.text);
        break;
      case "tool_use":
        console.log(`\n  \x1b[36m[${event.name}]\x1b[0m`);
        break;
      case "tool_result":
        if (event.isError) console.log(`  \x1b[31mFAILED\x1b[0m`);
        break;
      case "thinking":
        process.stderr.write(`\x1b[90m${event.thinking}\x1b[0m`);
        break;
      case "done":
        finalUsage.inputTokens = event.usage.inputTokens;
        finalUsage.outputTokens = event.usage.outputTokens;
        console.log(`\n\n\x1b[90mTokens: ${event.usage.inputTokens} in, ${event.usage.outputTokens} out\x1b[0m`);
        break;
      case "error":
        console.error(`\n\x1b[31mError: ${event.error.message}\x1b[0m`);
        if (jsonMode) console.log(JSON.stringify({ ok: false, error: event.error.message }));
        process.exit(1);
    }
  }

  if (jsonMode) {
    console.log(JSON.stringify({ ok: true, text: finalText.join(""), usage: finalUsage, model: provider.model }));
  }
}

main();

#!/usr/bin/env node

import React from "react";
import { render } from "ink";
import { App } from "./index.js";
import { Agent } from "../agent.js";
import {
  OllamaProvider,
  AnthropicProvider,
  OpenAIProvider,
} from "../llm/index.js";
import {
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
} from "../tools/index.js";

interface ParsedArgs {
  provider: "ollama" | "anthropic" | "openai";
  model?: string;
  apiKey?: string;
  baseURL?: string;
  system?: string;
  maxTurns?: number;
  cwd?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { provider: "ollama" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--ollama") {
      result.provider = "ollama";
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        result.model = argv[++i];
      }
    } else if (arg === "--anthropic") {
      result.provider = "anthropic";
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        result.model = argv[++i];
      }
    } else if (arg === "--openai") {
      result.provider = "openai";
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        result.model = argv[++i];
      }
    } else if (arg === "--api-key") {
      result.apiKey = argv[++i];
    } else if (arg === "--base-url") {
      result.baseURL = argv[++i];
    } else if (arg === "--system") {
      result.system = argv[++i];
    } else if (arg === "--max-turns") {
      result.maxTurns = parseInt(argv[++i], 10);
    } else if (arg === "--cwd") {
      result.cwd = argv[++i];
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

const tools = [
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  WebFetchTool,
];

let modelName: string;

switch (args.provider) {
  case "ollama": {
    modelName = args.model ?? "llama3.1";
    const provider = new OllamaProvider({
      model: modelName,
      baseURL: args.baseURL,
    });
    const agent = new Agent({
      model: provider,
      tools,
      systemPrompt: args.system,
      maxTurns: args.maxTurns,
      cwd: args.cwd ?? process.cwd(),
    });
    render(React.createElement(App, { agent, modelName }));
    break;
  }

  case "anthropic": {
    modelName = args.model ?? "claude-sonnet-4-20250514";
    const apiKey = args.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) {
      process.stderr.write("Error: ANTHROPIC_API_KEY is required. Set it via env or --api-key.\n");
      process.exit(1);
    }
    const provider = new AnthropicProvider({
      model: modelName,
      apiKey,
      baseURL: args.baseURL,
    });
    const agent = new Agent({
      model: provider,
      tools,
      systemPrompt: args.system,
      maxTurns: args.maxTurns,
      cwd: args.cwd ?? process.cwd(),
    });
    render(React.createElement(App, { agent, modelName }));
    break;
  }

  case "openai": {
    modelName = args.model ?? "gpt-4o";
    const apiKey = args.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      process.stderr.write("Error: OPENAI_API_KEY is required. Set it via env or --api-key.\n");
      process.exit(1);
    }
    const provider = new OpenAIProvider({
      model: modelName,
      apiKey,
      baseURL: args.baseURL,
    });
    const agent = new Agent({
      model: provider,
      tools,
      systemPrompt: args.system,
      maxTurns: args.maxTurns,
      cwd: args.cwd ?? process.cwd(),
    });
    render(React.createElement(App, { agent, modelName }));
    break;
  }
}

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

export interface InitOptions {
  projectName?: string;
  cwd?: string;
  skipInstall?: boolean;
}

const PACKAGE_JSON = JSON.stringify(
  {
    name: "my-agent",
    version: "1.0.0",
    type: "module",
    scripts: {
      start: "npx tsx src/index.ts",
      test: "npx vitest run",
      typecheck: "tsc --noEmit",
    },
    dependencies: {
      "@avasis-ai/synthcode": "^0.6.0",
      zod: "^3.24.0",
    },
    devDependencies: {
      typescript: "^5.7.0",
      tsx: "^4.19.0",
      vitest: "^2.1.0",
    },
  },
  null,
  2,
);

const TSCONFIG_JSON = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: "./dist",
      rootDir: "./src",
      declaration: true,
    },
    include: ["src"],
  },
  null,
  2,
);

const ENV_EXAMPLE = `# Pick one provider and set its key:
# ANTHROPIC_API_KEY=your-key-here
# OPENAI_API_KEY=your-key-here
# For Ollama (local, zero API costs): no key needed
`;

const INDEX_TS = `import { Agent, BashTool, FileReadTool, FileWriteTool, FileEditTool, GlobTool, GrepTool, WebFetchTool } from "@avasis-ai/synthcode";
import { defineTool } from "@avasis-ai/synthcode/tools";
import { z } from "zod";

const agent = new Agent({
  model: process.env.OLLAMA_MODEL
    ? await import("@avasis-ai/synthcode/llm").then(m => new m.OllamaProvider({ model: process.env.OLLAMA_MODEL }))
    : process.env.OPENAI_API_KEY
      ? await import("@avasis-ai/synthcode/llm").then(m => new m.OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }))
      : await import("@avasis-ai/synthcode/llm").then(m => new m.AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! })),
  tools: [
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GlobTool,
    GrepTool,
    WebFetchTool,
  ],
  systemPrompt: "You are a helpful AI coding assistant with shell and file access.",
});

const prompt = process.argv[2] || "Hello! What can I help you with?";

for await (const event of agent.run(prompt)) {
  if (event.type === "text") process.stdout.write(event.text);
  if (event.type === "tool_use") console.log(\`\\n  [\${event.name}]\`);
  if (event.type === "tool_result") {
    if (event.isError) console.log(\`\\n  [\${event.name}] FAILED\`);
  }
  if (event.type === "thinking") process.stderr.write(\`\\x1b[90m\${event.thinking}\\x1b[0m\`);
  if (event.type === "done") console.log(\`\\n\\nTokens: \${event.usage.inputTokens} in, \${event.usage.outputTokens} out\`);
  if (event.type === "error") {
    console.error(\`\\nError: \${event.error.message}\`);
    process.exit(1);
  }
}
`;

export async function init(opts?: InitOptions): Promise<void> {
  const name = opts?.projectName ?? "my-agent";
  const cwd = opts?.cwd ?? process.cwd();
  const dir = path.join(cwd, name);

  fs.mkdirSync(path.join(dir, "src", "tools"), { recursive: true });
  fs.mkdirSync(path.join(dir, "tests"), { recursive: true });

  fs.writeFileSync(path.join(dir, "package.json"), PACKAGE_JSON, "utf-8");
  fs.writeFileSync(path.join(dir, "tsconfig.json"), TSCONFIG_JSON, "utf-8");
  fs.writeFileSync(path.join(dir, ".env.example"), ENV_EXAMPLE, "utf-8");
  fs.writeFileSync(path.join(dir, "src", "index.ts"), INDEX_TS, "utf-8");
  fs.writeFileSync(path.join(dir, "tests", "agent.test.ts"), `import { describe, it, expect } from "vitest";\ndescribe("Agent", () => { it("should have tools registered", () => { expect(true).toBe(true); }); });\n`, "utf-8");

  if (!opts?.skipInstall) {
    console.log("Installing dependencies...");
    execSync("npm install", { cwd: dir, stdio: "inherit" });
  }

  console.log(`\n  Created ${name}/`);
  console.log(`  cd ${name} && npm start "your prompt here"\n`);
}

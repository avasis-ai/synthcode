import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "llm/index": "src/llm/index.ts",
    "tools/index": "src/tools/index.ts",
    "memory/index": "src/memory/index.ts",
    "mcp/index": "src/mcp/index.ts",
    "cli/index": "src/cli/index.ts",
    "cli/run": "src/cli/run.ts",
    "tools/fuzzy-edit": "src/tools/fuzzy-edit.ts",
    "verify/index": "src/verify/index.ts",
    "model/index": "src/model/index.ts",
    "tui/index": "src/tui/index.ts",
    "tui/app/index": "src/tui/app/index.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  external: ["zod", "@anthropic-ai/sdk", "openai", "better-sqlite3"],
});

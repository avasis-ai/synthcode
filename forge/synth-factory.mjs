#!/usr/bin/env node
/**
 * Synth Factory — Language-agnostic OSS project builder.
 * Reads IDEA.md specs and builds real projects in any language.
 *
 * Usage:
 *   node synth-factory.mjs [filter] [--retry] [--max N]
 */

import { Agent, OllamaProvider } from "@avasis-ai/synth";
import { BashTool, FileReadTool, FileWriteTool, FileEditTool, GlobTool, GrepTool, ToolRegistry } from "@avasis-ai/synth/tools";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const PROJECTS_DIR = "/opt/oss-factory/projects";
const LOG_DIR = "/opt/oss-factory/logs";
const PROGRESS_FILE = "/opt/oss-factory/batch-progress.json";
const CTX7_KEY = "ctx7sk-f0267932-dcce-404b-b417-065adce8bb65";

mkdirSync(LOG_DIR, { recursive: true });

const MODELS = [
  { model: "qwen3-coder-next:latest", label: "79B", maxTurns: 35 },
  { model: "qwen3.5:35b", label: "35B", maxTurns: 30 },
  { model: "qwen3:32b", label: "32B", maxTurns: 25 },
  { model: "qwen3:14b", label: "14B", maxTurns: 20 },
];

function log(msg) {
  const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(join(LOG_DIR, "synth-factory.log"), line + "\n");
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
  return { completed: [], failed: [], in_progress: {}, retry: [], started_at: null };
}

function saveProgress(p) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

function getProjectDirs() {
  return readdirSync(PROJECTS_DIR)
    .filter(d => {
      const p = join(PROJECTS_DIR, d);
      return statSync(p).isDirectory() && existsSync(join(p, "IDEA.md"));
    })
    .sort();
}

function detectLanguage(idea, name) {
  const text = (idea + " " + name).toLowerCase();
  if (text.includes("rust") || text.includes("cargo") || name.endsWith("-rs")) return "rust";
  if (text.includes("go") || text.includes("golang") || name.endsWith("-go")) return "go";
  if (text.includes("typescript") || text.includes("deno") || text.includes("next.js") || text.includes("tsx")) return "typescript";
  if (text.includes("java") || text.includes("kotlin") || text.includes("jvm") || text.includes("gradle") || text.includes("maven")) return "java";
  if (text.includes("c++") || text.includes("cpp") || text.includes("cmake")) return "cpp";
  if (text.includes("ruby") || text.includes("gem") || text.includes("rails")) return "ruby";
  return "python";
}

function buildPrompt(name, lang) {
  const idea = readFileSync(join(PROJECTS_DIR, name, "IDEA.md"), "utf-8");
  const projectDir = join(PROJECTS_DIR, name);

  const langInstructions = {
    python: `Create pyproject.toml (hatchling), src/${name.replace(/-/g, "_")}/, tests/, CLI entry point.
Run: cd ${projectDir} && pip install -e ".[dev]" && python -m pytest tests/ -q`,

    typescript: `Create package.json (ESM, "type":"module"), tsconfig.json, src/index.ts, tests/*.test.ts.
Use vitest for testing. Build with tsup.
Run: cd ${projectDir} && npm install && npm test`,

    rust: `Create Cargo.toml, src/lib.rs, src/main.rs (bin), tests/integration_test.rs.
Run: cd ${projectDir} && cargo test && cargo build --release`,

    go: `Create go.mod, main package with cmd/ and internal/ dirs.
Run: cd ${projectDir} && go test ./... && go build ./...`,

    java: `Create build.gradle (or pom.xml), src/main/java/, src/test/java/.
Run: cd ${projectDir} && ./gradlew test`,

    cpp: `Create CMakeLists.txt, include/, src/, tests/.
Run: cd ${projectDir} && mkdir -p build && cd build && cmake .. && make && ctest`,

    ruby: `Create Gemfile, lib/, spec/.
Run: cd ${projectDir} && bundle install && bundle exec rspec`,
  };

  return `Build the ${lang} project "${name}" from this spec:

${idea}

LANGUAGE: ${lang.toUpperCase()}

SETUP:
${langInstructions[lang] || langInstructions.python}

RULES:
- Write REAL, FUNCTIONAL code. No stubs, no TODOs, no placeholder comments.
- Use proper type annotations for the language.
- Write a comprehensive README.md with usage examples.
- Create appropriate CI config (.github/workflows/ci.yml).
- Run tests and fix any failures before finishing.
- git init && git add -A && git commit -m "feat: initial implementation"

For library docs, use Context7:
  curl -s https://context7.com/api/v2/libs/search -H "Authorization: Bearer ${CTX7_KEY}" -d 'query=LIBRARY_NAME'`;
}

function selectModel(projectName, idx) {
  const hash = projectName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const complex = projectName.includes("swarm") || projectName.includes("benchmark") || projectName.includes("mesh") || projectName.includes("compiler");
  if (complex) return MODELS[3];
  return MODELS[(hash + idx) % MODELS.length];
}

async function buildProject(name, modelConfig) {
  const projectDir = join(PROJECTS_DIR, name);
  const idea = readFileSync(join(projectDir, "IDEA.md"), "utf-8");
  const lang = detectLanguage(idea, name);

  log(`  [${modelConfig.label}] ${name} (${lang}) -> starting...`);

  const provider = new OllamaProvider({
    model: modelConfig.model,
    baseURL: "http://localhost:11434/v1",
  });

  const agent = new Agent({
    model: provider,
    tools: [BashTool, FileReadTool, FileWriteTool, FileEditTool, GlobTool, GrepTool],
    systemPrompt: `You are an expert ${lang} developer building "${name}" in ${projectDir}.
- Write REAL functional code. No stubs, no TODOs, no placeholder comments.
- Use bash to run commands: build, test, git, etc.
- Always run tests and fix failures before finishing.
- Look up library docs with Context7 before using unfamiliar APIs.`,
    maxTurns: modelConfig.maxTurns,
    cwd: projectDir,
    context: { maxTokens: 131072, maxOutputTokens: 16384, compactThreshold: 0.8 },
    disableTitle: true,
  });

  const startTime = Date.now();

  try {
    const result = await agent.chat(buildPrompt(name, lang), {
      abortSignal: AbortSignal.timeout(1800000),
    });
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    const langChecks = {
      python: () => existsSync(join(projectDir, "pyproject.toml")),
      typescript: () => existsSync(join(projectDir, "package.json")),
      rust: () => existsSync(join(projectDir, "Cargo.toml")),
      go: () => existsSync(join(projectDir, "go.mod")),
      java: () => existsSync(join(projectDir, "build.gradle")) || existsSync(join(projectDir, "pom.xml")),
      cpp: () => existsSync(join(projectDir, "CMakeLists.txt")),
      ruby: () => existsSync(join(projectDir, "Gemfile")),
    };

    const hasConfig = (langChecks[lang] || langChecks.python)();
    const hasReadme = existsSync(join(projectDir, "README.md"));
    const hasSource = existsSync(join(projectDir, "src")) || existsSync(join(projectDir, "lib")) || existsSync(join(projectDir, "internal"));
    const verified = hasConfig && hasReadme && hasSource;

    if (verified) {
      log(`  [${modelConfig.label}] ${name} (${lang}) -> VERIFIED (${elapsed}s)`);
      return { name, success: true, lang };
    }
    log(`  [${modelConfig.label}] ${name} (${lang}) -> partial (${elapsed}s, cfg=${hasConfig} readme=${hasReadme} src=${hasSource})`);
    return { name, success: false, detail: `partial (${lang}: cfg=${hasConfig} readme=${hasReadme} src=${hasSource})` };
  } catch (err) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (err.name === "TimeoutError") return { name, success: false, detail: `timeout (${elapsed}s)` };
    return { name, success: false, detail: err.message.slice(0, 200) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const retryFailed = args.includes("--retry");
  const positional = args.filter(a => !a.startsWith("--") && !/^\d+$/.test(a));
  const filter = positional[0] || null;
  const maxIdx = args.findIndex(a => a === "--max");
  const maxProjects = maxIdx >= 0 ? parseInt(args[maxIdx + 1]) || 2 : 2;

  const progress = loadProgress();
  const allProjects = getProjectDirs();
  const doneSet = new Set(progress.completed);
  const failSet = new Set(progress.failed.map(f => typeof f === "string" ? f : f.name));

  let remaining = allProjects.filter(p => !doneSet.has(p) && (retryFailed || !failSet.has(p)));
  if (filter) remaining = remaining.filter(p => p.includes(filter));
  remaining = remaining.slice(0, maxProjects);

  log("=".repeat(50));
  log(`Synth Factory v2 | ${remaining.length} projects queued`);
  log(`  ${doneSet.size} done | ${failSet.size} failed | ${allProjects.length} total`);

  if (remaining.length === 0) { log("Nothing to do!"); return; }

  if (!progress.started_at) {
    progress.started_at = new Date().toISOString();
    saveProgress(progress);
  }

  const concurrency = Math.min(2, remaining.length);

  async function worker() {
    while (remaining.length > 0) {
      const name = remaining.shift();
      if (!name) break;
      const modelConfig = selectModel(name, allProjects.indexOf(name));
      progress.in_progress[name] = modelConfig.model;
      saveProgress(progress);

      const result = await buildProject(name, modelConfig);
      delete progress.in_progress[name];

      if (result.success) {
        progress.completed.push(name);
        progress.failed = progress.failed.filter(f => (typeof f === "string" ? f : f.name) !== name);
      } else {
        if (!progress.failed.some(f => (typeof f === "string" ? f : f.name) === name)) {
          progress.failed.push({ name, reason: result.detail });
        }
      }
      saveProgress(progress);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  log("\n" + "=".repeat(50));
  log(`DONE | ${progress.completed.length} completed | ${progress.failed.length} failed`);
  const failedNames = progress.failed.map(f => typeof f === "string" ? f : f.name);
  if (failedNames.length) log(`Failed: ${failedNames.join(", ")}`);
}

main().catch(err => { log(`FATAL: ${err.message}`); process.exit(1); });

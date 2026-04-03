#!/usr/bin/env node
/**
 * Synth Factory — OSS Factory batch runner powered by Synth + local Ollama models.
 *
 * Usage:
 *   node synth-batch-runner.mjs [filter] [max-projects]
 *
 * Replaces the OpenClaw-based batch_runner.py with Synth's Agent framework.
 */

import { Agent, OllamaProvider } from "@avasis-ai/synth";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const PROJECTS_DIR = "/opt/oss-factory/projects";
const LOG_DIR = "/opt/oss-factory/logs";
const PROGRESS_FILE = "/opt/oss-factory/batch-progress.json";
const CONTEXT7_KEY = "ctx7sk-f0267932-dcce-404b-b417-065adce8bb65";

mkdirSync(LOG_DIR, { recursive: true });

const MODELS = [
  { model: "qwen3.5:35b", label: "35B", maxTurns: 30 },
  { model: "qwen3:32b", label: "32B", maxTurns: 25 },
  { model: "qwen3:14b", label: "14B", maxTurns: 20 },
  { model: "qwen3-coder-next:latest", label: "79B", maxTurns: 35 },
];

function log(msg) {
  const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(join(LOG_DIR, "synth-batch.log"), line + "\n");
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
  }
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

function buildPrompt(name) {
  const idea = readFileSync(join(PROJECTS_DIR, name, "IDEA.md"), "utf-8");
  const pkgName = name.replace(/-/g, "_");

  return `Build the Python project "${name}" from this spec:

${idea}

Steps:
1. Create pyproject.toml (hatchling build system), src/${pkgName}/__init__.py, tests/, README.md
2. Write REAL functional code with type hints and docstrings. No stubs or TODOs.
3. Create CLI entry point in src/${pkgName}/cli.py
4. Run: cd ${join(PROJECTS_DIR, name)} && pip install -e ".[dev]" 2>&1 | tail -5
5. Run: cd ${join(PROJECTS_DIR, name)} && python -m pytest tests/ -q 2>&1 | tail -10
6. Fix any test failures before finishing
7. git init && git add -A && git commit -m "feat: initial implementation"

Context7 for docs: curl -s https://context7.com/api/v2/libs/search -H "Authorization: Bearer ${CONTEXT7_KEY}" -d 'query=LIBRARY_NAME'

IMPORTANT: All bash commands must be run from ${join(PROJECTS_DIR, name)}`;
}

function selectModel(projectName, idx) {
  const hash = projectName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const complex = projectName.includes("swarm") || projectName.includes("benchmark") || projectName.includes("mesh");
  if (complex) return MODELS[3];
  return MODELS[(hash + idx) % MODELS.length];
}

async function buildProject(name, modelConfig) {
  const projectDir = join(PROJECTS_DIR, name);

  log(`  [${modelConfig.label}] ${name} -> starting...`);

  const provider = new OllamaProvider({
    model: modelConfig.model,
    baseURL: "http://localhost:11434/v1",
  });

  const agent = new Agent({
    model: provider,
    systemPrompt: `You are an expert Python developer building "${name}" in ${projectDir}.
- Write REAL functional code with type hints. No stubs, no TODOs.
- Use bash to run: pip install, pytest, git init, etc.
- Always run tests and fix failures before finishing.
- Use Context7 to look up library docs before using them.`,
    maxTurns: modelConfig.maxTurns,
    cwd: projectDir,
    context: { maxTokens: 131072, maxOutputTokens: 16384, compactThreshold: 0.8 },
  });

  const startTime = Date.now();

  try {
    const result = await agent.chat(buildPrompt(name), {
      abortSignal: AbortSignal.timeout(1800000),
    });
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const verified = existsSync(join(projectDir, "pyproject.toml")) &&
      existsSync(join(projectDir, "src")) &&
      existsSync(join(projectDir, "README.md"));

    if (verified) {
      log(`  [${modelConfig.label}] ${name} -> VERIFIED (${elapsed}s)`);
      return { name, success: true };
    }
    log(`  [${modelConfig.label}] ${name} -> partial (${elapsed}s)`);
    return { name, success: false, detail: "missing required files" };
  } catch (err) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (err.name === "TimeoutError") {
      return { name, success: false, detail: `timeout (${elapsed}s)` };
    }
    return { name, success: false, detail: err.message.slice(0, 200) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const retryFailed = args.includes("--retry");
  const positional = args.filter(a => !a.startsWith("--") && !/^\d+$/.test(a));
  const filter = positional[0] || null;
  const maxProjects = parseInt(args.find(a => /^\d+$/.test(a))) || 2;

  const progress = loadProgress();
  const allProjects = getProjectDirs();
  const doneSet = new Set(progress.completed);
  const failSet = new Set(progress.failed.map(f => typeof f === "string" ? f : f.name));

  let remaining = allProjects.filter(p => !doneSet.has(p) && (retryFailed || !failSet.has(p)));
  if (filter) remaining = remaining.filter(p => p.includes(filter));
  remaining = remaining.slice(0, maxProjects);

  log("=".repeat(50));
  log(`Synth Factory v1 | ${remaining.length} projects queued`);
  log(`  ${doneSet.size} done | ${failSet.size} failed | ${allProjects.length} total`);

  if (remaining.length === 0) {
    log("Nothing to do!");
    return;
  }

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
        progress.failed.push({ name, reason: result.detail });
      }
      saveProgress(progress);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  log("\n" + "=".repeat(50));
  log(`DONE | ${progress.completed.length} completed | ${progress.failed.length} failed`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});

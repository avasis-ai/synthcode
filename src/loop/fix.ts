import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface FixLoopConfig {
  cwd: string;
  maxIterations: number;
  buildCommand?: string;
  testCommand?: string;
  lintCommand?: string;
  typecheckCommand?: string;
  autoDetect: boolean;
}

export interface VerificationResult {
  success: boolean;
  stage: "build" | "test" | "lint" | "typecheck";
  output: string;
  errors: ParsedError[];
  durationMs: number;
}

export interface ParsedError {
  filePath: string;
  line: number;
  column?: number;
  message: string;
  severity: "error" | "warning";
  source: "tsc" | "eslint" | "vitest" | "jest" | "cargo" | "go" | "generic";
}

export interface FixLoopResult {
  iterations: number;
  totalDurationMs: number;
  finalState: "success" | "failed" | "timeout" | "aborted";
  history: FixIteration[];
}

export interface FixIteration {
  iteration: number;
  edits: string[];
  verification: VerificationResult[];
  errorsFound: number;
  errorsFixed: number;
}

export type FixLoopEvent =
  | { type: "editing"; iteration: number; edits: string[] }
  | { type: "verifying"; iteration: number; stage: string }
  | { type: "errors_found"; iteration: number; errors: ParsedError[] }
  | { type: "iteration_complete"; iteration: number; fixed: number; remaining: number }
  | { type: "done"; result: FixLoopResult };

const COMMAND_TIMEOUT_MS = 60_000;

export class FixLoop {
  private commands: { build?: string; test?: string; lint?: string; typecheck?: string } = {};

  constructor(private config: FixLoopConfig) {
    if (config.autoDetect) {
      this.commands = detectCommands(config.cwd);
    }
    this.commands = {
      build: config.buildCommand ?? this.commands.build,
      test: config.testCommand ?? this.commands.test,
      lint: config.lintCommand ?? this.commands.lint,
      typecheck: config.typecheckCommand ?? this.commands.typecheck,
    };
  }

  async *run(
    initialEdits: string[],
    applyEdit: (description: string) => Promise<void>,
    verify?: () => Promise<VerificationResult[]>,
  ): AsyncGenerator<FixLoopEvent> {
    const startTime = Date.now();
    const history: FixIteration[] = [];
    let previousErrors: ParsedError[] = [];

    for (let i = 0; i < this.config.maxIterations; i++) {
      const edits: string[] = i === 0 ? [...initialEdits] : [];

      yield { type: "editing", iteration: i + 1, edits };

      if (i === 0) {
        for (const edit of initialEdits) {
          await applyEdit(edit);
        }
      }

      const commandList = this.getCommandList();
      for (const cmd of commandList) {
        yield { type: "verifying", iteration: i + 1, stage: this.detectStage(cmd) };
      }

      let results: VerificationResult[];
      if (verify) {
        results = await verify();
      } else {
        results = this.runVerification(this.config.cwd, commandList);
      }

      const allErrors = results.flatMap((r) => r.errors);
      const errorsFixed = previousErrors.length > 0
        ? previousErrors.filter(
            (prev) => !allErrors.some(
              (curr) =>
                curr.filePath === prev.filePath &&
                curr.line === prev.line &&
                curr.message === prev.message,
            ),
          ).length
        : 0;

      const iteration: FixIteration = {
        iteration: i + 1,
        edits,
        verification: results,
        errorsFound: allErrors.length,
        errorsFixed,
      };
      history.push(iteration);

      yield {
        type: "iteration_complete",
        iteration: i + 1,
        fixed: errorsFixed,
        remaining: allErrors.length,
      };

      if (allErrors.length === 0) {
        const result: FixLoopResult = {
          iterations: i + 1,
          totalDurationMs: Date.now() - startTime,
          finalState: "success",
          history,
        };
        yield { type: "done", result };
        return;
      }

      previousErrors = allErrors;
      yield { type: "errors_found", iteration: i + 1, errors: allErrors };

      if (i < this.config.maxIterations - 1) {
        const formatted = formatErrorsForAgent(allErrors);
        await applyEdit(formatted);
      }
    }

    const result: FixLoopResult = {
      iterations: this.config.maxIterations,
      totalDurationMs: Date.now() - startTime,
      finalState: "timeout",
      history,
    };
    yield { type: "done", result };
  }

  private getCommandList(): string[] {
    const cmds: string[] = [];
    if (this.commands.build) cmds.push(this.commands.build);
    if (this.commands.typecheck) cmds.push(this.commands.typecheck);
    if (this.commands.lint) cmds.push(this.commands.lint);
    if (this.commands.test) cmds.push(this.commands.test);
    return cmds;
  }

  runVerification(cwd: string, commands: string[]): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const cmd of commands) {
      const stage = this.detectStage(cmd);
      const start = Date.now();
      let output = "";
      let success = false;

      try {
        output = execSync(cmd, {
          cwd,
          timeout: COMMAND_TIMEOUT_MS,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).toString();
        success = true;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "stdout" in err) {
          const e = err as { stdout?: Buffer | string; stderr?: Buffer | string };
          output = [
            typeof e.stdout === "string" ? e.stdout : e.stdout?.toString("utf-8") ?? "",
            typeof e.stderr === "string" ? e.stderr : e.stderr?.toString("utf-8") ?? "",
          ].join("\n");
        } else if (err instanceof Error) {
          output = err.message;
        } else {
          output = String(err);
        }
        success = false;
      }

      const source = this.detectSource(cmd);
      const errors = parseErrors(output, source);

      results.push({
        success: success && errors.length === 0,
        stage,
        output,
        errors,
        durationMs: Date.now() - start,
      });
    }

    return results;
  }

  private detectStage(cmd: string): "build" | "test" | "lint" | "typecheck" {
    if (cmd.includes("test") || cmd.includes("vitest") || cmd.includes("jest") || cmd.includes("pytest")) return "test";
    if (cmd.includes("lint") || cmd.includes("eslint") || cmd.includes("clippy") || cmd.includes("ruff") || cmd.includes("biome")) return "lint";
    if (cmd.includes("tsc") || cmd.includes("--noEmit") || cmd.includes("typecheck")) return "typecheck";
    return "build";
  }

  private detectSource(cmd: string): "tsc" | "eslint" | "vitest" | "jest" | "cargo" | "go" | "generic" {
    if (cmd.includes("tsc")) return "tsc";
    if (cmd.includes("eslint")) return "eslint";
    if (cmd.includes("vitest")) return "vitest";
    if (cmd.includes("jest")) return "jest";
    if (cmd.includes("cargo")) return "cargo";
    if (cmd.includes("go ")) return "go";
    return "generic";
  }
}

export function detectCommands(cwd: string): {
  build?: string;
  test?: string;
  lint?: string;
  typecheck?: string;
} {
  const result: { build?: string; test?: string; lint?: string; typecheck?: string } = {};

  if (existsSync(join(cwd, "package.json"))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, "package.json"), "utf-8"));
      const scripts = pkg.scripts ?? {};

      if (scripts.build) result.build = "npm run build";
      if (scripts.test) result.test = "npm test";
      if (scripts.typecheck) {
        result.typecheck = "npm run typecheck";
      } else if (existsSync(join(cwd, "tsconfig.json"))) {
        result.typecheck = "npx tsc --noEmit";
      }

      if (scripts.lint) {
        result.lint = "npm run lint";
      } else if (
        existsSync(join(cwd, ".eslintrc")) ||
        existsSync(join(cwd, ".eslintrc.js")) ||
        existsSync(join(cwd, ".eslintrc.json")) ||
        existsSync(join(cwd, "eslint.config.js")) ||
        existsSync(join(cwd, "eslint.config.mjs"))
      ) {
        result.lint = "npx eslint .";
      } else if (existsSync(join(cwd, "biome.json"))) {
        result.lint = "npx biome check .";
      }

      if (!result.test) {
        const devDeps = { ...pkg.devDependencies, ...pkg.dependencies };
        if (devDeps.vitest) result.test = "npx vitest run";
        else if (devDeps.jest) result.test = "npx jest";
      }
    } catch {
      // ignore parse errors
    }
  }

  if (existsSync(join(cwd, "Cargo.toml"))) {
    result.build = "cargo build";
    result.test = "cargo test";
    result.lint = "cargo clippy";
  }

  if (existsSync(join(cwd, "go.mod"))) {
    result.build = "go build ./...";
    result.test = "go test ./...";
    try {
      execSync("which golangci-lint", { encoding: "utf-8", timeout: 5000 });
      result.lint = "golangci-lint run";
    } catch {
      // golangci-lint not available
    }
  }

  if (existsSync(join(cwd, "Makefile"))) {
    try {
      const makefile = readFileSync(join(cwd, "Makefile"), "utf-8");
      if (!result.build && /^\s*build\s*:/m.test(makefile)) result.build = "make build";
      if (!result.test && /^\s*test\s*:/m.test(makefile)) result.test = "make test";
      if (!result.lint && /^\s*lint\s*:/m.test(makefile)) result.lint = "make lint";
    } catch {
      // ignore
    }
  }

  if (
    existsSync(join(cwd, "pyproject.toml")) ||
    existsSync(join(cwd, "setup.py")) ||
    existsSync(join(cwd, "setup.cfg"))
  ) {
    if (!result.test) {
      try {
        execSync("which pytest", { encoding: "utf-8", timeout: 5000 });
        result.test = "pytest";
      } catch {
        result.test = "python -m unittest discover";
      }
    }
    if (!result.lint) {
      try {
        execSync("which ruff", { encoding: "utf-8", timeout: 5000 });
        result.lint = "ruff check .";
      } catch {
        try {
          execSync("which pylint", { encoding: "utf-8", timeout: 5000 });
          result.lint = "pylint src";
        } catch {
          // no linter
        }
      }
    }
  }

  return result;
}

export function parseErrors(output: string, source: string): ParsedError[] {
  const parsers: Record<string, (out: string) => ParsedError[]> = {
    tsc: parseTypeScriptErrors,
    eslint: parseESLintErrors,
    vitest: parseVitestJestErrors,
    jest: parseVitestJestErrors,
    cargo: parseCargoErrors,
    go: parseGoErrors,
  };

  const parser = parsers[source] ?? parseGenericErrors;
  return parser(output);
}

function parseTypeScriptErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const regex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    errors.push({
      filePath: match[1],
      line: Number.parseInt(match[2], 10),
      column: Number.parseInt(match[3], 10),
      message: `${match[5]}: ${match[6]}`,
      severity: match[4] as "error" | "warning",
      source: "tsc",
    });
  }

  return errors;
}

function parseESLintErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const regex = /^(.+?):(\d+):(\d+):\s+(error|warning)\s+(.+?)(?:\s+\[([^\]]+)\])?\s*$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    errors.push({
      filePath: match[1],
      line: Number.parseInt(match[2], 10),
      column: Number.parseInt(match[3], 10),
      message: match[5] + (match[6] ? ` [${match[6]}]` : ""),
      severity: match[4] as "error" | "warning",
      source: "eslint",
    });
  }

  return errors;
}

function parseVitestJestErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const failBlockRegex = /FAIL\s+(.+)/g;
  let match: RegExpExecArray | null;

  while ((match = failBlockRegex.exec(output)) !== null) {
    const filePath = match[1].trim();
    const lineMatch = output.match(
      new RegExp(`(?:at\\s+.*?\\s+)?\\(?${escapeRegex(filePath)}:(\\d+)(?::(\\d+))?\\)?`),
    );

    const errorMsgMatch = output.match(
      /(?:Error|AssertionError|expect.*?failed):\s*(.+?)(?:\n|$)/,
    );

    errors.push({
      filePath,
      line: lineMatch ? Number.parseInt(lineMatch[1], 10) : 0,
      column: lineMatch?.[2] ? Number.parseInt(lineMatch[2], 10) : undefined,
      message: errorMsgMatch?.[1] ?? "Test failed",
      severity: "error",
      source: output.includes("vitest") ? "vitest" : "jest",
    });
  }

  return errors;
}

function parseCargoErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const regex = /error(?:\[E\d+\])?:\s+(.+?)\n\s*-->\s+(.+?):(\d+):(\d+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    errors.push({
      filePath: match[2],
      line: Number.parseInt(match[3], 10),
      column: Number.parseInt(match[4], 10),
      message: match[1],
      severity: "error",
      source: "cargo",
    });
  }

  const warnRegex = /warning:\s+(.+?)\n\s*-->\s+(.+?):(\d+):(\d+)/g;
  while ((match = warnRegex.exec(output)) !== null) {
    errors.push({
      filePath: match[2],
      line: Number.parseInt(match[3], 10),
      column: Number.parseInt(match[4], 10),
      message: match[1],
      severity: "warning",
      source: "cargo",
    });
  }

  return errors;
}

function parseGoErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const regex = /^(.+?):(\d+):(\d+):\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    const msg = match[4].trim();
    const severity: "error" | "warning" = msg.startsWith("warning") ? "warning" : "error";
    errors.push({
      filePath: match[1],
      line: Number.parseInt(match[2], 10),
      column: Number.parseInt(match[3], 10),
      message: msg,
      severity,
      source: "go",
    });
  }

  return errors;
}

function parseGenericErrors(output: string): ParsedError[] {
  const errors: ParsedError[] = [];
  const regex = /^(.+?):(\d+)(?::(\d+))?:\s+(error|warning)?:?\s*(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    const msg = match[5] || match[4] || "";
    if (!msg.trim()) continue;
    errors.push({
      filePath: match[1],
      line: Number.parseInt(match[2], 10),
      column: match[3] ? Number.parseInt(match[3], 10) : undefined,
      message: msg.trim(),
      severity: match[4] === "warning" ? "warning" : "error",
      source: "generic",
    });
  }

  return errors;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatErrorsForAgent(errors: ParsedError[]): string {
  if (errors.length === 0) return "No errors found.";

  const lines = [`Build/Test failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:\n`];

  for (let i = 0; i < errors.length; i++) {
    const e = errors[i];
    const loc = e.column
      ? `${e.filePath}:${e.line}:${e.column}`
      : `${e.filePath}:${e.line}`;
    const sev = e.severity === "warning" ? "warning" : "error";
    lines.push(`${i + 1}. ${loc} - ${sev}: ${e.message}`);
  }

  return lines.join("\n");
}

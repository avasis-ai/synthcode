import type { FastPathResult, Verdict } from "./types.js";
import type { ToolOperation } from "./types.js";
import { DANGEROUS_PATTERNS, PATH_TRAVERSAL, SECRET_PATTERNS, DESTRUCTIVE_COMMANDS } from "./patterns.js";

export function runFastPath(operation: ToolOperation, turnCount: number, previousCalls: Array<{ name: string; input: Record<string, unknown> }>): FastPathResult {
  const start = performance.now();
  const checks: FastPathResult["checks"] = [];

  checks.push(checkDangerousCommand(operation));
  checks.push(checkPathTraversal(operation));
  checks.push(checkSecretExposure(operation));
  checks.push(checkDestructiveSQL(operation));
  checks.push(checkRepetitiveCall(operation, previousCalls));
  checks.push(checkWriteBinary(operation));

  const criticals = checks.filter(c => !c.passed && c.severity === "critical");
  const warnings = checks.filter(c => !c.passed && c.severity === "warning");

  let verdict: Verdict;
  if (criticals.length > 0) {
    verdict = "block";
  } else if (warnings.length > 0) {
    verdict = "warn";
  } else {
    verdict = "pass";
  }

  const latencyUs = (performance.now() - start) * 1000;

  return { verdict, checks, latencyUs };
}

function checkDangerousCommand(op: ToolOperation): FastPathResult["checks"][0] {
  if (op.safetyClass !== "execute") {
    return { rule: "dangerous_command", passed: true, severity: "info", message: "Not a shell command" };
  }
  const command = String(op.input.command ?? op.input.cmd ?? "");
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return { rule: "dangerous_command", passed: false, severity: "critical", message: `Dangerous command: ${pattern.source}` };
    }
  }
  return { rule: "dangerous_command", passed: true, severity: "info", message: "Clean" };
}

function checkPathTraversal(op: ToolOperation): FastPathResult["checks"][0] {
  const paths = [String(op.input.path ?? ""), String(op.input.file_path ?? ""), String(op.input.filePath ?? "")];
  for (const p of paths) {
    for (const pattern of PATH_TRAVERSAL) {
      if (pattern.test(p)) {
        return { rule: "path_traversal", passed: false, severity: "critical", message: `Path traversal: ${p}` };
      }
    }
  }
  return { rule: "path_traversal", passed: true, severity: "info", message: "Clean" };
}

function checkSecretExposure(op: ToolOperation): FastPathResult["checks"][0] {
  const serialized = JSON.stringify(op.input);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(serialized)) {
      return { rule: "secret_exposure", passed: false, severity: "critical", message: "Secret detected in tool input" };
    }
  }
  return { rule: "secret_exposure", passed: true, severity: "info", message: "Clean" };
}

function checkDestructiveSQL(op: ToolOperation): FastPathResult["checks"][0] {
  if (op.safetyClass !== "execute") {
    return { rule: "destructive_sql", passed: true, severity: "info", message: "N/A" };
  }
  const command = String(op.input.command ?? "").toUpperCase();
  for (const pattern of DESTRUCTIVE_COMMANDS) {
    if (command.includes(pattern)) {
      return { rule: "destructive_sql", passed: false, severity: "critical", message: `Destructive SQL: ${pattern}` };
    }
  }
  return { rule: "destructive_sql", passed: true, severity: "info", message: "Clean" };
}

function checkRepetitiveCall(op: ToolOperation, previousCalls: Array<{ name: string; input: Record<string, unknown> }>): FastPathResult["checks"][0] {
  const recent = previousCalls.slice(-5);
  let identicalCount = 0;
  for (const prev of recent) {
    if (prev.name === op.name && JSON.stringify(prev.input) === JSON.stringify(op.input)) {
      identicalCount++;
    }
  }
  if (identicalCount >= 3) {
    return { rule: "repetitive_call", passed: false, severity: "warning", message: `${op.name} called ${identicalCount + 1}x identically` };
  }
  return { rule: "repetitive_call", passed: true, severity: "info", message: "Clean" };
}

function checkWriteBinary(op: ToolOperation): FastPathResult["checks"][0] {
  if (op.safetyClass !== "write") {
    return { rule: "write_binary", passed: true, severity: "info", message: "N/A" };
  }
  const content = String(op.input.content ?? "");
  const nonPrintable = content.split("").filter(c => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 10 && code !== 13 && code !== 9;
  });
  if (nonPrintable.length > content.length * 0.1) {
    return { rule: "write_binary", passed: false, severity: "warning", message: "Binary content detected" };
  }
  return { rule: "write_binary", passed: true, severity: "info", message: "Text content" };
}

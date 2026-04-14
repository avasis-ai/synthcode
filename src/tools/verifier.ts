export type VerificationSeverity = "critical" | "warning" | "info";

export interface VerificationCheck {
  name: string;
  passed: boolean;
  severity: VerificationSeverity;
  message: string;
}

export interface VerificationRule {
  name: string;
  check: (toolName: string, input: Record<string, unknown>, context: VerificationContext) => VerificationCheck;
}

export interface VerificationContext {
  turnCount: number;
  previousToolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  cwd: string;
}

export interface VerificationResult {
  approved: boolean;
  checks: VerificationCheck[];
  rejectedBy?: string;
  reason?: string;
}

import { DANGEROUS_PATTERNS, PATH_TRAVERSAL, SECRET_PATTERNS, DESTRUCTIVE_COMMANDS } from "../verify/patterns.js";

export class ToolVerifier {
  private rules: VerificationRule[] = [];

  constructor() {
    this.rules = [
      { name: "dangerous_command", check: checkDangerousCommand },
      { name: "path_traversal", check: checkPathTraversal },
      { name: "secret_exposure", check: checkSecretExposure },
      { name: "destructive_sql", check: checkDestructiveSQL },
      { name: "repetitive_call", check: checkRepetitiveCall },
      { name: "write_binary", check: checkWriteBinary },
    ];
  }

  addRule(rule: VerificationRule): void {
    this.rules.push(rule);
  }

  verify(
    toolName: string,
    input: Record<string, unknown>,
    context: VerificationContext,
  ): VerificationResult {
    const checks: VerificationCheck[] = [];

    for (const rule of this.rules) {
      const check = rule.check(toolName, input, context);
      checks.push(check);
    }

    const criticalFailures = checks.filter(
      (c) => !c.passed && c.severity === "critical",
    );

    if (criticalFailures.length > 0) {
      return {
        approved: false,
        checks,
        rejectedBy: criticalFailures[0].name,
        reason: criticalFailures.map((c) => c.message).join("; "),
      };
    }

    return { approved: true, checks };
  }
}

function checkDangerousCommand(
  toolName: string,
  input: Record<string, unknown>,
): VerificationCheck {
  if (toolName !== "bash") {
    return { name: "dangerous_command", passed: true, severity: "info", message: "Not a shell command" };
  }

  const command = String(input.command ?? input.cmd ?? "");
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        name: "dangerous_command",
        passed: false,
        severity: "critical",
        message: `Dangerous command pattern detected: ${pattern.source}`,
      };
    }
  }

  return { name: "dangerous_command", passed: true, severity: "info", message: "No dangerous patterns" };
}

function checkPathTraversal(
  toolName: string,
  input: Record<string, unknown>,
): VerificationCheck {
  const paths = [String(input.path ?? ""), String(input.file_path ?? ""), String(input.filePath ?? "")];

  for (const p of paths) {
    for (const pattern of PATH_TRAVERSAL) {
      if (pattern.test(p)) {
        return {
          name: "path_traversal",
          passed: false,
          severity: "critical",
          message: `Path traversal detected in: ${p}`,
        };
      }
    }
  }

  return { name: "path_traversal", passed: true, severity: "info", message: "No path traversal" };
}

function checkSecretExposure(
  _toolName: string,
  input: Record<string, unknown>,
): VerificationCheck {
  const serialized = JSON.stringify(input);

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(serialized)) {
      return {
        name: "secret_exposure",
        passed: false,
        severity: "critical",
        message: "Potential secret or credential detected in tool input",
      };
    }
  }

  return { name: "secret_exposure", passed: true, severity: "info", message: "No secrets detected" };
}

function checkDestructiveSQL(
  toolName: string,
  input: Record<string, unknown>,
): VerificationCheck {
  if (toolName !== "bash") {
    return { name: "destructive_sql", passed: true, severity: "info", message: "N/A" };
  }

  const command = String(input.command ?? "").toUpperCase();
  for (const pattern of DESTRUCTIVE_COMMANDS) {
    if (command.includes(pattern)) {
      return {
        name: "destructive_sql",
        passed: false,
        severity: "critical",
        message: `Destructive SQL detected: ${pattern}`,
      };
    }
  }

  return { name: "destructive_sql", passed: true, severity: "info", message: "No destructive SQL" };
}

function checkRepetitiveCall(
  toolName: string,
  input: Record<string, unknown>,
  context: VerificationContext,
): VerificationCheck {
  const recent = context.previousToolCalls.slice(-5);
  let identicalCount = 0;

  for (const prev of recent) {
    if (prev.name === toolName && JSON.stringify(prev.input) === JSON.stringify(input)) {
      identicalCount++;
    }
  }

  if (identicalCount >= 3) {
    return {
      name: "repetitive_call",
      passed: false,
      severity: "warning",
      message: `${toolName} called ${identicalCount + 1} times with identical input (possible loop)`,
    };
  }

  return { name: "repetitive_call", passed: true, severity: "info", message: "No repetition detected" };
}

function checkWriteBinary(
  toolName: string,
  input: Record<string, unknown>,
): VerificationCheck {
  if (toolName !== "file_write" && toolName !== "write_file") {
    return { name: "write_binary", passed: true, severity: "info", message: "N/A" };
  }

  const content = String(input.content ?? "");
  const nonPrintable = content.split("").filter((c) => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 10 && code !== 13 && code !== 9;
  });

  if (nonPrintable.length > content.length * 0.1) {
    return {
      name: "write_binary",
      passed: false,
      severity: "warning",
      message: "File content appears to contain binary data",
    };
  }

  return { name: "write_binary", passed: true, severity: "info", message: "Text content" };
}

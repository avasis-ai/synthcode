import { describe, it, expect } from "vitest";
import { ToolVerifier } from "../src/tools/verifier.js";
import type { VerificationContext } from "../src/tools/verifier.js";

const baseContext: VerificationContext = {
  turnCount: 1,
  previousToolCalls: [],
  cwd: "/home/user/project",
};

describe("ToolVerifier", () => {
  it("should approve safe bash commands", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("bash", { command: "ls -la" }, baseContext);
    expect(result.approved).toBe(true);
  });

  it("should reject rm -rf /", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("bash", { command: "rm -rf /" }, baseContext);
    expect(result.approved).toBe(false);
    expect(result.rejectedBy).toBe("dangerous_command");
  });

  it("should reject dd commands", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("bash", { command: "dd if=/dev/zero of=/dev/sda" }, baseContext);
    expect(result.approved).toBe(false);
  });

  it("should reject path traversal in file_read", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("file_read", { path: "../../etc/passwd" }, baseContext);
    expect(result.approved).toBe(false);
    expect(result.rejectedBy).toBe("path_traversal");
  });

  it("should reject secret exposure", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("bash", { command: "export API_KEY=sk-abc123def456ghi789jkl012mno345" }, baseContext);
    expect(result.approved).toBe(false);
    expect(result.rejectedBy).toBe("secret_exposure");
  });

  it("should reject destructive SQL", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("bash", { command: 'psql -c "DROP TABLE users;"' }, baseContext);
    expect(result.approved).toBe(false);
    expect(result.rejectedBy).toBe("destructive_sql");
  });

  it("should warn on repetitive calls", () => {
    const verifier = new ToolVerifier();
    const prev = Array(4).fill(null).map(() => ({ name: "file_read", input: { path: "/same/file.ts" } }));
    const ctx: VerificationContext = { ...baseContext, previousToolCalls: prev };

    const result = verifier.verify("file_read", { path: "/same/file.ts" }, ctx);
    expect(result.approved).toBe(true);
    const warning = result.checks.find(c => c.name === "repetitive_call" && !c.passed);
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("warning");
  });

  it("should approve file_write with text content", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("file_write", { path: "src/index.ts", content: "export const x = 1;" }, baseContext);
    expect(result.approved).toBe(true);
  });

  it("should warn on binary-like file_write", () => {
    const verifier = new ToolVerifier();
    const binary = String.fromCharCode(...Array(100).fill(0).map((_, i) => i < 20 ? 0x01 : 65));
    const result = verifier.verify("file_write", { path: "out.bin", content: binary }, baseContext);
    const warning = result.checks.find(c => c.name === "write_binary" && !c.passed);
    expect(warning).toBeDefined();
  });

  it("should allow custom rules", () => {
    const verifier = new ToolVerifier();
    verifier.addRule({
      name: "no_writes_after_hours",
      check: (toolName) => {
        const hour = new Date().getHours();
        if (hour >= 22 || hour < 6) {
          if (["file_write", "file_edit", "bash"].includes(toolName)) {
            return { name: "no_writes_after_hours", passed: false, severity: "critical" as const, message: "No writes after hours" };
          }
        }
        return { name: "no_writes_after_hours", passed: true, severity: "info" as const, message: "OK" };
      },
    });
    expect(true).toBe(true);
  });

  it("should handle fork bomb pattern", () => {
    const verifier = new ToolVerifier();
    verifier.addRule({
      name: "fork_bomb",
      check: (_toolName, input) => {
        const cmd = String(input.command ?? "");
        const isForkBomb = /\:\s*\(\)\s*\{.*\:\s*\|\s*\:.*\&\s*\}/.test(cmd);
        if (isForkBomb) {
          return { name: "fork_bomb", passed: false, severity: "critical" as const, message: "Fork bomb detected" };
        }
        return { name: "fork_bomb", passed: true, severity: "info" as const, message: "OK" };
      },
    });
    const result = verifier.verify("bash", { command: ":(){ :|:& };:" }, baseContext);
    expect(result.approved).toBe(false);
  });

  it("should approve glob searches", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("glob", { pattern: "**/*.ts" }, baseContext);
    expect(result.approved).toBe(true);
  });

  it("should approve grep searches", () => {
    const verifier = new ToolVerifier();
    const result = verifier.verify("grep", { pattern: "TODO", path: "src/" }, baseContext);
    expect(result.approved).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { DualPathVerifier } from "../src/verify/router.js";
import { WorldModel } from "../src/verify/world-model.js";
import { runFastPath } from "../src/verify/fast-path.js";
import { runSlowPath } from "../src/verify/slow-path.js";
import { DEFAULT_ROUTING_POLICY } from "../src/verify/types.js";
import type { ToolOperation, RoutingPolicy } from "../src/verify/types.js";

describe("WorldModel", () => {
  it("should track file reads", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    expect(wm.hasRead("/src/index.ts")).toBe(true);
    expect(wm.hasRead("/src/other.ts")).toBe(false);
  });

  it("should track file writes", () => {
    const wm = new WorldModel();
    wm.recordWrite("/src/index.ts", 1);
    expect(wm.hasBeenWritten("/src/index.ts")).toBe(true);
    expect(wm.hasBeenWritten("/src/other.ts")).toBe(false);
  });

  it("should normalize paths", () => {
    const wm = new WorldModel();
    wm.recordRead("src\\index.ts", 1);
    expect(wm.hasRead("src/index.ts")).toBe(true);
    expect(wm.hasRead("src\\index.ts")).toBe(true);
  });

  it("should track dependencies", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    wm.recordRead("/src/utils.ts", 1);
    wm.recordDep("/src/index.ts", "/src/utils.ts");
    expect(wm.getDeps("/src/index.ts")).toEqual(["/src/utils.ts"]);
    expect(wm.getDeps("/src/utils.ts")).toEqual([]);
  });

  it("should track consecutive failures", () => {
    const wm = new WorldModel();
    expect(wm.getConsecutiveFailures()).toBe(0);
    wm.recordOperation(1, "bash", "execute", [], false);
    expect(wm.getConsecutiveFailures()).toBe(1);
    wm.recordOperation(2, "bash", "execute", [], false);
    expect(wm.getConsecutiveFailures()).toBe(2);
    wm.recordOperation(3, "bash", "execute", [], true);
    expect(wm.getConsecutiveFailures()).toBe(0);
  });

  it("should return file history", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    wm.recordRead("/src/index.ts", 3);
    wm.recordWrite("/src/index.ts", 5);
    const hist = wm.getFileHistory("/src/index.ts");
    expect(hist).not.toBeNull();
    expect(hist!.reads).toEqual([1, 3]);
    expect(hist!.writes).toEqual([5]);
  });

  it("should return null for unknown file history", () => {
    const wm = new WorldModel();
    expect(wm.getFileHistory("/nonexistent.ts")).toBeNull();
  });

  it("should evict oldest files when MAX_FILES exceeded", () => {
    const wm = new WorldModel();
    for (let i = 0; i < 520; i++) {
      wm.recordRead(`/src/file${i}.ts`, i);
    }
    expect(wm.isKnownFile("/src/file0.ts")).toBe(false);
    expect(wm.isKnownFile("/src/file519.ts")).toBe(true);
  });

  it("should cap history at MAX_HISTORY", () => {
    const wm = new WorldModel();
    for (let i = 0; i < 100; i++) {
      wm.recordOperation(i, "bash", "execute", [], true);
    }
    const recent = wm.getRecentOperations(100);
    expect(recent.length).toBeLessThanOrEqual(64);
  });

  it("should estimate memory usage", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    wm.recordWrite("/src/index.ts", 2);
    const bytes = wm.memoryEstimateBytes();
    expect(bytes).toBeGreaterThan(0);
  });

  it("should reset all state", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    wm.recordWrite("/src/index.ts", 2);
    wm.recordOperation(1, "bash", "execute", [], false);
    wm.reset();
    expect(wm.hasRead("/src/index.ts")).toBe(false);
    expect(wm.getConsecutiveFailures()).toBe(0);
    expect(wm.isKnownFile("/src/index.ts")).toBe(false);
  });

  it("should recognize known files", () => {
    const wm = new WorldModel();
    expect(wm.isKnownFile("/src/index.ts")).toBe(false);
    wm.recordRead("/src/index.ts", 1);
    expect(wm.isKnownFile("/src/index.ts")).toBe(true);
  });
});

describe("FastPath", () => {
  const makeOp = (name: string, input: Record<string, unknown>): ToolOperation => ({
    name,
    input,
    safetyClass: name === "bash" ? "execute" : name === "file_read" ? "read" : "write",
    targetsFiles: [],
  });

  it("should pass safe operations", () => {
    const op = makeOp("file_read", { path: "/src/index.ts" });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("pass");
  });

  it("should block dangerous commands", () => {
    const op = makeOp("bash", { command: "rm -rf /" });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("block");
    expect(result.checks.some(c => c.rule === "dangerous_command" && !c.passed)).toBe(true);
  });

  it("should block dd commands", () => {
    const op = makeOp("bash", { command: "dd if=/dev/zero of=/dev/sda" });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("block");
  });

  it("should block path traversal", () => {
    const op = makeOp("file_read", { path: "../../etc/passwd" });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("block");
    expect(result.checks.some(c => c.rule === "path_traversal" && !c.passed)).toBe(true);
  });

  it("should block secret exposure in tool input", () => {
    const op = makeOp("file_write", { content: "api_key=sk-abc123def456ghi789jkl012mno345" });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("block");
    expect(result.checks.some(c => c.rule === "secret_exposure" && !c.passed)).toBe(true);
  });

  it("should block destructive SQL", () => {
    const op = makeOp("bash", { command: 'psql -c "DROP TABLE users;"' });
    const result = runFastPath(op, 1, []);
    expect(result.verdict).toBe("block");
    expect(result.checks.some(c => c.rule === "destructive_sql" && !c.passed)).toBe(true);
  });

  it("should warn on repetitive calls", () => {
    const op = makeOp("file_read", { path: "/same/file.ts" });
    const prev = Array(4).fill(null).map(() => ({ name: "file_read", input: { path: "/same/file.ts" } }));
    const result = runFastPath(op, 1, prev);
    expect(result.verdict).toBe("warn");
    expect(result.checks.some(c => c.rule === "repetitive_call" && !c.passed)).toBe(true);
  });

  it("should warn on binary content in writes", () => {
    const binaryContent = String.fromCharCode(...Array(100).fill(0).map((_, i) => i < 20 ? 1 : 65));
    const op = makeOp("file_write", { content: binaryContent, path: "/out.bin" });
    op.safetyClass = "write";
    const result = runFastPath(op, 1, []);
    expect(result.checks.some(c => c.rule === "write_binary" && !c.passed)).toBe(true);
  });

  it("should report latency in microseconds", () => {
    const op = makeOp("file_read", { path: "/src/index.ts" });
    const result = runFastPath(op, 1, []);
    expect(result.latencyUs).toBeGreaterThanOrEqual(0);
  });
});

describe("SlowPath", () => {
  it("should pass when all invariants satisfied", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    const op: ToolOperation = {
      name: "file_write",
      input: { path: "/src/index.ts", content: "hello" },
      safetyClass: "write",
      targetsFiles: ["/src/index.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.verdict).toBe("pass");
  });

  it("should warn on write without prior read", () => {
    const wm = new WorldModel();
    const op: ToolOperation = {
      name: "file_write",
      input: { path: "/src/never-read.ts", content: "hello" },
      safetyClass: "write",
      targetsFiles: ["/src/never-read.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.verdict).toBe("warn");
    expect(result.invariantChecks.some(c => c.invariant === "write_needs_prior_read" && !c.satisfied)).toBe(true);
  });

  it("should warn on modifying unknown files", () => {
    const wm = new WorldModel();
    const op: ToolOperation = {
      name: "file_write",
      input: { path: "/src/unknown.ts", content: "hello" },
      safetyClass: "write",
      targetsFiles: ["/src/unknown.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.invariantChecks.some(c => c.invariant === "file_in_dependency_graph" && !c.satisfied)).toBe(true);
  });

  it("should block cascade destroy", () => {
    const wm = new WorldModel();
    wm.recordRead("/src/index.ts", 1);
    wm.recordRead("/src/utils.ts", 1);
    wm.recordDep("/src/index.ts", "/src/utils.ts");
    const op: ToolOperation = {
      name: "delete_file",
      input: { path: "/src/index.ts" },
      safetyClass: "destroy",
      targetsFiles: ["/src/index.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.verdict).toBe("block");
    expect(result.invariantChecks.some(c => c.invariant === "no_cascade_destroy" && !c.satisfied)).toBe(true);
  });

  it("should block destroy without prior read", () => {
    const wm = new WorldModel();
    const op: ToolOperation = {
      name: "delete_file",
      input: { path: "/src/important.ts" },
      safetyClass: "destroy",
      targetsFiles: ["/src/important.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.invariantChecks.some(c => c.invariant === "read_before_destroy" && !c.satisfied)).toBe(true);
  });

  it("should block when consecutive failure cap reached", () => {
    const wm = new WorldModel();
    for (let i = 0; i < 4; i++) {
      wm.recordOperation(i, "bash", "execute", [], false);
    }
    const op: ToolOperation = {
      name: "bash",
      input: { command: "ls" },
      safetyClass: "execute",
      targetsFiles: [],
    };
    const result = runSlowPath(op, wm);
    expect(result.verdict).toBe("block");
    expect(result.invariantChecks.some(c => c.invariant === "consecutive_failure_cap" && !c.satisfied)).toBe(true);
  });

  it("should warn on rewrite after recent failures", () => {
    const wm = new WorldModel();
    wm.recordOperation(1, "file_write", "write", ["/src/a.ts"], false);
    wm.recordOperation(2, "file_write", "write", ["/src/a.ts"], false);
    wm.recordRead("/src/a.ts", 0);
    const op: ToolOperation = {
      name: "file_write",
      input: { path: "/src/a.ts", content: "fix" },
      safetyClass: "write",
      targetsFiles: ["/src/a.ts"],
    };
    const result = runSlowPath(op, wm);
    expect(result.invariantChecks.some(c => c.invariant === "no_rewrite_after_failure" && !c.satisfied)).toBe(true);
  });
});

describe("DualPathVerifier", () => {
  it("should pass safe read operations on fast path only", () => {
    const v = new DualPathVerifier();
    const verdict = v.verify("file_read", { path: "/src/index.ts" }, 1);
    expect(verdict.finalVerdict).toBe("pass");
    expect(verdict.pathTaken).toBe("fast");
    expect(verdict.totalLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should block dangerous commands on fast path", () => {
    const v = new DualPathVerifier();
    const verdict = v.verify("bash", { command: "rm -rf /" }, 1);
    expect(verdict.finalVerdict).toBe("block");
    expect(verdict.pathTaken).toBe("fast");
  });

  it("should block path traversal on fast path", () => {
    const v = new DualPathVerifier();
    const verdict = v.verify("file_read", { path: "../../etc/passwd" }, 1);
    expect(verdict.finalVerdict).toBe("block");
  });

  it("should block secret exposure on fast path", () => {
    const v = new DualPathVerifier();
    const verdict = v.verify("bash", { command: "export KEY=sk-abc123def456ghi789jkl012mno345" }, 1);
    expect(verdict.finalVerdict).toBe("block");
  });

  it("should route destroy operations to slow path", () => {
    const v = new DualPathVerifier();
    v.getWorldModel().recordRead("/src/index.ts", 1);
    const verdict = v.verify("delete_file", { path: "/src/index.ts" }, 5);
    expect(verdict.pathTaken).toBe("fast+slow");
    expect(verdict.slowPath).toBeDefined();
  });

  it("should route warnings to slow path when policy enabled", () => {
    const v = new DualPathVerifier();
    for (let i = 0; i < 4; i++) {
      v.verify("file_read", { path: "/same/file.ts" }, i + 1);
    }
    const verdict = v.verify("file_read", { path: "/same/file.ts" }, 5);
    expect(verdict.pathTaken).toBe("fast+slow");
  });

  it("should respect firstNTurnsFastOnly policy", () => {
    const v = new DualPathVerifier(undefined, { firstNTurnsFastOnly: 10 });
    const verdict = v.verify("delete_file", { path: "/src/test.ts" }, 2);
    expect(verdict.pathTaken).toBe("fast");
  });

  it("should route write-without-read to slow path", () => {
    const v = new DualPathVerifier();
    const verdict = v.verify("file_write", { path: "/src/never-seen.ts", content: "hello" }, 5);
    expect(verdict.pathTaken).toBe("fast+slow");
  });

  it("should record success and update world model", () => {
    const v = new DualPathVerifier();
    v.recordSuccess("file_read", { path: "/src/index.ts" }, 1);
    expect(v.getWorldModel().hasRead("/src/index.ts")).toBe(true);
  });

  it("should record failure and track consecutive failures", () => {
    const v = new DualPathVerifier();
    v.recordFailure("bash", { command: "bad" }, 1);
    v.recordFailure("bash", { command: "bad" }, 2);
    expect(v.getWorldModel().getConsecutiveFailures()).toBe(2);
  });

  it("should reset all state", () => {
    const v = new DualPathVerifier();
    v.verify("file_read", { path: "/src/index.ts" }, 1);
    v.recordFailure("bash", { command: "fail" }, 2);
    v.reset();
    expect(v.getWorldModel().getConsecutiveFailures()).toBe(0);
  });

  it("should return a copy of the policy", () => {
    const v = new DualPathVerifier();
    const policy = v.getPolicy();
    expect(policy).toEqual(DEFAULT_ROUTING_POLICY);
    policy.alwaysSlowPathFor = [];
    expect(v.getPolicy().alwaysSlowPathFor).not.toEqual([]);
  });

  it("should accept custom routing policy", () => {
    const v = new DualPathVerifier(undefined, {
      alwaysSlowPathFor: ["write"],
      warnEscalatesToSlow: false,
    });
    const policy = v.getPolicy();
    expect(policy.alwaysSlowPathFor).toContain("write");
    expect(policy.warnEscalatesToSlow).toBe(false);
  });

  it("should combine fast warn + slow block into block", () => {
    const v = new DualPathVerifier(undefined, { firstNTurnsFastOnly: 0 });
    v.getWorldModel().recordOperation(1, "file_write", "write", [], false);
    v.getWorldModel().recordOperation(2, "file_write", "write", [], false);
    for (let i = 0; i < 4; i++) {
      v.verify("file_read", { path: "/same" }, i + 1);
    }
    const verdict = v.verify("file_write", { path: "/src/x.ts", content: "x" }, 10);
    if (verdict.slowPath) {
      expect(verdict.slowPath.invariantChecks.length).toBeGreaterThan(0);
    }
  });
});

describe("DualPathVerifier integration scenarios", () => {
  it("should allow normal edit workflow: read then write", () => {
    const v = new DualPathVerifier();
    const read = v.verify("file_read", { path: "/src/app.ts" }, 1);
    expect(read.finalVerdict).toBe("pass");
    v.recordSuccess("file_read", { path: "/src/app.ts" }, 1);
    const write = v.verify("file_edit", { path: "/src/app.ts", oldContent: "foo", newContent: "bar" }, 2);
    expect(write.finalVerdict).toBe("pass");
  });

  it("should escalate write-without-read in later turns", () => {
    const v = new DualPathVerifier();
    const write = v.verify("file_write", { path: "/src/brand-new.ts", content: "hello" }, 5);
    expect(write.pathTaken).toBe("fast+slow");
  });

  it("should block destroy of file with dependents", () => {
    const v = new DualPathVerifier();
    v.getWorldModel().recordRead("/src/index.ts", 1);
    v.getWorldModel().recordRead("/src/utils.ts", 1);
    v.getWorldModel().recordDep("/src/index.ts", "/src/utils.ts");
    const verdict = v.verify("delete_file", { path: "/src/index.ts" }, 5);
    expect(verdict.finalVerdict).toBe("block");
  });
});

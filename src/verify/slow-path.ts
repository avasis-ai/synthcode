import type { SlowPathResult, Verdict } from "./types.js";
import type { ToolOperation } from "./types.js";
import type { WorldModel } from "./world-model.js";

interface Invariant {
  name: string;
  check: (op: ToolOperation, worldModel: WorldModel) => { satisfied: boolean; detail: string };
}

const INVARIANTS: Invariant[] = [
  {
    name: "write_needs_prior_read",
    check: (op, wm) => {
      if (op.safetyClass !== "write") return { satisfied: true, detail: "Not a write" };
      const targets = op.targetsFiles;
      if (targets.length === 0) return { satisfied: true, detail: "No file targets identified" };
      const unread = targets.filter(f => !wm.hasRead(f) && !wm.hasBeenWritten(f));
      if (unread.length > 0) {
        return { satisfied: false, detail: `Writing to file(s) never read: ${unread.join(", ")}` };
      }
      return { satisfied: true, detail: "All targets previously accessed" };
    },
  },
  {
    name: "file_in_dependency_graph",
    check: (op, wm) => {
      const targets = op.targetsFiles;
      const unknown = targets.filter(f => !wm.isKnownFile(f));
      if (op.safetyClass === "write" || op.safetyClass === "destroy") {
        if (unknown.length > 0) {
          return { satisfied: false, detail: `Modifying unknown file(s): ${unknown.join(", ")}` };
        }
      }
      return { satisfied: true, detail: "Targets known" };
    },
  },
  {
    name: "no_cascade_destroy",
    check: (op, wm) => {
      if (op.safetyClass !== "destroy") return { satisfied: true, detail: "Not destructive" };
      const targets = op.targetsFiles;
      for (const f of targets) {
        const deps = wm.getDeps(f);
        if (deps.length > 0) {
          return { satisfied: false, detail: `Destroying ${f} would orphan dependents: ${deps.slice(0, 5).join(", ")}` };
        }
      }
      return { satisfied: true, detail: "No dependents affected" };
    },
  },
  {
    name: "no_rewrite_after_failure",
    check: (op, wm) => {
      if (op.safetyClass !== "write") return { satisfied: true, detail: "Not a write" };
      const recent = wm.getRecentOperations(5);
      const recentWriteFails = recent.filter(r => r.success === false && r.safetyClass === "write");
      if (recentWriteFails.length >= 2) {
        return { satisfied: false, detail: `${recentWriteFails.length} recent write failures — agent may be corrupting files` };
      }
      return { satisfied: true, detail: "Write history clean" };
    },
  },
  {
    name: "read_before_destroy",
    check: (op, wm) => {
      if (op.safetyClass !== "destroy") return { satisfied: true, detail: "Not destructive" };
      const targets = op.targetsFiles;
      const unread = targets.filter(f => !wm.hasRead(f));
      if (unread.length > 0) {
        return { satisfied: false, detail: `Destroying file(s) without prior read: ${unread.join(", ")}` };
      }
      return { satisfied: true, detail: "All targets read before destroy" };
    },
  },
  {
    name: "consecutive_failure_cap",
    check: (op, wm) => {
      const failures = wm.getConsecutiveFailures();
      if (failures >= 3) {
        return { satisfied: false, detail: `${failures} consecutive tool failures — agent may be stuck` };
      }
      return { satisfied: true, detail: `Only ${failures} consecutive failures` };
    },
  },
];

export function runSlowPath(operation: ToolOperation, worldModel: WorldModel): SlowPathResult {
  const start = performance.now();

  const invariantChecks = INVARIANTS.map(inv => {
    const result = inv.check(operation, worldModel);
    return { invariant: inv.name, satisfied: result.satisfied, detail: result.detail };
  });

  const violations = invariantChecks.filter(c => !c.satisfied);

  let verdict: Verdict;
  let reasoning: string;

  if (violations.length === 0) {
    verdict = "pass";
    reasoning = "All invariants satisfied";
  } else if (violations.some(v => v.invariant === "no_cascade_destroy" || v.invariant === "consecutive_failure_cap")) {
    verdict = "block";
    reasoning = violations.map(v => v.detail).join("; ");
  } else {
    verdict = "warn";
    reasoning = `Invariant warnings: ${violations.map(v => v.invariant).join(", ")}`;
  }

  const latencyMs = performance.now() - start;

  return { verdict, reasoning, invariantChecks, latencyMs };
}

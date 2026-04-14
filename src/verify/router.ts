import type { DualPathVerdict, RoutingPolicy, Verdict, ToolOperation } from "./types.js";
import { DEFAULT_ROUTING_POLICY } from "./types.js";
import { runFastPath } from "./fast-path.js";
import { runSlowPath } from "./slow-path.js";
import { WorldModel } from "./world-model.js";

const SAFETY_CLASS_MAP: Record<string, import("./types.js").SafetyClass> = {
  bash: "execute",
  file_read: "read",
  read_file: "read",
  file_write: "write",
  write_file: "write",
  file_edit: "write",
  edit_file: "write",
  glob: "read",
  grep: "read",
  web_fetch: "network",
  web_search: "network",
  delete_file: "destroy",
};

function classifyTool(toolName: string, input: Record<string, unknown>): ToolOperation {
  const safetyClass = SAFETY_CLASS_MAP[toolName] ?? "read";
  const op: ToolOperation = { name: toolName, input, safetyClass, targetsFiles: [] };
  return op;
}

function extractTargetFiles(op: ToolOperation): string[] {
  const paths: string[] = [];
  for (const key of ["path", "filePath", "file_path", "file", "directory", "dir"]) {
    const val = op.input[key];
    if (typeof val === "string" && val.length > 0) paths.push(val);
  }
  if (op.safetyClass === "execute" && typeof op.input.command === "string") {
    const cmd = op.input.command as string;
    for (const m of cmd.matchAll(/['"]?(\/?[^\s'"<>|;&]+\.[\w]+)['"]?/g)) {
      if (m[1] && !m[1].startsWith("-")) paths.push(m[1]);
    }
  }
  return [...new Set(paths)];
}

function shouldRouteToSlow(
  fastResult: import("./types.js").FastPathResult,
  operation: ToolOperation,
  turnCount: number,
  worldModel: WorldModel,
  policy: RoutingPolicy,
): boolean {
  if (turnCount <= policy.firstNTurnsFastOnly) {
    return false;
  }

  if (policy.alwaysSlowPathFor.includes(operation.safetyClass)) {
    return true;
  }

  if (policy.warnEscalatesToSlow && fastResult.verdict === "warn") {
    return true;
  }

  if (worldModel.getConsecutiveFailures() >= policy.consecutiveFailuresTriggerSlow) {
    return true;
  }

  if (policy.fileNotInGraphTriggersSlow) {
    for (const f of operation.targetsFiles) {
      if (!worldModel.isKnownFile(f) && (operation.safetyClass === "write" || operation.safetyClass === "destroy")) {
        return true;
      }
    }
  }

  if (policy.writeWithoutReadTriggersSlow && operation.safetyClass === "write") {
    for (const f of operation.targetsFiles) {
      if (!worldModel.hasRead(f) && !worldModel.hasBeenWritten(f)) {
        return true;
      }
    }
  }

  return false;
}

export class DualPathVerifier {
  private worldModel: WorldModel;
  private policy: RoutingPolicy;
  private previousCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

  constructor(worldModel?: WorldModel, policy?: Partial<RoutingPolicy>) {
    this.worldModel = worldModel ?? new WorldModel();
    this.policy = { ...DEFAULT_ROUTING_POLICY, ...policy };
  }

  verify(
    toolName: string,
    input: Record<string, unknown>,
    turnCount: number,
  ): DualPathVerdict {
    const operation = classifyTool(toolName, input);
    operation.targetsFiles = extractTargetFiles(operation);

    const totalStart = performance.now();

    const fastResult = runFastPath(operation, turnCount, this.previousCalls);

    if (fastResult.verdict === "block") {
      const totalLatencyMs = performance.now() - totalStart;
      this.previousCalls.push({ name: toolName, input });
      return {
        toolName,
        fastPath: fastResult,
        finalVerdict: "block",
        reason: fastResult.checks.filter(c => !c.passed && c.severity === "critical").map(c => c.message).join("; "),
        totalLatencyMs,
        pathTaken: "fast",
      };
    }

    const needsSlowPath = shouldRouteToSlow(fastResult, operation, turnCount, this.worldModel, this.policy);

    if (needsSlowPath) {
      const slowResult = runSlowPath(operation, this.worldModel);

      let finalVerdict: Verdict;
      if (fastResult.verdict === "warn" || slowResult.verdict === "warn") {
        finalVerdict = slowResult.verdict === "block" ? "block" : "warn";
      } else if (slowResult.verdict === "block") {
        finalVerdict = "block";
      } else {
        finalVerdict = "pass";
      }

      const totalLatencyMs = performance.now() - totalStart;
      this.previousCalls.push({ name: toolName, input });

      return {
        toolName,
        fastPath: fastResult,
        slowPath: slowResult,
        finalVerdict,
        reason: slowResult.reasoning,
        totalLatencyMs,
        pathTaken: "fast+slow",
      };
    }

    const totalLatencyMs = performance.now() - totalStart;
    this.previousCalls.push({ name: toolName, input });
    this.recordOperation(operation, turnCount, true);

    return {
      toolName,
      fastPath: fastResult,
      finalVerdict: fastResult.verdict === "warn" ? "warn" : "pass",
      reason: fastResult.verdict === "warn"
        ? fastResult.checks.filter(c => !c.passed).map(c => c.message).join("; ")
        : undefined,
      totalLatencyMs,
      pathTaken: "fast",
    };
  }

  recordSuccess(toolName: string, input: Record<string, unknown>, turnCount: number): void {
    const operation = classifyTool(toolName, input);
    operation.targetsFiles = extractTargetFiles(operation);
    this.recordOperation(operation, turnCount, true);
  }

  recordFailure(toolName: string, input: Record<string, unknown>, turnCount: number): void {
    const operation = classifyTool(toolName, input);
    operation.targetsFiles = extractTargetFiles(operation);
    this.recordOperation(operation, turnCount, false);
  }

  getWorldModel(): WorldModel {
    return this.worldModel;
  }

  getPolicy(): RoutingPolicy {
    return { ...this.policy };
  }

  reset(): void {
    this.worldModel.reset();
    this.previousCalls = [];
  }

  private recordOperation(op: ToolOperation, turn: number, success: boolean): void {
    for (const f of op.targetsFiles) {
      if (op.safetyClass === "read") this.worldModel.recordRead(f, turn);
      if (op.safetyClass === "write") this.worldModel.recordWrite(f, turn);
    }
    this.worldModel.recordOperation(turn, op.name, op.safetyClass, op.targetsFiles, success);
  }
}

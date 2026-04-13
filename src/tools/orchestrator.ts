import type { ToolContext, ToolUseBlock } from '../types.js';
import type { Tool } from './tool.js';
import { ToolRegistry } from './registry.js';
import { ToolVerifier, type VerificationContext } from './verifier.js';

export { ToolVerifier } from './verifier.js';
export type { VerificationCheck, VerificationResult, VerificationRule, VerificationContext } from './verifier.js';

/** Result of a single tool execution. */
export interface ToolExecutionResult {
  id: string;
  name: string;
  output: string;
  isError: boolean;
  durationMs: number;
}

class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    const next = this.queue.shift();
    if (next) {
      this.current++;
      next();
    }
  }
}

function partitionToolCalls(
  toolCalls: ToolUseBlock[],
  registry: ToolRegistry,
): ToolUseBlock[][] {
  const batches: ToolUseBlock[][] = [];
  let currentBatch: ToolUseBlock[] = [];
  let currentBatchIsConcurrent = false;

  for (const call of toolCalls) {
    const tool = registry.get(call.name);
    const isConcurrent = tool ? tool.isReadOnly && tool.isConcurrencySafe : false;

    if (isConcurrent && currentBatchIsConcurrent) {
      currentBatch.push(call);
    } else {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [call];
      currentBatchIsConcurrent = isConcurrent;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function executeToolCall(
  call: ToolUseBlock,
  registry: ToolRegistry,
  context: ToolContext,
  permissionCheck?: (name: string, input: Record<string, unknown>) => Promise<boolean>,
  abortSignal?: AbortSignal,
  verifier?: ToolVerifier,
  verificationContext?: VerificationContext,
): Promise<ToolExecutionResult> {
  if (abortSignal?.aborted) {
    return {
      id: call.id,
      name: call.name,
      output: 'Execution aborted',
      isError: true,
      durationMs: 0,
    };
  }

  const tool = registry.get(call.name);
  if (!tool) {
    return {
      id: call.id,
      name: call.name,
      output: `Unknown tool: ${call.name}`,
      isError: true,
      durationMs: 0,
    };
  }

  const start = performance.now();

  try {
    const parseResult = tool.inputSchema.safeParse(call.input);
    if (!parseResult.success) {
      return {
        id: call.id,
        name: call.name,
        output: `Invalid input for ${call.name}: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
        isError: true,
        durationMs: Math.round(performance.now() - start),
      };
    }

    if (permissionCheck) {
      const allowed = await permissionCheck(call.name, call.input);
      if (!allowed) {
        return {
          id: call.id,
          name: call.name,
          output: `Permission denied for tool: ${call.name}`,
          isError: true,
          durationMs: Math.round(performance.now() - start),
        };
      }
    }

    if (verifier && verificationContext) {
      const result = verifier.verify(call.name, parseResult.data as Record<string, unknown>, verificationContext);
      if (!result.approved) {
        return {
          id: call.id,
          name: call.name,
          output: `Verification failed: ${result.reason ?? "unknown reason"}`,
          isError: true,
          durationMs: Math.round(performance.now() - start),
        };
      }
    }

    const output = await tool.execute(parseResult.data, context);

    return {
      id: call.id,
      name: call.name,
      output,
      isError: false,
      durationMs: Math.round(performance.now() - start),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: call.id,
      name: call.name,
      output: `Error executing ${call.name}: ${message}`,
      isError: true,
      durationMs: Math.round(performance.now() - start),
    };
  }
}

export interface OrchestrateOptions {
  verifier?: ToolVerifier;
  previousToolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
  turnCount?: number;
}

/**
 * Orchestrate execution of multiple tool calls with partition-based concurrency.
 *
 * Read-only, concurrency-safe tools are grouped into concurrent batches (max 10 parallel).
 * Non-safe tools are executed serially in their own batches.
 * Results are returned in the original call order.
 *
 * If a verifier is provided, each tool call is verified before execution.
 */
export async function orchestrateTools(
  tools: ToolRegistry,
  toolCalls: ToolUseBlock[],
  context: ToolContext,
  permissionCheck?: (name: string, input: Record<string, unknown>) => Promise<boolean>,
  abortSignal?: AbortSignal,
  options?: OrchestrateOptions,
): Promise<ToolExecutionResult[]> {
  const verifier = options?.verifier;
  const batches = partitionToolCalls(toolCalls, tools);
  const results: ToolExecutionResult[] = [];

  for (const batch of batches) {
    if (abortSignal?.aborted) {
      for (const call of batch) {
        results.push({
          id: call.id,
          name: call.name,
          output: 'Execution aborted',
          isError: true,
          durationMs: 0,
        });
      }
      continue;
    }

    if (batch.length > 1) {
      const semaphore = new Semaphore(10);
      const promises = batch.map((call) =>
        semaphore.acquire().then(async () => {
          try {
            return await executeToolCall(call, tools, context, permissionCheck, abortSignal, verifier, buildVerificationContext(options));
          } finally {
            semaphore.release();
          }
        }),
      );
      const settled = await Promise.allSettled(promises);
      for (let i = 0; i < settled.length; i++) {
        const s = settled[i];
        if (s.status === 'fulfilled') {
          results.push(s.value);
        } else {
          results.push({
            id: batch[i].id,
            name: batch[i].name,
            output: `Unexpected error: ${s.reason instanceof Error ? s.reason.message : String(s.reason)}`,
            isError: true,
            durationMs: 0,
          });
        }
      }
    } else {
      const result = await executeToolCall(batch[0], tools, context, permissionCheck, abortSignal, verifier, buildVerificationContext(options));
      results.push(result);
    }
  }

  return results;
}

function buildVerificationContext(options?: OrchestrateOptions): VerificationContext | undefined {
  if (!options?.verifier) return undefined;
  return {
    turnCount: options.turnCount ?? 0,
    previousToolCalls: options.previousToolCalls ?? [],
    cwd: process.cwd(),
  };
}

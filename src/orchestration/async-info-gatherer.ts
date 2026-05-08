import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types.js";

type SourceTask = {
  id: string;
  apiCall: (params: Record<string, unknown>) => Promise<unknown>;
  params: Record<string, unknown>;
  maxRetries: number;
  timeoutMs: number;
};

type SourceResult = {
  sourceId: string;
  data: unknown;
  success: boolean;
  error: string | null;
};

class AsyncInformationGatherer {
  constructor() {}

  private async executeTaskWithRetry(task: SourceTask): Promise<SourceResult> {
    let lastError: string | null = null;
    let attempt = 0;

    while (attempt <= task.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller['abort']("Timeout"), task.timeoutMs);

        const result = await Promise.race([
          task.apiCall(task.params).then(data => ({ data })),
          new Promise((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new Error("Operation timed out or aborted"));
            });
          })
        ]);

        clearTimeout(timeoutId);
        return {
          sourceId: task.id,
          data: result.data,
          success: true,
          error: null,
        };
      } catch (e: any) {
        lastError = e.message || "Unknown error";
        if (attempt < task.maxRetries) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt)); // Simple backoff
        } else {
          return {
            sourceId: task.id,
            data: null,
            success: false,
            error: lastError,
          };
        }
      }
    }
    return {
      sourceId: task.id,
      data: null,
      success: false,
      error: lastError,
    };
  }

  public async gatherInformation(tasks: SourceTask[]): Promise<{ aggregatedPayload: Record<string, unknown>; conflicts: string[] }> {
    const promises = tasks.map(task => this.executeTaskWithRetry(task));
    const results = await Promise.allSettled(promises);

    const sourceResults: SourceResult[] = results.map(result => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        sourceId: "Unknown",
        data: null,
        success: false,
        error: "Promise failed during execution.",
      };
    });

    const aggregatedPayload: Record<string, unknown> = {};
    const conflicts: string[] = [];

    for (const result of sourceResults) {
      if (result.success) {
        const sourceId = result.sourceId;
        const data = result.data;

        if (typeof data === 'object' && data !== null) {
          Object.assign(aggregatedPayload, data);
        } else {
          aggregatedPayload[sourceId] = data;
        }
      } else {
        console.error(`Failed to gather info from ${result.sourceId}: ${result.error}`);
      }
    }

    // Simple conflict detection: Check if multiple sources wrote to the same key
    const keysFound: Record<string, Set<string>> = {};
    for (const result of sourceResults) {
      if (result.success) {
        const sourceId = result.sourceId;
        const data = result.data;

        if (typeof data === 'object' && data !== null) {
          (Object.keys(data) as Array<string>).forEach(key => {
            if (!keysFound[key]) {
              keysFound[key] = new Set<string>();
            }
            keysFound[key].add(sourceId);
          });
        }
      }
    }

    const conflictKeys: string[] = [];
    for (const key in keysFound) {
      if (keysFound[key]!.size > 1) {
        conflictKeys.push(key);
      }
    }

    return {
      aggregatedPayload,
      conflicts: conflictKeys,
    };
  }
}

export { AsyncInformationGatherer };
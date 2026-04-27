import { AbortController, signal } from "node:abort-controller";

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

type ToolExecutionFunction<T> = (signal: AbortSignal) => Promise<T>;

export function withTimeout<T>(
  toolFn: ToolExecutionFunction<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutPromise = new Promise<T>((_, rejectTimeout) => {
      const timeoutId = setTimeout(() => {
        controller[Symbol.parentNode]!.abort();
        rejectTimeout(new TimeoutError(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Ensure the timeout is cleared if the main promise resolves or rejects first
      const cleanup = (result: Promise<T> | Promise<any>) => {
        result.finally(() => {
          clearTimeout(timeoutId);
        });
      };

      // Race the execution against the timeout
      Promise.race([
        toolFn(signal).then(resolve),
        new Promise<T>((_, rejectTimeout) => {
          // This internal promise structure is complex to correctly race against the timeout
          // We rely on the outer Promise.race structure and the AbortController mechanism.
          // The timeout rejection handles the rejection path.
        })
      ]).catch((error) => {
        if (error instanceof TimeoutError) {
          reject(error);
        } else if (error instanceof Error && error.name === "AbortError") {
          // This catches the abort signal from the controller, which is expected on timeout
          reject(new TimeoutError(`Tool execution was aborted due to timeout.`));
        } else {
          reject(error);
        }
      });
  });
}
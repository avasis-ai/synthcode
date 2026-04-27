import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Context {
  [key: string]: any;
}

export interface Precondition {
  (context: Context): Promise<boolean> | Promise<Error>;
}

export interface PreconditionFailure {
  preconditionName: string;
  error: Error;
}

export class PreconditionChecker {
  private preconditions: { name: string; check: Precondition }[];

  constructor(preconditions: { name: string; check: Precondition }[]) {
    this.preconditions = preconditions;
  }

  public async check(context: Context): Promise<{ success: boolean; failures: PreconditionFailure[] }> {
    const failures: PreconditionFailure[] = [];

    for (const { name, check } of this.preconditions) {
      try {
        const result = await check(context);
        if (result instanceof Promise) {
          const resolvedResult = await result;
          if (typeof resolvedResult === 'boolean') {
            if (!resolvedResult) {
              failures.push({
                preconditionName: name,
                error: new Error(`Precondition failed: ${name} returned false`),
              });
            }
          } else if (resolvedResult instanceof Error) {
            failures.push({
              preconditionName: name,
              error: resolvedResult,
            });
          }
        } else if (typeof result === 'boolean') {
          if (!result) {
            failures.push({
              preconditionName: name,
              error: new Error(`Precondition failed: ${name} returned false`),
            });
          }
        } else if (result instanceof Error) {
          failures.push({
            preconditionName: name,
            error: result,
          });
        }
      } catch (e) {
        failures.push({
          preconditionName: name,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    }

    return {
      success: failures.length === 0,
      failures: failures,
    };
  }
}
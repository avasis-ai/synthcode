import { Message } from "./types";

export type PreconditionCheckResult = {
  success: boolean;
  message: string;
  details?: any;
};

export type PreconditionChecker = (context: Message) => Promise<PreconditionCheckResult>;

export interface ExecutionResult {
  overallSuccess: boolean;
  results: {
    checkerName: string;
    result: PreconditionCheckResult;
  }[];
}

export class ToolCallPreconditionChainExecutor {
  private checkers: { name: string; checker: PreconditionChecker }[];

  constructor(checkers: { name: string; checker: PreconditionChecker }[]) {
    this.checkers = checkers;
  }

  public async execute(context: Message): Promise<ExecutionResult> {
    const results: {
      checkerName: string;
      result: PreconditionCheckResult;
    }[] = [];

    for (const { name, checker } of this.checkers) {
      try {
        const result = await checker(context);
        results.push({ checkerName: name, result: result });
      } catch (error) {
        results.push({
          checkerName: name,
          result: {
            success: false,
            message: `Execution failed: ${(error as Error).message}`,
          },
        });
      }
    }

    const overallSuccess = results.every(r => r.result.success);

    return {
      overallSuccess,
      results,
    };
  }
}
import { Message } from "./types";

export type PreconditionResult = {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
};

export type PreconditionFunction = (context: Record<string, any>) => Promise<PreconditionResult>;

export interface PreconditionExecutor {
  executeChain(
    preconditions: PreconditionFunction[],
    context: Record<string, any>
  ): Promise<{
    success: boolean;
    failedPreconditionIndex: number;
    failureReport: {
      precondition: PreconditionFunction;
      error: string;
      details: Record<string, any>;
    } | null;
  }>;
}

export class ToolPreconditionChainExecutor implements PreconditionExecutor {
  async executeChain(
    preconditions: PreconditionFunction[],
    context: Record<string, any>
  ): Promise<{
    success: boolean;
    failedPreconditionIndex: number;
    failureReport: {
      precondition: PreconditionFunction;
      error: string;
      details: Record<string, any>;
    } | null;
  }> {
    for (let i = 0; i < preconditions.length; i++) {
      const precondition = preconditions[i];
      try {
        const result = await precondition(context);
        if (!result.success) {
          return {
            success: false,
            failedPreconditionIndex: i,
            failureReport: {
              precondition: precondition,
              error: result.error || "Precondition failed validation.",
              details: result.details || {},
            },
          };
        }
      } catch (e) {
        return {
          success: false,
          failedPreconditionIndex: i,
          failureReport: {
            precondition: precondition,
            error: (e as Error).message || "An unexpected error occurred during precondition execution.",
            details: { stack: (e as Error).stack },
          },
        };
      }
    }

    return {
      success: true,
      failedPreconditionIndex: -1,
      failureReport: null,
    };
  }
}
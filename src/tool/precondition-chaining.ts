import { Message } from "./types";

interface PreconditionChecker {
  check(context: Record<string, unknown>): { success: boolean; reason?: string };
}

export class PreconditionChain {
  private checkers: PreconditionChecker[];

  constructor(checkers: PreconditionChecker[]) {
    this.checkers = checkers;
  }

  public checkAll(context: Record<string, unknown>): { success: boolean; reason?: string } {
    for (const checker of this.checkers) {
      const result = checker.check(context);
      if (!result.success) {
        return { success: false, reason: result.reason };
      }
    }
    return { success: true };
  }
}
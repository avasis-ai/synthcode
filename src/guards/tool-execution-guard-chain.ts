import { Message } from "./types";

export type GuardResult = {
  success: boolean;
  error?: string;
};

export interface Guard {
  name: string;
  execute: (context: { message: Message; history: Message[] }) => GuardResult;
}

export class ToolExecutionGuardChain {
  private guards: Guard[];

  constructor(guards: Guard[]) {
    this.guards = guards;
  }

  public async run(context: { message: Message; history: Message[] }): Promise<GuardResult> {
    for (const guard of this.guards) {
      const result = guard.execute(context);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    return { success: true };
  }
}

export const createGuardChain = (guards: Guard[]): ToolExecutionGuardChain => {
  return new ToolExecutionGuardChain(guards);
};
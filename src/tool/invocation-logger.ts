import { EventEmitter } from "events";

export interface InvocationLogEntry {
  toolName: string;
  context: any;
  startTime: number;
  endTime: number;
  success: boolean;
  output: any;
}

export class InvocationLogger extends EventEmitter {
  private static instance: InvocationLogger;
  private logs: InvocationLogEntry[] = [];

  private constructor() {
    super();
  }

  public static getInstance(): InvocationLogger {
    if (!InvocationLogger.instance) {
      InvocationLogger.instance = new InvocationLogger();
    }
    return InvocationLogger.instance;
  }

  public startInvocation(toolName: string, context: any): { end: (output: any) => Promise<void> } {
    const startTime = Date.now();
    const initialLogEntry: InvocationLogEntry = {
      toolName,
      context,
      startTime,
      endTime: 0,
      success: true,
      output: null,
    };

    this.logs.push(initialLogEntry);

    const end = async (output: any): Promise<void> => {
      const endTime = Date.now();
      const finalLogEntry: InvocationLogEntry = {
        toolName: initialLogEntry.toolName,
        context: initialLogEntry.context,
        startTime: initialLogEntry.startTime,
        endTime: endTime,
        success: true,
        output: output,
      };

      this.logs[this.logs.length - 1] = finalLogEntry;

      await this.logEntryAsync(finalLogEntry);
      return Promise.resolve();
    };

    return { end };
  }

  public startInvocationWithError(toolName: string, context: any): { end: (error: Error) => Promise<void> } {
    const startTime = Date.now();
    const initialLogEntry: InvocationLogEntry = {
      toolName,
      context,
      startTime,
      endTime: 0,
      success: false,
      output: null,
    };

    this.logs.push(initialLogEntry);

    const end = async (error: Error): Promise<void> => {
      const endTime = Date.now();
      const finalLogEntry: InvocationLogEntry = {
        toolName: initialLogEntry.toolName,
        context: initialLogEntry.context,
        startTime: initialLogEntry.startTime,
        endTime: endTime,
        success: false,
        output: { error: error.message, stack: error.stack },
      };

      this.logs[this.logs.length - 1] = finalLogEntry;

      await this.logEntryAsync(finalLogEntry);
      return Promise.resolve();
    };

    return { end };
  }

  public getLogs(): InvocationLogEntry[] {
    return [...this.logs];
  }

  private async logEntryAsync(entry: InvocationLogEntry): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log("--- Tool Invocation Log ---");
        console.log(`Tool: ${entry.toolName}`);
        console.log(`Success: ${entry.success}`);
        console.log(`Duration: ${entry.endTime - entry.startTime}ms`);
        console.log("---------------------------");
        this.emit("log", entry);
        resolve();
      }, 0);
    });
  }
}

export const invocationLogger = InvocationLogger.getInstance();
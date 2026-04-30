import { Message, ToolCallContext, ToolCallDetails } from "./types";

interface HistoryStore {
  getToolCallHistory(toolName: string, limit: number): { input: Record<string, unknown>; output: any; }[];
}

export class StructuredToolCallValidatorContextEnricher {
  private historyStore: HistoryStore;
  private historyLimit: number;

  constructor(historyStore: HistoryStore, historyLimit: number = 3) {
    this.historyStore = historyStore;
    this.historyLimit = historyLimit;
  }

  enrichContext(
    currentContext: Message[],
    toolCallDetails: ToolCallDetails
  ): {
    enrichedContext: Message[];
    historicalData: {
      history: { input: Record<string, unknown>; output: any }[];
      lastN: number;
    };
  } {
    const toolName = toolCallDetails.name;
    const historicalData = this.historyStore.getToolCallHistory(
      toolName,
      this.historyLimit
    );

    const enrichedContext: Message[] = [
      ...currentContext,
      {
        role: "system",
        content: `--- Tool Call History for ${toolName} ---\n${JSON.stringify(historicalData, null, 2)}`,
      } as unknown as Message, // Type assertion for system message simulation
    ];

    return {
      enrichedContext: enrichedContext,
      historicalData: {
        history: historicalData,
        lastN: historicalData.length,
      },
    };
  }
}
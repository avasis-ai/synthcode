import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface Context {
  userId: string;
  sessionId: string;
  // Add other context fields as necessary
}

export interface TimeWindow {
  startTime: number; // Unix timestamp
  endTime: number;   // Unix timestamp
}

export interface ContextualStateDiffReport {
  diffedMessages: {
    message: Message;
    diff: {
      field: string;
      oldValue: any;
      newValue: any;
      contextualImpact: string;
    }[];
  }[];
  summary: string;
  isSignificant: boolean;
}

export class ContextualStateDiffingV8 {
  private readonly context: Context;
  private readonly timeWindow: TimeWindow;

  constructor(context: Context, timeWindow: TimeWindow) {
    this.context = context;
    this.timeWindow = timeWindow;
  }

  private isWithinTimeWindow(timestamp: number): boolean {
    return timestamp >= this.timeWindow.startTime && timestamp <= this.timeWindow.endTime;
  }

  private calculateMessageDiff(
    current: Message,
    previous: Message,
  ): {
    message: Message;
    diff: {
      field: string;
      oldValue: any;
      newValue: any;
      contextualImpact: string;
    }[];
  } {
    const diffs: {
      field: string;
      oldValue: any;
      newValue: any;
      contextualImpact: string;
    }[] = [];

    const generateDiff = (
      field: string,
      oldValue: any,
      newValue: any,
      context: Context,
      timeWindow: TimeWindow,
    ): void => {
      if (oldValue !== newValue) {
        const impact = `Contextual change detected for ${field}. Context: ${context.userId}, Time: ${timeWindow.startTime}`;
        diffs.push({
          field,
          oldValue,
          newValue,
          contextualImpact: impact,
        });
      }
    };

    if (current.role === "user" && previous.role === "user") {
      const userDiffs = this.diffContentBlocks(
        current as AssistantMessage, // Assuming content structure for simplicity in this example
        previous as AssistantMessage,
        "user_content",
        "User message content",
      );
      return {
        message: current,
        diff: userDiffs,
      };
    }

    if (current.role === "assistant" && previous.role === "assistant") {
      const contentDiffs = this.diffContentBlocks(
        current as AssistantMessage,
        previous as AssistantMessage,
        "assistant_content",
        "Assistant response content",
      );
      return {
        message: current,
        diff: contentDiffs,
      };
    }

    return {
      message: current,
      diff: [],
    };
  }

  private diffContentBlocks(
    current: AssistantMessage,
    previous: AssistantMessage,
    field: string,
    description: string,
  ): {
    field: string;
    oldValue: any;
    newValue: any;
    contextualImpact: string;
  }[] {
    const diffs: {
      field: string;
      oldValue: any;
      newValue: any;
      contextualImpact: string;
    }[] = [];

    const compareBlocks = (
      currentBlocks: ContentBlock[],
      previousBlocks: ContentBlock[],
    ): void => {
      const maxLength = Math.max(currentBlocks.length, previousBlocks.length);
      for (let i = 0; i < maxLength; i++) {
        const currentBlock = currentBlocks[i];
        const previousBlock = previousBlocks[i];

        if (!currentBlock && !previousBlock) continue;

        if (!currentBlock || !previousBlock) {
          diffs.push({
            field: `${field}[${i}]`,
            oldValue: previousBlock,
            newValue: currentBlock,
            contextualImpact: `Structural change detected at index ${i}.`,
          });
          continue;
        }

        if (JSON.stringify(currentBlock) !== JSON.stringify(previousBlock)) {
          diffs.push({
            field: `${field}[${i}]`,
            oldValue: previousBlock,
            newValue: currentBlock,
            contextualImpact: `Content change detected at index ${i}.`,
          });
        }
      }
    };

    compareBlocks(current.content, previous.content);
    return diffs;
  }

  public diffStates(
    currentState: Message[],
    previousState: Message[],
  ): ContextualStateDiffReport {
    const messageDiffs: {
      message: Message;
      diff: {
        field: string;
        oldValue: any;
        newValue: any;
        contextualImpact: string;
      }[];
    }[] = [];

    for (let i = 0; i < currentState.length; i++) {
      const current = currentState[i];
      const previous = previousState[i];

      if (!previous) {
        // New message added
        messageDiffs.push({
          message: current,
          diff: [{
            field: "message_added",
            oldValue: undefined,
            newValue: current,
            contextualImpact: "New message added to the state history.",
          }],
        });
        continue;
      }

      const diffResult = this.calculateMessageDiff(current, previous);
      messageDiffs.push(diffResult);
    }

    const summary = messageDiffs.length > 0
      ? `Successfully diffed ${messageDiffs.length} messages. Total significant changes found.`
      : "No discernible state changes detected within the given context and time window.";

    const isSignificant = messageDiffs.some(
      (item) => item.diff.some((d) => d.contextualImpact.includes("Content change")),
    );

    return {
      diffedMessages: messageDiffs,
      summary: summary,
      isSignificant: isSignificant,
    };
  }
}
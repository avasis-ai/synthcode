import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type GuardrailStep = (
  context: {
    message: Message;
    toolCall: ToolUseBlock;
    history: Message[];
  }
) => Promise<{
  validatedContext: {
    message: Message;
    toolCall: ToolUseBlock;
    history: Message[];
  };
  output: any;
}>;

export class ContextualToolCallGuardrailChainBuilder {
  private steps: GuardrailStep[] = [];

  addStep(step: GuardrailStep): this {
    this.steps.push(step);
    return this;
  }

  build(): {
    execute: (
      context: {
        message: Message;
        toolCall: ToolUseBlock;
        history: Message[];
      }
    ) => Promise<{
      validatedContext: {
        message: Message;
        toolCall: ToolUseBlock;
        history: Message[];
      };
      output: any;
    }>;
  } {
    return async (context: {
      message: Message;
      toolCall: ToolUseBlock;
      history: Message[];
    }): Promise<{
      validatedContext: {
        message: Message;
        toolCall: ToolUseBlock;
        history: Message[];
      };
      output: any;
    }> => {
      let currentContext: {
        message: Message;
        toolCall: ToolUseBlock;
        history: Message[];
      } = {
        message: context.message,
        toolCall: context.toolCall,
        history: context.history,
      };
      let lastOutput: any = undefined;

      for (const step of this.steps) {
        const result = await step({
          context: {
            message: currentContext.message,
            toolCall: currentContext.toolCall,
            history: currentContext.history,
          },
          toolCall: currentContext.toolCall,
          history: currentContext.history,
        });

        currentContext = result.validatedContext;
        lastOutput = result.output;
      }

      return {
        validatedContext: currentContext,
        output: lastOutput,
      };
    };
  }
}
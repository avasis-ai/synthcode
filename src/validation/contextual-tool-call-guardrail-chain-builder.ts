import { Message, ToolUseBlock } from "./types";

export type GuardrailResult = {
  isValid: boolean;
  message: string;
  context?: Record<string, unknown>;
};

export type GuardrailStep = (context: {
  toolCall: ToolUseBlock;
  history: Message[];
}) => GuardrailResult;

export class ContextualToolCallGuardrailChainBuilder {
  private preValidators: GuardrailStep[] = [];
  private postValidators: GuardrailStep[] = [];

  addPreValidator(validator: GuardrailStep): this {
    this.preValidators.push(validator);
    return this;
  }

  addPostValidator(validator: GuardrailStep): this {
    this.postValidators.push(validator);
    return this;
  }

  build(): {
    execute: (context: {
      toolCall: ToolUseBlock;
      history: Message[];
    }) => {
      preContext: {
        toolCall: ToolUseBlock;
        history: Message[];
      };
      postContext: {
        toolCall: ToolUseBlock;
        history: Message[];
      };
      result: GuardrailResult;
    };
  } {
    return {
      execute: (context: {
        toolCall: ToolUseBlock;
        history: Message[];
      }): {
        preContext: {
          toolCall: ToolUseBlock;
          history: Message[];
        };
        postContext: {
          toolCall: ToolUseBlock;
          history: Message[];
        };
        result: GuardrailResult;
      } => {
        let currentContext = {
          toolCall: context.toolCall,
          history: context.history,
        };

        for (const validator of this.preValidators) {
          const result = validator(currentContext);
          if (!result.isValid) {
            return {
              preContext: currentContext,
              postContext: currentContext,
              result: result,
            };
          }
        }

        let finalPreContext = {
          toolCall: context.toolCall,
          history: context.history,
        };

        for (const validator of this.postValidators) {
          const result = validator(currentContext);
          if (!result.isValid) {
            return {
              preContext: finalPreContext,
              postContext: currentContext,
              result: result,
            };
          }
        }

        return {
          preContext: finalPreContext,
          postContext: context,
          result: {
            isValid: true,
            message: "All guardrails passed.",
          },
        };
      },
    };
  }
}
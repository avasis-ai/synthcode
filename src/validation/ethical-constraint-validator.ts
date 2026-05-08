import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type AgentContext = {
  history: Message[];
  current_state: Record<string, unknown>;
};

export type AgentAction = {
  type: "tool_call" | "text_generation" | "plan_step";
  payload: Record<string, unknown>;
};

export type EthicalViolationLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface EthicalValidationResult {
  isEthical: boolean;
  level: EthicalViolationLevel;
  message: string;
  details?: string;
}

export interface EthicalValidator {
  validate(context: AgentContext, action: AgentAction): EthicalValidationResult;
}

class EthicalConstraintValidatorChainBuilder {
  private validators: EthicalValidator[] = [];

  private constructor() {}

  static build(): EthicalConstraintValidatorChainBuilder {
    return new EthicalConstraintValidatorChainBuilder();
  }

  addValidator(validator: EthicalValidator): EthicalConstraintValidatorChainBuilder {
    this.validators.push(validator);
    return this;
  }

  build(): EthicalConstraintValidator {
    return new EthicalConstraintValidator(this.validators);
  }
}

class EthicalConstraintValidator {
  private validators: EthicalValidator[];

  constructor(validators: EthicalValidator[]) {
    this.validators = validators;
  }

  validate(context: AgentContext, action: AgentAction): EthicalValidationResult {
    let aggregateResult: EthicalValidationResult = {
      isEthical: true,
      level: "LOW",
      message: "All ethical constraints passed.",
    };

    for (const validator of this.validators) {
      const result = validator.validate(context, action);

      if (!result.isEthical) {
        if (result.level === "CRITICAL") {
          return {
            isEthical: false,
            level: "CRITICAL",
            message: `Critical ethical violation detected by ${validator.constructor.name}: ${result.message}`,
          };
        }

        if (result.level === "HIGH" && aggregateResult.level !== "CRITICAL") {
          aggregateResult = {
            isEthical: false,
            level: "HIGH",
            message: `High ethical concern detected by ${validator.constructor.name}: ${result.message}`,
          };
        }
      }
    }

    return aggregateResult;
  }
}

class DefaultEthicalValidator implements EthicalValidator {
  validate(context: AgentContext, action: AgentAction): EthicalValidationResult {
    if (action.type === "text_generation") {
      const text = action.payload as string;
      if (text.toLowerCase().includes("illegal activity")) {
        return {
          isEthical: false,
          level: "CRITICAL",
          message: "Content suggests illegal activity.",
        };
      }
      if (text.toLowerCase().includes("hate speech")) {
        return {
          isEthical: false,
          level: "HIGH",
          message: "Content contains potential hate speech.",
        };
      }
    }
    return {
      isEthical: true,
      level: "LOW",
      message: "No obvious ethical violations detected.",
    };
  }
}

class BiasDetectorValidator implements EthicalValidator {
  validate(context: AgentContext, action: AgentAction): EthicalValidationResult {
    const historyContent = context.history.map(m => m.content).join(" ");
    const actionPayload = JSON.stringify(action.payload);

    if (historyContent.toLowerCase().includes("racial bias") && action.type === "tool_call") {
      return {
        isEthical: false,
        level: "MEDIUM",
        message: "Action follows a pattern of potential racial bias observed in history.",
      };
    }
    return {
      isEthical: true,
      level: "LOW",
      message: "Bias check passed.",
    };
  }
}

export {
  EthicalConstraintValidatorChainBuilder,
  EthicalConstraintValidator,
  DefaultEthicalValidator,
  BiasDetectorValidator,
}
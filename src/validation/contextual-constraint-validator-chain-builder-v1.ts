import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

type ContextPayload = Record<string, unknown>;
type ValidatorFactory = (context: ContextPayload) => ((payload: any) => boolean);

export class ContextualConstraintValidatorChainBuilder {
    private validators: ValidatorFactory[] = [];

    constructor() {}

    addValidator(factory: ValidatorFactory): this {
        this.validators.push(factory);
        return this;
    }

    buildChain(): (context: ContextPayload) => ((payload: any) => boolean) {
        return (context: ContextPayload) => (payload: any) => {
            for (const factory of this.validators) {
                const validator = factory(context);
                if (!validator(payload)) {
                    return false;
                }
            }
            return true;
        };
    }

    compileValidator(): ((context: ContextPayload) => ((payload: any) => boolean)) {
        return this.buildChain();
    }
}
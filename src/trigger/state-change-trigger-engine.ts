import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface WorkflowContext {
  payload: any;
  history: Message[];
}

export interface Trigger {
  id: string;
  name: string;
  // The condition check function
  condition: (statePayload: any) => boolean;
  // The execution function (the workflow)
  execute: (context: WorkflowContext) => { triggered: boolean; context: WorkflowContext };
}

export class StateChangeTriggerEngine {
  private triggers: Trigger[] = [];

  registerTrigger(trigger: Trigger): void {
    this.triggers.push(trigger);
  }

  processStateUpdate(payload: any): { triggered: boolean; executedContext: WorkflowContext } {
    const initialContext: WorkflowContext = {
      payload: payload,
      history: [],
    };

    let overallTriggered = false;
    let lastContext: WorkflowContext = initialContext;

    for (const trigger of this.triggers) {
      if (trigger.condition(payload)) {
        const result = trigger.execute(lastContext);
        if (result.triggered) {
          overallTriggered = true;
          lastContext = result.context;
        } else {
          lastContext = { ...lastContext, payload: payload };
        }
      } else {
        lastContext = { ...lastContext, payload: payload };
      }
    }

    return {
      triggered: overallTriggered,
      executedContext: lastContext,
    };
  }
}
import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface PreconditionStep {
  stepName: string;
  condition: string;
  successAction: string;
  failureAction: string;
}

export interface PreconditionChain {
  steps: PreconditionStep[];
  initialGoal: string;
}

export class ToolCallPreconditionChainVisualizer {
  private chain: PreconditionChain;

  constructor(chain: PreconditionChain) {
    this.chain = chain;
  }

  private generateStepNode(step: PreconditionStep, stepIndex: number): string {
    return `  ${step.stepName} (Step ${stepIndex + 1}):\n    Condition: ${step.condition}\n    Success Path: ${step.successAction}\n    Failure Path: ${step.failureAction}`;
  }

  private generateGraphDefinition(): string {
    const steps = this.chain.steps;
    if (!steps || steps.length === 0) {
      return "graph TD\n    A[No Precondition Chain Defined]";
    }

    let mermaid = "graph TD\n";
    
    // Start Node
    mermaid += "    Start[Goal: " + this.chain.initialGoal + "] -->|Start Check| Step1";

    // Define nodes for each step
    let currentNodeId = "Step1";
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nodeId = `Step${i + 1}`;
      
      // Update the ID for the next iteration's start point
      if (i < steps.length - 1) {
        currentNodeId = nodeId;
      }

      mermaid += `\n    ${nodeId}["${step.stepName}"]\n`;
      mermaid += `    ${nodeId} -->|Condition Met: ${step.condition}| Success_${i + 1};\n`;
      mermaid += `    ${nodeId} -->|Condition Failed| Failure_${i + 1};\n`;

      // Success path leads to the next step or end
      if (i < steps.length - 1) {
        mermaid += `    Success_${i + 1} --> ${String.fromCharCode(65 + i + 1)}[Next Step Start] --> ${String.fromCharCode(65 + i + 2)}[${steps[i+1].stepName}]`;
      } else {
        mermaid += `    Success_${i + 1} --> End[Goal Achieved]`;
      }

      // Failure path leads to an error state
      mermaid += `    Failure_${i + 1} --> Error_${i + 1}[Failure: ${step.failureAction}]`;
    }

    // Define the final end node explicitly
    mermaid += "\n    End --> Final[Process Complete]";

    return mermaid;
  }

  public visualizeMermaid(): string {
    return this.generateGraphDefinition();
  }
}
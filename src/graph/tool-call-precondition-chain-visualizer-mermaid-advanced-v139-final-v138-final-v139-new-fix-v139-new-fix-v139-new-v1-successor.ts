import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type PreconditionChainStep =
  | { type: "action"; description: string; next: PreconditionChainStep[] }
  | { type: "condition"; condition: string; trueBranch: PreconditionChainStep[]; falseBranch: PreconditionChainStep[] }
  | { type: "loop_start"; loopId: string; body: PreconditionChainStep[]; exitCondition: string; next: PreconditionChainStep[] }
  | { type: "loop_end"; loopId: string; next: PreconditionChainStep[] }
  | { type: "terminal"; description: string };

export interface PreconditionChain {
  start: PreconditionChainStep;
}

class ToolCallPreconditionChainVisualizer {
  private readonly graphBuilder: {
    mermaidCode: string;
    nodeMap: Map<string, string>;
  } = {
    mermaidCode: "graph TD",
    nodeMap: new Map(),
  };

  private generateUniqueNodeId(prefix: string = "N") {
    let id = prefix + Math.random().toString(36).substring(2, 9);
    while (this.graphBuilder.nodeMap.has(id)) {
      id = prefix + Math.random().toString(36).substring(2, 9);
    }
    return id;
  }

  private addNode(id: string, label: string): void {
    this.graphBuilder.mermaidCode += `\n  ${id}["${label}"]`;
    this.graphBuilder.nodeMap.set(id, label);
  }

  private addLink(fromId: string, toId: string, label: string = ""): void {
    this.graphBuilder.mermaidCode += `\n  ${fromId} -->|${label}| ${toId}`;
  }

  private processStep(step: PreconditionChainStep, parentId: string): string {
    let currentId = this.generateUniqueNodeId("S");
    let mermaidCode = "";

    switch (step.type) {
      case "terminal":
        this.addNode(currentId, `Terminal: ${step.description}`);
        mermaidCode = currentId;
        break;

      case "action":
        this.addNode(currentId, `Action: ${step.description}`);
        let nextIds = step.next.map((nextStep) =>
          this.processStep(nextStep, currentId)
        );
        mermaidCode = currentId;
        nextIds.forEach((nextId, index) => {
          this.addLink(currentId, nextId, `Path ${index + 1}`);
        });
        break;

      case "condition":
        this.addNode(currentId, `Condition: ${step.condition}`);
        const trueBranchId = this.processStep(step.trueBranch[0], currentId);
        const falseBranchId = this.processStep(step.falseBranch[0], currentId);

        this.addLink(currentId, trueBranchId, "True");
        this.addLink(currentId, falseBranchId, "False");
        mermaidCode = currentId;
        break;

      case "loop_start":
        this.addNode(currentId, `LOOP START (${step.loopId})`);
        let loopBodyIds: string[] = [];
        let nextStepId = currentId;

        for (const bodyStep of step.body) {
          const bodyId = this.processStep(bodyStep, nextStepId);
          loopBodyIds.push(bodyId);
          nextStepId = bodyId;
        }

        // Link last body step back to the start of the loop body (or handle exit)
        const lastBodyId = loopBodyIds[loopBodyIds.length - 1];
        this.addLink(lastBodyId, currentId, "Loop Back"); // Simplified loop back for visualization
        
        // Handle exit path
        const exitStepId = this.processStep(step.next[0], currentId);
        this.addLink(currentId, exitStepId, "Exit");
        
        mermaidCode = currentId;
        break;

      case "loop_end":
        this.addNode(currentId, `LOOP END (${step.loopId})`);
        let nextEndId = currentId;
        
        // Link to the next sequential step
        if (step.next.length > 0) {
            const nextStepId = this.processStep(step.next[0], currentId);
            this.addLink(currentId, nextStepId, "Continue");
            nextEndId = nextStepId;
        }
        mermaidCode = currentId;
        break;
    }

    return mermaidCode;
  }

  public visualize(chain: PreconditionChain): string {
    this.graphBuilder.mermaidCode = "graph TD";
    this.graphBuilder.nodeMap.clear();

    const startId = this.processStep(chain.start, "START");

    return this.graphBuilder.mermaidCode;
  }
}

export { ToolCallPreconditionChainVisualizer };
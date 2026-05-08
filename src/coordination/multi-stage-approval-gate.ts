import { EventEmitter } from "node:events";

export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent = any;

export type ApprovalType = "human" | "system";

export enum GateStatus {
  PENDING = "PENDING",
  WAITING = "WAITING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface ApprovalGate {
  description: string;
  requiredApprovals: {
    approverId: string;
    type: ApprovalType;
  }[];
  failureCondition?: string;
}

export class MultiStageApprovalGate extends EventEmitter {
  private gateDefinition: ApprovalGate;
  private status: GateStatus;
  private requiredApprovals: Set<string>;
  private collectedApprovals: Map<string, string> = new Map();

  constructor(gateDefinition: ApprovalGate) {
    super();
    this.gateDefinition = gateDefinition;
    this.status = GateStatus.PENDING;
    this.requiredApprovals = new Set(
      gateDefinition.requiredApprovals.map((a) => a.approverId)
    );
  }

  public getStatus(): GateStatus {
    return this.status;
  }

  public getRequiredApprovalsCount(): number {
    return this.requiredApprovals.size;
  }

  public getCollectedApprovalsCount(): number {
    return this.collectedApprovals.size;
  }

  public recordApproval(approverId: string, evidence: string): boolean {
    if (this.status !== GateStatus.WAITING) {
      return false;
    }

    if (!this.requiredApprovals.has(approverId)) {
      return false;
    }

    if (this.collectedApprovals.has(approverId)) {
      return false;
    }

    this.collectedApprovals.set(approverId, evidence);
    
    const remaining = this.requiredApprovals.size - this.collectedApprovals.size;

    if (remaining === 0) {
      this.status = GateStatus.APPROVED;
      this.emit("approved");
      return true;
    }

    return true;
  }

  public rejectGate(reason: string): void {
    this.status = GateStatus.REJECTED;
    this.emit("rejected", reason);
  }

  public async awaitApproval(timeoutMs: number): Promise<void> {
    if (this.status === GateStatus.APPROVED) {
      return;
    }

    if (this.status === GateStatus.REJECTED) {
      throw new Error("Gate was previously rejected.");
    }

    this.status = GateStatus.WAITING;
    this.emit("waiting", this.gateDefinition.description);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.status === GateStatus.WAITING) {
          this.rejectGate(`Timeout reached after ${timeoutMs}ms.`);
          reject(new Error("Approval gate timed out."));
        } else {
          resolve();
        }
      }, timeoutMs);

      this.once("approved", () => {
        clearTimeout(timeoutId);
        resolve();
      });

      this.once("rejected", (reason: string) => {
        clearTimeout(timeoutId);
        reject(new Error(`Approval gate failed: ${reason}`));
      });
    });
  }
}
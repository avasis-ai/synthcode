import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NEEDS_REVISION = "NEEDS_REVISION",
}

export interface PolicyApproval {
  policyId: string;
  status: ApprovalStatus;
  feedback?: string;
  approver?: string;
}

export interface ApprovalRequest {
  requestId: string;
  actionDescription: string;
  requiredPolicies: string[];
  approvals: PolicyApproval[];
}

export class ApprovalGateManager {
  private request: ApprovalRequest;

  constructor(request: ApprovalRequest) {
    this.request = request;
  }

  public getStatus(): ApprovalStatus {
    const statuses = this.request.approvals.map(a => a.status);
    
    if (statuses.includes(ApprovalStatus.REJECTED)) {
      return ApprovalStatus.REJECTED;
    }
    if (statuses.includes(ApprovalStatus.NEEDS_REVISION)) {
      return ApprovalStatus.NEEDS_REVISION;
    }
    if (statuses.every(s => s === ApprovalStatus.APPROVED)) {
      return ApprovalStatus.APPROVED;
    }
    return ApprovalStatus.PENDING;
  }

  public processFeedback(policyId: string, status: ApprovalStatus, feedback: string, approver: string): ApprovalGateManager {
    const updatedApprovals = this.request.approvals.map(approval => {
      if (approval.policyId === policyId) {
        return {
          ...approval,
          status: status,
          feedback: feedback,
          approver: approver,
        };
      }
      return approval;
    });

    const newRequest: ApprovalRequest = {
      ...this.request,
      approvals: updatedApprovals,
    };

    // Re-instantiate or update the internal state for immutability pattern
    // Since we are modifying the state, we return a new instance for functional style
    return new ApprovalGateManager(newRequest);
  }

  public checkApprovals(currentStatus: ApprovalStatus): {
    isApproved: boolean;
    status: ApprovalStatus;
    contextUpdate: TextBlock;
  } {
    const isApproved = currentStatus === ApprovalStatus.APPROVED;
    
    const contextUpdate: TextBlock = {
      type: "text",
      text: `[GOVERNANCE GATE CHECK] Action Status: ${currentStatus}. Execution is ${isApproved ? "AUTHORIZED" : "BLOCKED"} until all required policies are satisfied.`,
    };

    return {
      isApproved: isApproved,
      status: currentStatus,
      contextUpdate: contextUpdate,
    };
  }
}
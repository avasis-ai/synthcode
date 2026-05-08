import { describe, it, expect, vi } from "vitest";
import { ApprovalGateManager, ApprovalStatus, PolicyApproval, ApprovalRequest } from "../src/governance/approval-gate-manager";

describe("ApprovalGateManager", () => {
  it("should initialize correctly and handle initial approval status", () => {
    const manager = new ApprovalGateManager();
    expect(manager).toBeDefined();
    expect(manager.getInitialStatus()).toBe(ApprovalStatus.PENDING);
  });

  it("should update status to APPROVED when all required policies are approved", async () => {
    const manager = new ApprovalGateManager();
    const request: ApprovalRequest = {
      requestId: "req-123",
      actionDescription: "Deploy new feature",
      requiredPolicies: ["policy-a", "policy-b"],
      approvals: [
        { policyId: "policy-a", status: ApprovalStatus.APPROVED },
        { policyId: "policy-b", status: ApprovalStatus.APPROVED },
      ],
    };

    const result = await manager.processRequest(request);
    expect(result.finalStatus).toBe(ApprovalStatus.APPROVED);
    expect(result.message).toContain("All required policies approved");
  });

  it("should update status to NEEDS_REVISION if any required policy is rejected or needs revision", async () => {
    const manager = new ApprovalGateManager();
    const request: ApprovalRequest = {
      requestId: "req-456",
      actionDescription: "Update database schema",
      requiredPolicies: ["policy-x", "policy-y"],
      approvals: [
        { policyId: "policy-x", status: ApprovalStatus.APPROVED },
        { policyId: "policy-y", status: ApprovalStatus.REJECTED, feedback: "Schema change too drastic." },
      ],
    };

    const result = await manager.processRequest(request);
    expect(result.finalStatus).toBe(ApprovalStatus.NEEDS_REVISION);
    expect(result.message).toContain("Policy 'policy-y' rejected");
  });
});
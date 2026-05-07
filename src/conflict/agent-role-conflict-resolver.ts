export type Message = any
export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[]
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any

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

export type LoopEvent = any

export type AgentRole = {
  name: string;
  priority: number;
  scope: "global" | "local";
  conflictWeight: number;
}

export type ConflictType = "action_conflict" | "interpretation_conflict" | "plan_conflict";

export interface ConflictProposal {
  agentName: string;
  role: AgentRole;
  conflictType: ConflictType;
  proposedAction: string;
  details: Record<string, unknown>;
}

export class ConflictResolver {
  private roles: Map<string, AgentRole>;

  constructor(initialRoles: AgentRole[]) {
    this.roles = new Map(initialRoles.map(role => [role.name, role]));
  }

  getRole(agentName: string): AgentRole | undefined {
    return this.roles.get(agentName);
  }

  /**
   * Resolves a list of conflicting proposals into a single, coherent plan.
   * @param proposals The list of conflicting proposals.
   * @returns A synthesized, conflict-free plan string.
   */
  resolve(proposals: ConflictProposal[]): string {
    if (proposals.length === 0) {
      return "No conflicts detected.";
    }

    const groupedConflicts = new Map<ConflictType, ConflictProposal[]>();
    for (const proposal of proposals) {
      if (!groupedConflicts.has(proposal.conflictType)) {
        groupedConflicts.set(proposal.conflictType, []);
      }
      groupedConflicts.get(proposal.conflictType)!.push(proposal);
    }

    let resolvedPlan: string[] = [];

    for (const [conflictType, conflictProposals] of groupedConflicts.entries()) {
      const weightedVotes: { proposal: ConflictProposal; weight: number }[] = [];

      for (const proposal of conflictProposals) {
        const role = proposal.role;
        if (!role) continue;

        // Calculate weight: Base weight * Role Priority * Conflict Weight
        const weight = role.conflictWeight * role.priority;
        weightedVotes.push({ proposal, weight });
      }

      if (weightedVotes.length === 0) {
        continue;
      }

      // Sort by weight (highest weight wins)
      weightedVotes.sort((a, b) => b.weight - a.weight);

      const winningProposal = weightedVotes[0].proposal;
      
      let resolutionText = `[Conflict Resolved: ${conflictType.toUpperCase()}]\n`;
      resolutionText += `Winning Agent (${winningProposal.agentName}): ${winningProposal.proposedAction}\n`;
      resolutionText += `(Reason: Highest weighted priority based on role scope and conflict weight.)`;
      
      resolvedPlan.push(resolutionText);
    }

    return resolvedPlan.join("\n\n---\n\n");
  }
}

export { ConflictResolver };
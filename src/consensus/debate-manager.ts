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

export type DebateRoundState = "PROPOSAL" | "CHALLENGE" | "EVIDENCE_SUBMISSION" | "SCORING" | "RESOLVED";

export interface Participant {
  id: string;
  name: string;
  initialHypothesis: string;
  evidenceWeight: number;
}

export interface Hypothesis {
  id: string;
  proposerId: string;
  statement: string;
  supportEvidence: Record<string, number>;
}

export class DebateManager {
  private participants: Map<string, Participant>;
  private hypotheses: Map<string, Hypothesis>;
  private roundState: DebateRoundState;
  private currentRoundEvidence: Record<string, ContentBlock[]>;

  constructor(participants: Participant[]) {
    this.participants = new Map(participants.map(p => [p.id, p]));
    this.hypotheses = new Map<string, Hypothesis>();
    this.roundState = "PROPOSAL";
    this.currentRoundEvidence = {};
  }

  public initializeDebate(initialHypotheses: { id: string; proposerId: string; statement: string }[]): void {
    this.hypotheses.clear();
    initialHypotheses.forEach(h => {
      this.hypotheses.set(h.id, {
        id: h.id,
        proposerId: h.proposerId,
        statement: h.statement,
        supportEvidence: {},
      });
    });
    this.roundState = "CHALLENGE";
    this.currentRoundEvidence = {};
  }

  public getRoundState(): DebateRoundState {
    return this.roundState;
  }

  public getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  public submitChallenge(challengerId: string, targetHypothesisId: string, challengePayload: string): { success: boolean; message: string } {
    if (this.roundState !== "CHALLENGE") {
      return { success: false, message: "Cannot challenge. Current round is not CHALLENGE." };
    }

    const targetHypothesis = this.hypotheses.get(targetHypothesisId);
    if (!targetHypothesis) {
      return { success: false, message: "Hypothesis not found." };
    }

    // In a real system, this would log the challenge and potentially trigger a rebuttal round.
    console.log(`Challenge submitted by ${challengerId} against ${targetHypothesisId}: ${challengePayload}`);
    return { success: true, message: `Challenge registered against ${targetHypothesisId}. Proceed to evidence submission.` };
  }

  public submitEvidence(evidenceSubmitterId: string, hypothesisId: string, evidencePayload: ContentBlock[]): { success: boolean; message: string } {
    if (this.roundState !== "EVIDENCE_SUBMISSION") {
      return { success: false, message: "Cannot submit evidence. Current round is not EVIDENCE_SUBMISSION." };
    }

    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      return { success: false, message: "Hypothesis not found." };
    }

    // Aggregate evidence for the hypothesis
    if (!this.currentRoundEvidence[hypothesisId]) {
      this.currentRoundEvidence[hypothesisId] = [];
    }
    this.currentRoundEvidence[hypothesisId]!.push(...evidencePayload);

    // Update support evidence count (simplified scoring)
    const evidenceCount = evidencePayload.length;
    const currentCount = hypothesis.supportEvidence[evidenceSubmitterId] || 0;
    hypothesis.supportEvidence[evidenceSubmitterId] = currentCount + evidenceCount;

    return { success: true, message: `Evidence successfully submitted for ${hypothesisId}.` };
  }

  public advanceRound(nextState: DebateRoundState): { success: boolean; message: string } {
    if (nextState === "SCORING") {
      this.roundState = "SCORING";
      return { success: true, message: "Entering scoring phase. Consensus calculation initiated." };
    }
    if (nextState === "RESOLVED") {
      this.roundState = "RESOLVED";
      return { success: true, message: "Debate concluded. Final consensus reached." };
    }
    this.roundState = nextState;
    return { success: true, message: `Debate advanced to ${nextState}.` };
  }

  public calculateConsensusScore(): { winnerId: string; score: number; details: Record<string, number> } {
    if (this.roundState !== "SCORING") {
      throw new Error("Cannot calculate score. Debate must be in SCORING round.");
    }

    let totalScore: Record<string, number> = {};
    let maxScore = -1;
    let winnerId = "";

    this.hypotheses.forEach(hypothesis => {
      let score = 0;
      let evidenceDetails: Record<string, number> = {};

      // Calculate weighted score based on evidence submission
      Object.keys(hypothesis.supportEvidence).forEach(submitterId => {
        const weight = this.participants.get(submitterId)?.evidenceWeight || 1;
        const count = hypothesis.supportEvidence[submitterId] || 0;
        const weightedContribution = count * weight;
        score += weightedContribution;
        evidenceDetails[submitterId] = weightedContribution;
      });

      totalScore[hypothesis.id] = score;
      
      if (score > maxScore) {
        maxScore = score;
        winnerId = hypothesis.id;
      }
    });

    return {
      winnerId: winnerId,
      score: maxScore,
      details: totalScore,
    };
  }
}
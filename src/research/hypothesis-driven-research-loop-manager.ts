import { EventEmitter } from "node:events";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_result: ToolResultMessage };

interface ResearchState {
  currentHypothesis: string;
  evidenceSet: string[];
  confidenceScore: number;
  iterationCount: number;
  history: Message[];
}

export class HypothesisDrivenResearchLoopManager extends EventEmitter {
  private state: ResearchState;
  private readonly initialQuery: string;
  private readonly confidenceThreshold: number;

  constructor(initialQuery: string, confidenceThreshold: number = 0.8) {
    super();
    this.initialQuery = initialQuery;
    this.confidenceThreshold = confidenceThreshold;
    this.state = {
      currentHypothesis: "",
      evidenceSet: [],
      confidenceScore: 0.0,
      iterationCount: 0,
      history: [],
    };
  }

  private async generateInitialHypotheses(query: string): Promise<string> {
    return `Initial hypothesis generated based on query: ${query}.`;
  }

  private async gatherEvidence(hypothesis: string): Promise<string[]> {
    return [
      `Evidence 1: Supports ${hypothesis}. Source A.`,
      `Evidence 2: Contradicts ${hypothesis}. Source B.`,
    ];
  }

  private assessEvidence(evidence: string[]): { score: number; conflict: string } {
    let score = 0.0;
    let conflict = "";
    if (evidence.length > 0) {
      score = Math.min(1.0, evidence.length * 0.1 + 0.5);
      conflict = evidence.filter(e => e.includes("Contradicts")).join(" | ");
    }
    return { score, conflict };
  }

  private refineHypothesis(currentHypothesis: string, evidence: string[], assessment: { score: number; conflict: string }): string {
    if (assessment.score < 0.5) {
      return `Hypothesis remains weak. Need more diverse evidence. Current: ${currentHypothesis}`;
    }
    return `Refined hypothesis based on evidence and assessment. Confidence increased.`;
  }

  public async runLoop(): Promise<ResearchState> {
    let currentHypothesis = await this.generateInitialHypotheses(this.initialQuery);
    this.state.currentHypothesis = currentHypothesis;
    this.state.iterationCount = 0;

    while (this.state.confidenceScore < this.confidenceThreshold) {
      this.state.iterationCount += 1;
      
      const evidence = await this.gatherEvidence(currentHypothesis);
      this.state.evidenceSet = evidence;

      const assessment = this.assessEvidence(evidence);
      
      const nextHypothesis = this.refineHypothesis(currentHypothesis, evidence, assessment);

      this.state.currentHypothesis = nextHypothesis;
      this.state.confidenceScore = assessment.score;

      this.emit("loop_step", {
        iteration: this.state.iterationCount,
        hypothesis: this.state.currentHypothesis,
        confidence: this.state.confidenceScore,
        assessment: assessment,
      });

      if (this.state.iterationCount >= 5) {
        break;
      }
    }
    return this.state;
  }

  public injectEvidence(evidence: string[]): void {
    this.state.evidenceSet.push(...evidence);
    this.emit("evidence_injected", { evidence });
  }

  public overrideHypothesis(newHypothesis: string): void {
    this.state.currentHypothesis = newHypothesis;
    this.state.confidenceScore = 0.1;
    this.emit("hypothesis_overridden", { newHypothesis });
  }

  public getState(): ResearchState {
    return { ...this.state };
  }
}
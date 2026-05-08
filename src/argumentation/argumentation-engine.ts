import { Message } from "./types.js";

export interface Premise {
  id: string;
  claim: string;
  evidenceWeight: number;
  supportingArguments: string[];
  contradictoryArguments: string[];
}

export interface Argument {
  source: string;
  claim: string;
  evidence: string;
  support: string[];
  contradiction: string[];
}

export interface DebateContext {
  initialClaim: string;
  participants: string[];
  premises: Premise[];
  history: Message[];
}

export class ArgumentationEngine {
  private context: DebateContext;

  constructor(initialContext: DebateContext) {
    this.context = initialContext;
  }

  private evaluateArgumentStrength(argument: Argument): number {
    let strength = 0;
    strength += argument.evidence.length * 0.5;
    strength += argument.support.length * 0.3;
    strength -= argument.contradiction.length * 0.2;
    return Math.max(0, strength);
  }

  private updateContext(newArgument: Argument): DebateContext {
    const newPremise: Premise = {
      id: `P-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      claim: newArgument.claim,
      evidenceWeight: this.evaluateArgumentStrength(newArgument),
      supportingArguments: [...(this.context.premises.flatMap(p => p.supportingArguments)), ...newArgument.support],
      contradictoryArguments: [...(this.context.premises.flatMap(p => p.contradictoryArguments)), ...newArgument.contradiction],
    };

    const updatedPremises = [...this.context.premises, newPremise];

    return {
      initialClaim: this.context.initialClaim,
      participants: this.context.participants,
      premises: updatedPremises,
      history: [...this.context.history],
    };
  }

  public processTurn(turnMessage: Message): { newContext: DebateContext; analysis: string } {
    const argument: Argument = {
      source: "Agent",
      claim: turnMessage.content,
      evidence: "Analyzed content",
      support: [],
      contradiction: [],
    };

    const strength = this.evaluateArgumentStrength(argument);
    const analysis = `Processed turn. Strength score: ${strength.toFixed(2)}. The argument claims "${turnMessage.content}" and is evaluated against existing premises.`;

    const newContext = this.updateContext(argument);

    return { newContext, analysis };
  }

  public runDebateFlow(initialContext: DebateContext, turns: Message[]): { finalContext: DebateContext; report: string } {
    let currentContext = initialContext;
    let report: string[] = [];

    for (const turn of turns) {
      const { newContext, analysis } = this.processTurn(turn);
      currentContext = newContext;
      report.push(`--- Turn Processed ---`);
      report.push(analysis);
    }

    const finalReport = this.generateConsensusReport(currentContext);

    return { finalContext: currentContext, report: finalReport };
  }

  private generateConsensusReport(context: DebateContext): string {
    const premiseSummary = context.premises.map(p =>
      `[${p.id}] Claim: ${p.claim}. Weight: ${p.evidenceWeight.toFixed(2)}. Supports: ${p.supportingArguments.length}. Contradicts: ${p.contradictoryArguments.length}.`
    ).join('\n');

    const consensus = context.premises.reduce((acc, p) => {
      if (p.evidenceWeight > 0.5) {
        acc += `\n* Strong Premise: ${p.claim} (Weight: ${p.evidenceWeight.toFixed(2)})`;
      }
      return acc;
    }, "No clear consensus reached.");

    return `\n--- DEBATE CONSENSUS REPORT ---\nInitial Claim: ${context.initialClaim}\n\n${premiseSummary}\n\nConclusion:\n${consensus}`;
  }
}
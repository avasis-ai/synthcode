import { Message } from "./types";

type PatternStep =
  | { type: "message_type"; messageType: (msg: Message) => boolean }
  | { type: "window"; durationMs: number }
  | { type: "sequence_end" };

export interface Pattern {
  steps: PatternStep[];
}

type Action = (matchedEvents: Message[]) => void;

interface MatcherState {
  patternId: string;
  currentStepIndex: number;
  history: Message[];
  startTime: number;
}

export class StreamPatternMatcher {
  private activePatterns: Map<string, { pattern: Pattern; state: MatcherState; action: Action }>;

  constructor() {
    this.activePatterns = new Map();
  }

  subscribe(patternId: string, pattern: Pattern, action: Action): void {
    if (this.activePatterns.has(patternId)) {
      throw new Error(`Pattern ID ${patternId} is already subscribed.`);
    }

    const initialState: MatcherState = {
      patternId: patternId,
      currentStepIndex: 0,
      history: [],
      startTime: Date.now(),
    };

    this.activePatterns.set(patternId, { pattern, state: initialState, action });
  }

  private checkWindowTimeout(state: MatcherState, nextStep: PatternStep): boolean {
    if (nextStep.type === "window") {
      const windowStep = nextStep as { type: "window"; durationMs: number };
      const elapsed = Date.now() - state.startTime;
      return elapsed > windowStep.durationMs;
    }
    return false;
  }

  private advanceState(state: MatcherState, event: Message, pattern: Pattern): { newState: MatcherState; matched: boolean } {
    const nextStep = pattern.steps[state.currentStepIndex];

    if (nextStep.type === "message_type") {
      const step = nextStep as { type: "message_type"; messageType: (msg: Message) => boolean };
      if (step.messageType(event)) {
        const newState: MatcherState = {
          patternId: state.patternId,
          currentStepIndex: state.currentStepIndex + 1,
          history: [...state.history, event],
          startTime: state.startTime,
        };
        return { newState, matched: true };
      }
    } else if (nextStep.type === "window") {
      // Window steps do not consume events, they just check time.
      // The event processing logic handles the time check before calling this.
      return { newState: state, matched: false };
    }
    
    // If the event doesn't match the expected step, reset the state for this pattern
    return { newState: state, matched: false };
  }

  private resetState(patternId: string): void {
    this.activePatterns.delete(patternId);
  }

  processEvent(event: Message): void {
    const completedPatterns: string[] = [];

    for (const [patternId, patternData] of this.activePatterns.entries()) {
      const { pattern, state, action } = patternData;
      
      // 1. Check for window timeouts first
      if (state.currentStepIndex < pattern.steps.length) {
        const currentStep = pattern.steps[state.currentStepIndex];
        if (currentStep.type === "window") {
          const windowStep = currentStep as { type: "window"; durationMs: number };
          if (Date.now() - state.startTime > windowStep.durationMs) {
            console.log(`[Matcher] Timeout detected for pattern ${patternId}. Resetting.`);
            completedPatterns.push(patternId);
            continue;
          }
        }
      }

      // 2. Process the event against the current step
      if (state.currentStepIndex < pattern.steps.length) {
        const nextStep = pattern.steps[state.currentStepIndex];
        
        if (nextStep.type === "message_type") {
          const step = nextStep as { type: "message_type"; messageType: (msg: Message) => boolean };
          if (step.messageType(event)) {
            // Event matches the expected step type
            const { newState, matched } = this.advanceState(state, event, pattern);
            
            if (matched) {
              let newState = newState;
              let completed = false;

              // Check if this successful step completes the pattern
              if (newState.currentStepIndex === pattern.steps.length - 1) {
                // Check if the last step is a sequence end marker
                const lastStep = pattern.steps[pattern.steps.length - 1];
                if (lastStep.type === "sequence_end") {
                    // The pattern is complete
                    action(newState.history);
                    completed = true;
                    newState = { ...newState, currentStepIndex: 0, history: [], startTime: Date.now() }; // Reset state
                    completedPatterns.push(patternId);
                }
              }
              
              // Update state only if not marked for immediate reset due to completion
              if (!completedPatterns.includes(patternId)) {
                this.activePatterns.set(patternId, { pattern, state: newState, action });
              }
            } else {
                // Event did not match the current step, but we keep the state unless it was a window step
                // For simplicity, we only reset on timeout or successful completion.
            }
        }
      }
    }

    // 3. Handle resets (timeouts or completions)
    completedPatterns.forEach(id => this.resetState(id));
  }
}
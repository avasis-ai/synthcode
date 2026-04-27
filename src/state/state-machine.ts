import { Message, ToolResultMessage } from "./types";

type State = string;
type Input = any;
type Result = any;

type TransitionGraph<S extends State, I = any, N extends State> = {
  [currentState: string]: {
    [input: string]: {
      nextState: N;
      handler: (currentState: S, input: I, result: R) => Promise<{ nextState: N; output: any }>;
    };
  };
};

export class StateMachine<S extends State, I = any, R = any> {
  private graph: Record<string, Record<string, { nextState: string; handler: (currentState: S, input: I, result: R) => Promise<{ nextState: string; output: any }>}>;
  private initialState: S;

  constructor(initialState: S, graph: Record<string, Record<string, { nextState: string; handler: (currentState: S, input: I, result: R) => Promise<{ nextState: string; output: any }>}>) {
    this.initialState = initialState;
    this.graph = graph;
  }

  public getCurrentState(): S {
    return this.initialState;
  }

  public async transition(
    currentState: S,
    input: I,
    result: R
  ): Promise<{ nextState: string; output: any }> {
    const stateTransitions = this.graph[currentState];

    if (!stateTransitions) {
      throw new Error(`No transitions defined for state: ${currentState}`);
    }

    // Assuming input can be serialized to a string key for lookup
    const inputKey = String(input);
    const transition = stateTransitions[inputKey];

    if (!transition) {
      throw new Error(`Invalid transition: No handler found for input '${inputKey}' in state '${currentState}'`);
    }

    return transition.handler(currentState, input, result);
  }
}
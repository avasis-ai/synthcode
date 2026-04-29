import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type SchemaResolver = (schemaName: string) => Promise<{ schema: any; description: string }>;
type StateManager = (state: Record<string, any>, toolCallId: string, result: any) => Promise<Record<string, any>>;
type ConstraintChecker = (context: ValidationContext, toolCall: ToolUseBlock, currentState: Record<string, any>) => { isValid: boolean; reason?: string };

export class ValidationContext {
  private schemaResolver: SchemaResolver;
  private stateManager: StateManager;
  private constraintChecker: ConstraintChecker;
  private history: Message[];

  constructor(
    schemaResolver: SchemaResolver,
    stateManager: StateManager,
    constraintChecker: ConstraintChecker
  ) {
    this.schemaResolver = schemaResolver;
    this.stateManager = stateManager;
    this.constraintChecker = constraintChecker;
    this.history = [];
  }

  public getHistory(): Message[] {
    return this.history;
  }

  public addMessage(message: Message): void {
    this.history.push(message);
  }

  public async validateToolCallSequence(
    toolCalls: ToolUseBlock[],
    initialState: Record<string, any>
  ): Promise<{ isValid: boolean; finalState: Record<string, any>; errors: string[] }> {
    let currentState: Record<string, any> = { ...initialState };
    const errors: string[] = [];

    for (const toolCall of toolCalls) {
      // 1. Schema Validation (Conceptual step)
      try {
        await this.schemaResolver(toolCall.name);
      } catch (e) {
        errors.push(`Schema resolution failed for tool ${toolCall.name}: ${(e as Error).message}`);
        return { isValid: false, finalState: currentState, errors };
      }

      // 2. Constraint Validation
      const { isValid: isConstraintValid, reason: constraintReason } = this.constraintChecker(
        this,
        toolCall,
        currentState
      );
      if (!isConstraintValid) {
        errors.push(`Constraint violation for tool ${toolCall.name}: ${constraintReason}`);
        return { isValid: false, finalState: currentState, errors };
      }

      // 3. State Update Simulation (Requires a result to update state, but we simulate the call)
      // In a real scenario, we'd await the tool execution result here.
      // For context setup, we assume a successful execution path for state progression.
      const mockResult: any = { success: true, output: "Mock result" };
      try {
        currentState = await this.stateManager(currentState, toolCall.id, mockResult);
      } catch (e) {
        errors.push(`State management failed after tool ${toolCall.name}: ${(e as Error).message}`);
        return { isValid: false, finalState: currentState, errors };
      }
    }

    return { isValid: true, finalState: currentState, errors: [] };
  }
}

export function createValidationContext(
  schemaResolver: SchemaResolver,
  stateManager: StateManager,
  constraintChecker: ConstraintChecker
): ValidationContext {
  return new ValidationContext(schemaResolver, stateManager, constraintChecker);
}
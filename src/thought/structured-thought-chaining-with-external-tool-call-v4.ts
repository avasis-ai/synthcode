import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ToolName = string;
type ToolInput = Record<string, unknown>;

interface ToolDefinition {
    name: ToolName;
    description: string;
    parameters: Record<string, any>;
}

interface ToolExecutor {
    execute(toolName: ToolName, input: ToolInput): Promise<string>;
}

type StructuredThoughtStep =
    | { type: "thought"; thinking: string }
    | { type: "tool_call"; toolName: ToolName; input: ToolInput };

export class StructuredThoughtChainer {
    private toolExecutor: ToolExecutor;
    private toolDefinitions: Record<ToolName, ToolDefinition>;

    constructor(toolExecutor: ToolExecutor, toolDefinitions: Record<ToolName, ToolDefinition>) {
        this.toolExecutor = toolExecutor;
        this.toolDefinitions = toolDefinitions;
    }

    private async executeToolCall(step: { type: "tool_call"; toolName: ToolName; input: ToolInput }): Promise<string> {
        const definition = this.toolDefinitions[step.toolName];
        if (!definition) {
            throw new Error(`Tool definition not found for: ${step.toolName}`);
        }
        console.log(`Executing tool: ${step.toolName} with input:`, step.input);
        return await this.toolExecutor.execute(step.toolName, step.input);
    }

    private async processStep(
        currentContext: { messages: Message[]; context: Record<string, unknown> },
        step: StructuredThoughtStep
    ): Promise<{ nextContext: { messages: Message[]; context: Record<string, unknown> }, result: Message }> {
        let nextContext = { ...currentContext };
        let resultMessage: Message;

        if (step.type === "thought") {
            const thinkingStep = step as { type: "thought"; thinking: string };
            const thinkingBlock: ThinkingBlock = { type: "thinking", thinking: thinkingStep.thinking };
            const thoughtMessage: AssistantMessage = { role: "assistant", content: [thinkingBlock] };

            nextContext.messages = [...currentContext.messages, thoughtMessage];
            resultMessage = thoughtMessage;
        } else if (step.type === "tool_call") {
            const toolCallStep = step as { type: "tool_call"; toolName: ToolName; input: ToolInput };
            
            const toolUseBlock: ToolUseBlock = {
                type: "tool_use",
                id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: toolCallStep.toolName,
                input: toolCallStep.input,
            };

            const toolUseMessage: AssistantMessage = { role: "assistant", content: [toolUseBlock] };
            
            nextContext.messages = [...currentContext.messages, toolUseMessage];
            
            try {
                const toolResultContent = await this.executeToolCall(step);
                
                const toolResultMessage: ToolResultMessage = {
                    role: "tool",
                    tool_use_id: toolUseMessage.content[0].id,
                    content: toolResultContent,
                };

                nextContext.messages = [...nextContext.messages, toolResultMessage];
                
                // Inject result into context for subsequent steps
                nextContext.context[`tool_result_${toolCallStep.toolName}`] = toolResultContent;
                
                resultMessage = toolResultMessage;

            } catch (error) {
                const errorMessage: string = `Tool execution failed for ${toolCallStep.toolName}: ${error instanceof Error ? error.message : String(error)}`;
                const toolResultMessage: ToolResultMessage = {
                    role: "tool",
                    tool_use_id: toolUseMessage.content[0].id,
                    content: errorMessage,
                    is_error: true,
                };
                nextContext.messages = [...nextContext.messages, toolResultMessage];
                resultMessage = toolResultMessage;
            }
        } else {
            throw new Error("Unknown structured thought step type.");
        }

        return { nextContext, result: resultMessage };
    }

    public async chain(
        initialMessages: Message[],
        initialContext: Record<string, unknown>,
        steps: StructuredThoughtStep[]
    ): Promise<{ finalContext: { messages: Message[]; context: Record<string, unknown> }, finalResult: Message[] }> {
        let currentContext: { messages: Message[]; context: Record<string, unknown> } = {
            messages: [...initialMessages],
            context: { ...initialContext }
        };
        
        const finalResults: Message[] = [];

        for (const step of steps) {
            const { nextContext, result } = await this.processStep(currentContext, step);
            currentContext = nextContext;
            finalResults.push(result);
        }

        return { finalContext: currentContext, finalResult: finalResults };
    }
}
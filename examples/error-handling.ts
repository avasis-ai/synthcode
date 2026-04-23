/**
 * Error Handling & Graceful Degradation Example
 *
 * This example demonstrates robust error handling patterns for autonomous agents:
 * 1. Tool-level error recovery with retries
 * 2. Circuit breaker pattern for failing tools
 * 3. Graceful degradation when tools are unavailable
 * 4. Structured error logging for debugging
 */

import { Agent, agentLoop, BashTool, FileReadTool, WebFetchTool } from "@avasis-ai/synthcode";
import { anthropic } from "@avasis-ai/synthcode/llm";
import { InMemoryStore } from "@avasis-ai/synthcode/memory";
import { ToolVerifier } from "@avasis-ai/synthcode/tools";

interface ErrorContext {
  toolName: string;
  timestamp: number;
  error: Error;
  retryCount: number;
  maxRetries: number;
}

/**
 * Simple error logger for autonomous operation
 */
class ErrorLogger {
  private errors: ErrorContext[] = [];
  private maxLogSize = 100;

  log(context: ErrorContext) {
    this.errors.push(context);
    if (this.errors.length > this.maxLogSize) {
      this.errors.shift();
    }

    console.error(`[${context.toolName}] ${context.error.message} (attempt ${context.retryCount}/${context.maxRetries})`);
  }

  getErrors(toolName?: string): ErrorContext[] {
    if (toolName) {
      return this.errors.filter(e => e.toolName === toolName);
    }
    return [...this.errors];
  }

  clear() {
    this.errors = [];
  }
}

/**
 * Circuit breaker pattern - temporarily disables tools that fail repeatedly
 */
class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailureTime: Map<string, number> = new Map();
  private threshold = 3;
  private timeout = 60000; // 1 minute cooldown

  shouldAllow(toolName: string): boolean {
    const failures = this.failures.get(toolName) || 0;
    const lastFailure = this.lastFailureTime.get(toolName) || 0;
    const now = Date.now();

    // Reset after timeout
    if (failures >= this.threshold && now - lastFailure > this.timeout) {
      this.failures.delete(toolName);
      this.lastFailureTime.delete(toolName);
      return true;
    }

    // Block if threshold exceeded
    if (failures >= this.threshold) {
      console.warn(`[CircuitBreaker] Tool ${toolName} is temporarily blocked due to repeated failures`);
      return false;
    }

    return true;
  }

  recordFailure(toolName: string) {
    const failures = (this.failures.get(toolName) || 0) + 1;
    this.failures.set(toolName, failures);
    this.lastFailureTime.set(toolName, Date.now());
  }

  recordSuccess(toolName: string) {
    this.failures.delete(toolName);
    this.lastFailureTime.delete(toolName);
  }
}

/**
 * Wrap a tool with retry logic and circuit breaking
 */
function createResilientTool(
  tool: any,
  logger: ErrorLogger,
  breaker: CircuitBreaker,
  maxRetries: number = 3
): any {
  const originalExecute = tool.execute.bind(tool);

  return {
    ...tool,
    async execute(...args: any[]) {
      if (!breaker.shouldAllow(tool.name)) {
        throw new Error(`Tool ${tool.name} is temporarily unavailable (circuit breaker tripped)`);
      }

      let lastError: Error | undefined;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await originalExecute(...args);
          breaker.recordSuccess(tool.name);
          return result;
        } catch (error) {
          lastError = error as Error;
          logger.log({
            toolName: tool.name,
            timestamp: Date.now(),
            error: lastError,
            retryCount: attempt,
            maxRetries,
          });

          // Don't retry on certain errors
          if (lastError.message.includes("permission denied") ||
              lastError.message.includes("not found")) {
            break;
          }

          // Exponential backoff
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      breaker.recordFailure(tool.name);
      throw lastError;
    },
  };
}

/**
 * Main example - autonomous agent with error resilience
 */
async function main() {
  const logger = new ErrorLogger();
  const breaker = new CircuitBreaker();
  const memory = new InMemoryStore();

  // Create tools with resilience wrapper
  const bashTool = createResilientTool(new BashTool(), logger, breaker, 3);
  const fileTool = createResilientTool(new FileReadTool(), logger, breaker, 2);
  const webTool = createResilientTool(new WebFetchTool(), logger, breaker, 2);

  const agent = new Agent({
    model: anthropic("claude-3-5-sonnet-20241022"),
    tools: [bashTool, fileTool, webTool],
    systemPrompt: `You are an autonomous agent with robust error handling.

When a tool fails:
1. Try to understand the error message
2. Attempt recovery (e.g., create missing directories, use alternative tools)
3. If a tool is unavailable (circuit breaker), skip that task or use alternatives
4. Log all errors for debugging

Be resilient. Some failures are expected. Focus on what you can accomplish.`,
    memory,
  });

  // Run autonomous loop with graceful error handling
  try {
    const result = await agentLoop(agent, {
      userInput: "Check the current directory structure, create a summary, and save it to workspace/log.txt",
      maxTurns: 10,
    });

    console.log("\n=== Task Complete ===");
    console.log(`Final status: ${result.done ? "Success" : "Incomplete"}`);

    // Log errors that occurred
    const errors = logger.getErrors();
    if (errors.length > 0) {
      console.log(`\n=== Errors Encountered (${errors.length}) ===`);
      errors.forEach(err => {
        console.log(`- ${err.toolName}: ${err.error.message}`);
      });
    }
  } catch (error) {
    console.error("\n=== Fatal Error ===");
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

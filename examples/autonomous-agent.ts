/**
 * Autonomous Agent Example
 *
 * This example shows how to use SynthCode for fully autonomous agents
 * that can run complex workflows without human intervention.
 *
 * Perfect for:
 * - CI/CD automation
 * - Code review bots
 * - Autonomous issue fixing
 * - Long-running background tasks
 */

import {
  Agent,
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
  AgentConfig,
} from "@avasis-ai/synthcode";
import { AnthropicProvider } from "@avasis-ai/synthcode/llm";

// Configure for autonomous operation
const config: AgentConfig = {
  model: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  }),
  tools: [
    new BashTool({ cwd: process.cwd() }),
    new FileReadTool({ cwd: process.cwd() }),
    new FileWriteTool({ cwd: process.cwd() }),
    new FileEditTool({ cwd: process.cwd() }),
    new GlobTool({ cwd: process.cwd() }),
    new GrepTool({ cwd: process.cwd() }),
  ],
  systemPrompt: [
    "You are an autonomous coding agent.",
    "",
    "Your mission:",
    "- Analyze the codebase thoroughly",
    "- Identify issues or improvements",
    "- Implement fixes and features",
    "- Run tests to verify changes",
    "- Document your work",
    "",
    "Key principles:",
    "- Be thorough but efficient",
    "- Add tests for new functionality",
    "- Update documentation when needed",
    "- Ask for human approval only for destructive operations",
    "- Report progress clearly and concisely",
  ].join("\n"),
  maxTurns: 100, // Allow longer autonomous runs
  context: {
    maxTokens: 200_000,
    compactThreshold: 0.85,
  },
  permissions: {
    defaultAction: "allow",
    // Require approval for:
    // - Deleting files
    // - Running deploy commands
    // - Modifying configuration
    requireApproval: ["file:delete", "bash:deploy"],
  },
};

/**
 * Autonomous issue fixer
 *
 * Automatically finds and fixes issues in the codebase.
 */
async function fixIssues() {
  const agent = new Agent(config);

  console.log("🔍 Autonomous Issue Fixer\n");

  for await (const event of agent.run(
    "Analyze this codebase for:\n" +
    "1. TypeScript errors or warnings\n" +
    "2. Code quality issues (unused imports, missing error handling)\n" +
    "3. Missing tests for important functions\n" +
    "4. Documentation gaps\n\n" +
    "Then fix what you find. Report what you did."
  )) {
    switch (event.type) {
      case "text":
        // Progress output
        if (event.text.trim()) {
          process.stdout.write(`\x1b[36m→\x1b[0m ${event.text}`);
        }
        break;

      case "tool_use":
        console.log(`\n  \x1b[33m[${event.name}]\x1b[0m`);
        break;

      case "tool_result":
        if (event.isError) {
          console.error(`\n  \x1b[31m[ERROR]\x1b[0m ${event.output}`);
        }
        break;

      case "approval_required":
        // Destructive operation requires approval
        console.log(`\n  \x1b[33m[APPROVAL REQUIRED]\x1b[0m ${event.operation}`);
        console.log(`  \x1b[90m${event.description}\x1b[0m`);
        // In production, you'd pause here and wait for human input
        event.approve();
        break;

      case "done":
        console.log("\n\n✅ Autonomous run complete");
        console.log(`Tokens: ${event.usage.inputTokens} in, ${event.usage.outputTokens} out`);
        console.log(`Turns: ${event.messages.filter((m) => m.role === "assistant").length}`);
        break;

      case "error":
        console.error(`\n❌ ${event.error.message}`);
        break;
    }
  }
}

/**
 * Autonomous test runner
 *
 * Runs tests, analyzes failures, and attempts fixes.
 */
async function runTestsAndFix() {
  const agent = new Agent(config);

  console.log("🧪 Autonomous Test Runner\n");

  for await (const event of agent.run(
    "Run the test suite. If there are failures:\n" +
    "1. Analyze what went wrong\n" +
    "2. Fix the underlying issues\n" +
    "3. Re-run tests to verify\n" +
    "4. Continue until all tests pass or you hit max turns"
  )) {
    switch (event.type) {
      case "text":
        if (event.text.trim()) {
          process.stdout.write(event.text);
        }
        break;
      case "tool_use":
        console.log(`\n  \x1b[36m[${event.name}]\x1b[0m`);
        break;
      case "done":
        console.log("\n\n✅ Test run complete");
        break;
    }
  }
}

// CLI interface
const command = process.argv[2] || "fix";

switch (command) {
  case "fix":
    fixIssues().catch(console.error);
    break;
  case "test":
    runTestsAndFix().catch(console.error);
    break;
  default:
    console.log("Usage: tsx autonomous-agent.ts [fix|test]");
    process.exit(1);
}

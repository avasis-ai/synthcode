import {
  Agent,
  BashTool,
  FileReadTool,
  FileWriteTool,
  FileEditTool,
  GlobTool,
  GrepTool,
} from "@avasis-ai/synthcode";
import { AnthropicProvider } from "@avasis-ai/synthcode/llm";

const agent = new Agent({
  model: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  }),
  tools: [
    new BashTool(),
    new FileReadTool(),
    new FileWriteTool(),
    new FileEditTool(),
    new GlobTool(),
    new GrepTool(),
  ],
  systemPrompt: [
    "You are an expert coding assistant.",
    "When writing code, follow these rules:",
    "- Use TypeScript for JavaScript projects",
    "- Include proper error handling",
    "- Write clean, readable code",
    "- When running commands, explain what each command does",
  ].join("\n"),
  maxTurns: 50,
  context: {
    maxTokens: 200_000,
    compactThreshold: 0.85,
  },
  permissions: {
    defaultAction: "allow",
  },
});

console.log("Synth Coding Agent\n");
console.log("Tools: bash, file_read, file_write, file_edit, glob, grep\n");
console.log("---\n");

const prompt = process.argv[2] || "Create a simple Express.js API with CRUD endpoints for a todo app";

for await (const event of agent.run(prompt)) {
  switch (event.type) {
    case "text":
      process.stdout.write(event.text);
      break;
    case "tool_use":
      console.log(`\n  \x1b[36m[${event.name}]\x1b[0m`);
      break;
    case "tool_result":
      if (event.isError) {
        console.log(`\n  \x1b[31m[ERROR]\x1b[0m ${event.output.slice(0, 200)}`);
      }
      break;
    case "done":
      console.log(`\n\n---`);
      console.log(`Tokens: ${event.usage.inputTokens} in, ${event.usage.outputTokens} out`);
      console.log(`Turns: ${event.messages.filter((m) => m.role === "assistant").length}`);
      break;
    case "error":
      console.error(`\n  \x1b[31m${event.error.message}\x1b[0m`);
      break;
  }
}

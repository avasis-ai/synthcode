import { Agent, BashTool, FileReadTool } from "@avasis-ai/synthcode";
import { AnthropicProvider } from "@avasis-ai/synthcode/llm";

const agent = new Agent({
  model: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4-20250514",
  }),
  tools: [new BashTool(), new FileReadTool()],
  systemPrompt: "You are a helpful coding assistant. Be concise.",
});

console.log("Synth Basic Agent\n");

for await (const event of agent.run("What files are in the current directory?")) {
  switch (event.type) {
    case "text":
      process.stdout.write(event.text);
      break;
    case "tool_use":
      console.log(`\n  [${event.name}] ${JSON.stringify(event.input)}`);
      break;
    case "tool_result":
      if (event.isError) {
        console.log(`\n  [ERROR] ${event.output}`);
      }
      break;
    case "done":
      console.log(`\n\n---\nTokens: ${event.usage.inputTokens} in, ${event.usage.outputTokens} out`);
      break;
  }
}

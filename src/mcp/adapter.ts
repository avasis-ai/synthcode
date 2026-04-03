import { defineTool } from "../tools/tool.js";
import type { Tool } from "../tools/tool.js";
import type { ToolContext } from "../types.js";
import { MCPClient } from "./client.js";
import type { MCPToolDefinition, MCPServerConfig } from "./client.js";

export async function loadMCPTools(
  config: MCPServerConfig,
): Promise<{ tools: Tool[]; client: MCPClient }> {
  const { z } = await import("zod");

  const client = new MCPClient(config);
  await client.connect();
  const definitions = await client.listTools();

  const tools = definitions.map((def: MCPToolDefinition) =>
    defineTool({
      name: def.name,
      description: def.description,
      inputSchema: z.object({}).passthrough(),
      isReadOnly: true,
      isConcurrencySafe: true,
      execute: async (input: Record<string, unknown>, _context: ToolContext) => {
        const result = await client.callTool(def.name, input);
        return result;
      },
    }),
  );

  return { tools, client };
}

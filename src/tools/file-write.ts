import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { defineTool } from './tool.js';

export const FileWriteTool = defineTool({
  name: 'file_write',
  description:
    "Write content to a file. Creates the file if it doesn't exist, overwrites if it does. Parent directories are created automatically.",
  inputSchema: z.object({
    path: z.string().describe('Path to the file'),
    content: z.string().describe('Content to write'),
  }),
  isReadOnly: false,
  isConcurrencySafe: false,
  execute: async ({ path: filePath, content }, context) => {
    try {
      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(context.cwd, filePath);
      const dir = path.dirname(resolved);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(resolved, content, 'utf-8');

      return `Wrote ${content.length} characters to ${filePath}`;
    } catch (err: unknown) {
      return `Error writing file: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});

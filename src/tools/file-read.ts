import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { defineTool } from './tool.js';

const MAX_LINE_LENGTH = 2000;

export const FileReadTool = defineTool({
  name: 'file_read',
  description:
    'Read the contents of a file. Returns the file content with line numbers. Use GlobTool to find files first.',
  inputSchema: z.object({
    path: z.string().describe('Absolute or relative path to the file'),
    offset: z.number().optional().describe('Line number to start reading from (1-indexed)'),
    limit: z.number().optional().describe('Maximum number of lines to read'),
  }),
  isReadOnly: true,
  isConcurrencySafe: true,
  execute: async ({ path: filePath, offset, limit }, context) => {
    try {
      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(context.cwd, filePath);

      const content = await fs.readFile(resolved, 'utf-8');
      const lines = content.split('\n');

      const startLine = offset ? Math.max(1, offset) : 1;
      const startIndex = startLine - 1;
      const endIndex = limit != null ? startIndex + limit : lines.length;
      const selected = lines.slice(startIndex, endIndex);

      const formatted = selected
        .map((line, i) => {
          const lineNum = startLine + i;
          const truncated = line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) + '...' : line;
          return `${lineNum}: ${truncated}`;
        })
        .join('\n');

      return formatted;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${filePath}`;
      }
      if ((err as NodeJS.ErrnoException).code === 'EISDIR') {
        return `Error: Path is a directory: ${filePath}`;
      }
      return `Error reading file: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});

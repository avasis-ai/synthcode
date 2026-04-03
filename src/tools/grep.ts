import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { defineTool } from './tool.js';
import { globToRegExp } from '../utils.js';

const MAX_MATCHES = 200;

async function walkDir(dir: string): Promise<string[]> {
  const { walkDir: walk } = await import('../utils.js');
  const entries = await walk(dir);
  return entries.map((e) => e.path);
}

export const GrepTool = defineTool({
  name: 'grep',
  description:
    'Search file contents using a regular expression. Returns matching file paths with line numbers.',
  inputSchema: z.object({
    pattern: z.string().describe('Regular expression to search for'),
    path: z.string().optional().describe('Directory to search in'),
    include: z.string().optional().describe('File pattern to include (e.g., "*.ts")'),
  }),
  isReadOnly: true,
  isConcurrencySafe: true,
  execute: async ({ pattern, path: searchPath, include }, context) => {
    try {
      let regex: RegExp;
      try {
        regex = new RegExp(pattern);
      } catch {
        return `Error: Invalid regular expression: ${pattern}`;
      }

      const searchDir = searchPath
        ? path.isAbsolute(searchPath)
          ? searchPath
          : path.resolve(context.cwd, searchPath)
        : context.cwd;

      const includeRe = include ? globToRegExp(include) : null;
      const allFiles = await walkDir(searchDir);
      const matches: string[] = [];

      for (const filePath of allFiles) {
        if (matches.length >= MAX_MATCHES) break;

        if (includeRe) {
          const base = path.basename(filePath);
          if (!includeRe.test(base)) continue;
        }

        let content: string;
        try {
          content = await fs.readFile(filePath, 'utf-8');
        } catch {
          continue;
        }

        const lines = content.split('\n');
        const relative = path.relative(searchDir, filePath);

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          if (matches.length >= MAX_MATCHES) break;
          const line = lines[lineIdx];
          if (regex.test(line)) {
            matches.push(`${relative}:${lineIdx + 1}: ${line}`);
            regex.lastIndex = 0;
          } else {
            regex.lastIndex = 0;
          }
        }
      }

      if (matches.length === 0) {
        return 'No matches found.';
      }

      return matches.join('\n');
    } catch (err: unknown) {
      return `Error searching files: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { defineTool } from './tool.js';
import { globToRegExp } from '../utils.js';

const MAX_RESULTS = 200;

async function walkDir(dir: string): Promise<string[]> {
  const { walkDir: walk } = await import('../utils.js');
  const entries = await walk(dir);
  return entries.map((e) => e.path);
}

function matchInclude(filePath: string, includePattern?: string): boolean {
  if (!includePattern) return true;
  const base = path.basename(filePath);
  const re = globToRegExp(includePattern);
  return re.test(base);
}

export const GlobTool = defineTool({
  name: 'glob',
  description:
    'Find files matching a glob pattern. Returns matching file paths sorted by modification time.',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern (e.g., "**/*.ts", "src/**/*.tsx")'),
    path: z.string().optional().describe('Directory to search in (default: current directory)'),
    include: z.string().optional().describe('File extension or pattern to include (e.g., "*.ts")'),
  }),
  isReadOnly: true,
  isConcurrencySafe: true,
  execute: async ({ pattern, path: searchPath, include }, context) => {
    try {
      const searchDir = searchPath
        ? path.isAbsolute(searchPath)
          ? searchPath
          : path.resolve(context.cwd, searchPath)
        : context.cwd;

      const allFiles = await walkDir(searchDir);
      const re = globToRegExp(pattern);

      const matched: Array<{ filePath: string; mtimeMs: number }> = [];

      for (const filePath of allFiles) {
        const relative = path.relative(searchDir, filePath);
        if (re.test(relative) && matchInclude(relative, include)) {
          try {
            const stat = await fs.stat(filePath);
            matched.push({ filePath: relative, mtimeMs: stat.mtimeMs });
          } catch {
            matched.push({ filePath: relative, mtimeMs: 0 });
          }
        }
      }

      matched.sort((a, b) => b.mtimeMs - a.mtimeMs);
      const limited = matched.slice(0, MAX_RESULTS);
      return limited.map((m) => m.filePath).join('\n');
    } catch (err: unknown) {
      return `Error searching files: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});

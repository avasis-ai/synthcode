export const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+-rf\s+\//,
  /\bdd\s+if=/,
  /\bformat\s+[A-Z]:/i,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bmkfs\b/,
  /\b:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
];

export const PATH_TRAVERSAL: RegExp[] = [
  /\.\.\//,
  /\.\.\\/,
];

export const SECRET_PATTERNS: RegExp[] = [
  /(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["'][^"']{8,}/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{30,}/,
  /AKIA[A-Z0-9]{16}/,
];

export const DESTRUCTIVE_COMMANDS: string[] = [
  "DROP TABLE",
  "TRUNCATE",
  "DELETE FROM",
];

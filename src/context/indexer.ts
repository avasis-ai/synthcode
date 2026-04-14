import * as fs from "fs";
import * as path from "path";

export interface SymbolEntry {
  name: string;
  kind:
    | "function"
    | "class"
    | "interface"
    | "type"
    | "variable"
    | "constant"
    | "enum"
    | "method"
    | "property";
  filePath: string;
  line: number;
  exported: boolean;
}

export interface ImportEntry {
  source: string;
  symbols: string[];
  filePath: string;
  line: number;
}

export interface FileEntry {
  path: string;
  relativePath: string;
  lastModified: number;
  size: number;
  lineCount: number;
  language: string;
  symbols: SymbolEntry[];
  imports: ImportEntry[];
}

export interface CodebaseIndex {
  rootDir: string;
  files: Map<string, FileEntry>;
  symbolIndex: Map<string, SymbolEntry[]>;
  importGraph: Map<string, Set<string>>;
  indexedAt: number;
  fileCount: number;
  totalSymbols: number;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  "__pycache__",
  ".next",
  ".venv",
  "venv",
  ".env",
  ".tox",
  ".mypy_cache",
  ".pytest_cache",
  "coverage",
  ".nuxt",
  ".output",
  ".svelte-kit",
  "vendor",
  "Pods",
  ".gradle",
  ".idea",
  ".vscode",
  "bin",
  "obj",
  ".dart_tool",
  ".flutter-plugins",
  ".synthcode",
]);

const MAX_FILE_SIZE = 500 * 1024;

const EXTENSION_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".pyi": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".rb": "Ruby",
  ".css": "CSS",
  ".scss": "SCSS",
  ".html": "HTML",
  ".vue": "Vue",
  ".svelte": "Svelte",
};

const SOURCE_EXTENSIONS = new Set(Object.keys(EXTENSION_LANGUAGE));

interface SerializedIndex {
  rootDir: string;
  indexedAt: number;
  fileCount: number;
  totalSymbols: number;
  files: Array<{
    path: string;
    relativePath: string;
    lastModified: number;
    size: number;
    lineCount: number;
    language: string;
    symbols: SymbolEntry[];
    imports: ImportEntry[];
  }>;
  symbolIndex: Array<[string, SymbolEntry[]]>;
  importGraph: Array<[string, string[]]>;
}

export class CodebaseIndexer {
  private index: CodebaseIndex | null = null;

  buildIndex(rootDir: string): CodebaseIndex {
    const absoluteRoot = path.resolve(rootDir);
    const files = new Map<string, FileEntry>();
    const symbolIndex = new Map<string, SymbolEntry[]>();
    const importGraph = new Map<string, Set<string>>();

    const allFiles = this.collectFiles(absoluteRoot);

    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const language = EXTENSION_LANGUAGE[ext];
      if (!language) continue;

      const relativePath = path.relative(absoluteRoot, filePath);

      try {
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_FILE_SIZE) continue;

        const content = fs.readFileSync(filePath, "utf-8");
        const lineCount = content.split("\n").length;

        const symbols: SymbolEntry[] = [];
        const imports: ImportEntry[] = [];

        if (
          language === "TypeScript" ||
          language === "JavaScript"
        ) {
          this.parseTsJs(content, filePath, symbols, imports);
        } else if (language === "Python") {
          this.parsePython(content, filePath, symbols, imports);
        }

        for (const sym of symbols) {
          const existing = symbolIndex.get(sym.name);
          if (existing) {
            existing.push(sym);
          } else {
            symbolIndex.set(sym.name, [sym]);
          }
        }

        const importedFiles = new Set<string>();
        for (const imp of imports) {
          const resolved = this.resolveImport(
            imp.source,
            filePath,
            absoluteRoot,
          );
          if (resolved) {
            importedFiles.add(resolved);
          }
        }

        const entry: FileEntry = {
          path: filePath,
          relativePath,
          lastModified: stat.mtimeMs,
          size: stat.size,
          lineCount,
          language,
          symbols,
          imports,
        };

        files.set(filePath, entry);
        if (importedFiles.size > 0) {
          importGraph.set(filePath, importedFiles);
        }
      } catch {
        continue;
      }
    }

    let totalSymbols = 0;
    for (const syms of symbolIndex.values()) {
      totalSymbols += syms.length;
    }

    this.index = {
      rootDir: absoluteRoot,
      files,
      symbolIndex,
      importGraph,
      indexedAt: Date.now(),
      fileCount: files.size,
      totalSymbols,
    };

    return this.index;
  }

  lookup(name: string): SymbolEntry[] {
    if (!this.index) return [];
    return this.index.symbolIndex.get(name) ?? [];
  }

  getDependencies(filePath: string): string[] {
    if (!this.index) return [];
    const deps = new Set<string>();
    for (const [file, importedFiles] of this.index.importGraph) {
      if (importedFiles.has(filePath)) {
        deps.add(file);
      }
    }
    return Array.from(deps);
  }

  getDependents(filePath: string): string[] {
    if (!this.index) return [];
    return Array.from(this.index.importGraph.get(filePath) ?? []);
  }

  getRelatedFiles(filePath: string): string[] {
    if (!this.index) return [];

    const direct = new Set<string>();

    const deps = this.getDependents(filePath);
    for (const d of deps) direct.add(d);

    const depsOf = this.getDependencies(filePath);
    for (const d of depsOf) direct.add(d);

    const twoHop = new Set<string>(direct);

    for (const f of direct) {
      for (const d of this.getDependents(f)) twoHop.add(d);
      for (const d of this.getDependencies(f)) twoHop.add(d);
    }

    twoHop.delete(filePath);
    return Array.from(twoHop);
  }

  invalidate(filePath: string): void {
    if (!this.index) return;

    const entry = this.index.files.get(filePath);
    if (!entry) return;

    for (const sym of entry.symbols) {
      const entries = this.index.symbolIndex.get(sym.name);
      if (entries) {
        const filtered = entries.filter(
          (s) => s.filePath !== filePath,
        );
        if (filtered.length === 0) {
          this.index.symbolIndex.delete(sym.name);
        } else {
          this.index.symbolIndex.set(sym.name, filtered);
        }
      }
    }

    this.index.importGraph.delete(filePath);

    this.index.files.delete(filePath);

    this.index.fileCount = this.index.files.size;
    this.index.totalSymbols = 0;
    for (const syms of this.index.symbolIndex.values()) {
      this.index.totalSymbols += syms.length;
    }
  }

  save(rootDir: string): void {
    if (!this.index) return;

    const absoluteRoot = path.resolve(rootDir);
    const cacheDir = path.join(absoluteRoot, ".synthcode");

    try {
      fs.mkdirSync(cacheDir, { recursive: true });
    } catch {
      return;
    }

    const serialized: SerializedIndex = {
      rootDir: this.index.rootDir,
      indexedAt: this.index.indexedAt,
      fileCount: this.index.fileCount,
      totalSymbols: this.index.totalSymbols,
      files: Array.from(this.index.files.values()).map((f) => ({
        path: f.relativePath,
        relativePath: f.relativePath,
        lastModified: f.lastModified,
        size: f.size,
        lineCount: f.lineCount,
        language: f.language,
        symbols: f.symbols,
        imports: f.imports,
      })),
      symbolIndex: Array.from(this.index.symbolIndex.entries()).map(
        ([name, entries]) => [name, entries],
      ),
      importGraph: Array.from(this.index.importGraph.entries()).map(
        ([file, deps]) => [file, Array.from(deps)],
      ),
    };

    try {
      fs.writeFileSync(
        path.join(cacheDir, "index.json"),
        JSON.stringify(serialized),
        "utf-8",
      );
    } catch {
      return;
    }
  }

  load(rootDir: string): CodebaseIndex | null {
    const absoluteRoot = path.resolve(rootDir);
    const indexPath = path.join(absoluteRoot, ".synthcode", "index.json");

    let raw: string;
    try {
      raw = fs.readFileSync(indexPath, "utf-8");
    } catch {
      return null;
    }

    let serialized: SerializedIndex;
    try {
      serialized = JSON.parse(raw);
    } catch {
      return null;
    }

    const files = new Map<string, FileEntry>();
    for (const f of serialized.files) {
      const fullPath = path.resolve(absoluteRoot, f.path);
      const entry: FileEntry = {
        path: fullPath,
        relativePath: f.relativePath,
        lastModified: f.lastModified,
        size: f.size,
        lineCount: f.lineCount,
        language: f.language,
        symbols: f.symbols.map((s) => ({ ...s, filePath: fullPath })),
        imports: f.imports.map((imp) => ({ ...imp, filePath: fullPath })),
      };
      files.set(fullPath, entry);
    }

    const symbolIndex = new Map<string, SymbolEntry[]>();
    for (const [name, entries] of serialized.symbolIndex) {
      symbolIndex.set(
        name,
        entries.map((s) => ({
          ...s,
          filePath: path.resolve(absoluteRoot, s.filePath),
        })),
      );
    }

    const importGraph = new Map<string, Set<string>>();
    for (const [file, deps] of serialized.importGraph) {
      const resolvedFile = path.resolve(absoluteRoot, file);
      importGraph.set(
        resolvedFile,
        new Set(deps.map((d) => path.resolve(absoluteRoot, d))),
      );
    }

    this.index = {
      rootDir: absoluteRoot,
      files,
      symbolIndex,
      importGraph,
      indexedAt: serialized.indexedAt,
      fileCount: serialized.fileCount,
      totalSymbols: serialized.totalSymbols,
    };

    return this.index;
  }

  private collectFiles(rootDir: string): string[] {
    const result: string[] = [];
    try {
      const entries = fs.readdirSync(rootDir, {
        recursive: true,
        withFileTypes: false,
      }) as string[];

      for (const entry of entries) {
        const fullPath = path.join(rootDir, entry);
        const relativeParts = entry.split(path.sep);
        const shouldSkip = relativeParts.some((part) =>
          SKIP_DIRS.has(part),
        );
        if (shouldSkip) continue;

        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            result.push(fullPath);
          }
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }
    return result;
  }

  private parseTsJs(
    content: string,
    filePath: string,
    symbols: SymbolEntry[],
    imports: ImportEntry[],
  ): void {
    const lines = content.split("\n");

    const exportDeclRe =
      /export\s+(function|class|interface|type|const|let|var|enum)\s+(\w+)/g;
    const defaultExportRe =
      /export\s+default\s+(function|class)\s+(\w+)/g;
    const namedExportRe = /export\s*\{\s*([^}]+)\s*\}/g;
    const importRe =
      /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const sideEffectImportRe = /import\s+['"]([^'"]+)['"]/g;
    const methodRe = /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/g;
    const propertyRe =
      /(?:public|private|protected)?\s+(?:readonly\s+)?(\w+)\s*[=:]|(?:public|private|protected)\s+(?:readonly\s+)?(\w+)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      let m: RegExpExecArray | null;
      exportDeclRe.lastIndex = 0;
      while ((m = exportDeclRe.exec(line)) !== null) {
        const kind = m[1] as SymbolEntry["kind"];
        symbols.push({
          name: m[2],
          kind,
          filePath,
          line: lineNum,
          exported: true,
        });
      }

      defaultExportRe.lastIndex = 0;
      while ((m = defaultExportRe.exec(line)) !== null) {
        symbols.push({
          name: m[2],
          kind: m[1] as "function" | "class",
          filePath,
          line: lineNum,
          exported: true,
        });
      }

      namedExportRe.lastIndex = 0;
      while ((m = namedExportRe.exec(line)) !== null) {
        const names = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]);
        for (const name of names) {
          if (name) {
            symbols.push({
              name,
              kind: "variable",
              filePath,
              line: lineNum,
              exported: true,
            });
          }
        }
      }

      importRe.lastIndex = 0;
      while ((m = importRe.exec(line)) !== null) {
        const named = m[1]
          ? m[1].split(",").map((s) => s.trim())
          : [];
        const default_ = m[2] ? [m[2]] : [];
        imports.push({
          source: m[3],
          symbols: [...named, ...default_],
          filePath,
          line: lineNum,
        });
      }

      sideEffectImportRe.lastIndex = 0;
      while ((m = sideEffectImportRe.exec(line)) !== null) {
        imports.push({
          source: m[1],
          symbols: [],
          filePath,
          line: lineNum,
        });
      }
    }
  }

  private parsePython(
    content: string,
    filePath: string,
    symbols: SymbolEntry[],
    imports: ImportEntry[],
  ): void {
    const lines = content.split("\n");

    const defRe = /^def\s+(\w+)/gm;
    const classRe = /^class\s+(\w+)/gm;
    const importRe = /^(?:from\s+(\S+)\s+)?import\s+(.+)/gm;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      defRe.lastIndex = 0;
      const defMatch = defRe.exec(line);
      if (defMatch) {
        symbols.push({
          name: defMatch[1],
          kind: line.startsWith("    ") || line.startsWith("\t") ? "method" : "function",
          filePath,
          line: lineNum,
          exported: !line.startsWith("    ") && !line.startsWith("\t") && line.startsWith("def "),
        });
      }

      classRe.lastIndex = 0;
      const classMatch = classRe.exec(line);
      if (classMatch) {
        symbols.push({
          name: classMatch[1].split("(")[0],
          kind: "class",
          filePath,
          line: lineNum,
          exported: !line.startsWith("    ") && !line.startsWith("\t"),
        });
      }

      importRe.lastIndex = 0;
      const importMatch = importRe.exec(line);
      if (importMatch) {
        const fromModule = importMatch[1] ?? "";
        const importedNames = importMatch[2]
          .split(",")
          .map((s) => s.trim().split(/\s+as\s+/)[0]);
        imports.push({
          source: fromModule,
          symbols: importedNames,
          filePath,
          line: lineNum,
        });
      }
    }
  }

  private resolveImport(
    importSource: string,
    fromFile: string,
    rootDir: string,
  ): string | null {
    if (importSource.startsWith(".")) {
      const dir = path.dirname(fromFile);
      const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
      for (const ext of extensions) {
        const candidate = path.resolve(dir, importSource + ext);
        try {
          const stat = fs.statSync(candidate);
          if (stat.isFile()) return candidate;
        } catch {
          continue;
        }
      }
      const indexPath = path.resolve(dir, importSource, "index.ts");
      try {
        const stat = fs.statSync(indexPath);
        if (stat.isFile()) return indexPath;
      } catch {
        const indexJs = path.resolve(dir, importSource, "index.js");
        try {
          const stat = fs.statSync(indexJs);
          if (stat.isFile()) return indexJs;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

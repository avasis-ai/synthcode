import * as fs from "fs";
import * as path from "path";

export interface ProjectProfile {
  rootDir: string;
  name: string;
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  packageManager: string | null;
  totalFiles: number;
  totalLinesOfCode: number;
  testFramework: string | null;
  buildTool: string | null;
  complexity: "tiny" | "small" | "medium" | "large" | "monorepo";
  hasTypeScript: boolean;
  hasTests: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  modelRequirements: ModelRequirements;
}

export interface LanguageInfo {
  language: string;
  fileCount: number;
  percentage: number;
}

export interface FrameworkInfo {
  name: string;
  category: "frontend" | "backend" | "fullstack" | "mobile" | "data" | "infra";
}

export interface ModelRequirements {
  minContextTokens: number;
  reasoningNeeded: boolean;
  toolUseNeeded: boolean;
  codeHeavy: boolean;
}

const EXTENSION_MAP: Record<string, string> = {
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
  ".kts": "Kotlin",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".c": "C",
  ".h": "C/C++",
  ".hpp": "C++",
  ".rb": "Ruby",
  ".swift": "Swift",
  ".scala": "Scala",
  ".php": "PHP",
  ".cs": "C#",
  ".fs": "F#",
  ".dart": "Dart",
  ".lua": "Lua",
  ".r": "R",
  ".R": "R",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".ps1": "PowerShell",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".xml": "XML",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".md": "Markdown",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".erl": "Erlang",
  ".hs": "Haskell",
  ".ml": "OCaml",
  ".zig": "Zig",
  ".nim": "Nim",
  ".proto": "Protocol Buffers",
  ".graphql": "GraphQL",
  ".gql": "GraphQL",
};

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
]);

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".pyi",
  ".rs",
  ".go",
  ".java", ".kt", ".kts",
  ".cpp", ".cc", ".cxx", ".c", ".h", ".hpp",
  ".rb",
  ".swift",
  ".scala",
  ".php",
  ".cs", ".fs",
  ".dart",
  ".lua",
  ".r", ".R",
  ".sh", ".bash", ".zsh", ".ps1",
  ".vue", ".svelte",
  ".ex", ".exs", ".erl",
  ".hs", ".ml",
  ".zig", ".nim",
  ".sql",
  ".graphql", ".gql",
  ".proto",
  ".scss", ".sass", ".less",
  ".html", ".css",
]);

const COMPILED_LANGUAGES = new Set(["Rust", "Go", "Java", "Kotlin", "C++", "C", "C/C++", "Swift", "Scala", "C#"]);

const COMPLEXITY_THRESHOLDS = {
  tiny: 50,
  small: 200,
  medium: 1000,
  large: 5000,
} as const;

const CONTEXT_TOKEN_MAP: Record<string, number> = {
  tiny: 8192,
  small: 16384,
  medium: 32768,
  large: 65536,
  monorepo: 131072,
};

export class ProjectAnalyzer {
  analyze(rootDir: string): ProjectProfile {
    const absoluteRoot = path.resolve(rootDir);
    const name = path.basename(absoluteRoot);

    const allFiles = this.collectFiles(absoluteRoot);
    const totalFiles = allFiles.length;

    const languageCounts = this.detectLanguages(allFiles);
    const languages = this.computeLanguagePercentages(languageCounts, totalFiles);

    const rootFileNames = this.listRootFiles(absoluteRoot);
    const rootFileContent = this.readRootConfigs(absoluteRoot, rootFileNames);

    const packageManager = this.detectPackageManager(rootFileNames, rootFileContent);
    const frameworks = this.detectFrameworks(absoluteRoot, rootFileNames, rootFileContent);
    const testFramework = this.detectTestFramework(absoluteRoot, rootFileNames, rootFileContent);
    const buildTool = this.detectBuildTool(rootFileNames);
    const hasCI = this.detectCI(absoluteRoot, rootFileNames);
    const hasDocker = this.detectDocker(rootFileNames);
    const hasTests = this.detectHasTests(absoluteRoot, allFiles);

    const hasTypeScript = languageCounts["TypeScript"] !== undefined && languageCounts["TypeScript"] > 0;

    const totalLinesOfCode = this.estimateLinesOfCode(allFiles);
    const complexity = this.computeComplexity(totalFiles);
    const modelRequirements = this.computeModelRequirements(
      complexity,
      languages,
      allFiles,
    );

    return {
      rootDir: absoluteRoot,
      name,
      languages,
      frameworks,
      packageManager,
      totalFiles,
      totalLinesOfCode,
      testFramework,
      buildTool,
      complexity,
      hasTypeScript,
      hasTests,
      hasCI,
      hasDocker,
      modelRequirements,
    };
  }

  private collectFiles(rootDir: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(rootDir, {
        recursive: true,
        withFileTypes: false,
      }) as string[];

      for (const entry of entries) {
        const fullPath = path.join(rootDir, entry);
        const relativeParts = entry.split(path.sep);
        const shouldSkip = relativeParts.some((part) => SKIP_DIRS.has(part));
        if (shouldSkip) continue;

        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            files.push(fullPath);
          }
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }
    return files;
  }

  private listRootFiles(rootDir: string): Set<string> {
    try {
      const entries = fs.readdirSync(rootDir, { withFileTypes: true });
      return new Set(
        entries.filter((e) => e.isFile() || e.isDirectory()).map((e) => e.name),
      );
    } catch {
      return new Set();
    }
  }

  private readRootConfigs(
    rootDir: string,
    rootFileNames: Set<string>,
  ): Map<string, string> {
    const content = new Map<string, string>();

    const configsToRead = [
      "package.json",
      "Cargo.toml",
      "go.mod",
      "requirements.txt",
      "Pipfile",
      "pyproject.toml",
      "Gemfile",
    ];

    for (const config of configsToRead) {
      if (rootFileNames.has(config)) {
        try {
          const filePath = path.join(rootDir, config);
          const data = fs.readFileSync(filePath, "utf-8");
          content.set(config, data);
        } catch {
          continue;
        }
      }
    }

    return content;
  }

  private detectLanguages(
    files: string[],
  ): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const language = EXTENSION_MAP[ext];
      if (language) {
        counts[language] = (counts[language] || 0) + 1;
      }
    }

    return counts;
  }

  private computeLanguagePercentages(
    counts: Record<string, number>,
    totalFiles: number,
  ): LanguageInfo[] {
    if (totalFiles === 0) return [];

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return entries.map(([language, fileCount]) => ({
      language,
      fileCount,
      percentage: Math.round((fileCount / totalFiles) * 10000) / 100,
    }));
  }

  private detectPackageManager(
    rootFileNames: Set<string>,
    rootFileContent: Map<string, string>,
  ): string | null {
    if (rootFileNames.has("pnpm-lock.yaml")) return "pnpm";
    if (rootFileNames.has("yarn.lock")) return "yarn";
    if (rootFileNames.has("package-lock.json")) return "npm";
    if (rootFileNames.has("bun.lockb") || rootFileNames.has("bun.lock")) return "bun";

    if (rootFileNames.has("package.json") && !rootFileNames.has("package-lock.json") && !rootFileNames.has("yarn.lock") && !rootFileNames.has("pnpm-lock.yaml")) {
      return "npm";
    }

    if (rootFileNames.has("Cargo.toml")) return "cargo";
    if (rootFileNames.has("go.mod")) return "go";
    if (rootFileNames.has("requirements.txt") || rootFileNames.has("Pipfile") || rootFileNames.has("pyproject.toml")) {
      if (rootFileNames.has("Pipfile")) return "pipenv";
      if (rootFileNames.has("uv.lock")) return "uv";
      if (rootFileContent.has("pyproject.toml")) {
        const content = rootFileContent.get("pyproject.toml")!;
        if (content.includes("poetry")) return "poetry";
        if (content.includes("pdm")) return "pdm";
      }
      return "pip";
    }
    if (rootFileNames.has("Gemfile")) return "bundler";
    if (rootFileNames.has("pubspec.yaml")) return "pub";
    if (rootFileNames.has("mix.exs")) return "mix";
    if (rootFileNames.has("composer.json")) return "composer";

    return null;
  }

  private detectFrameworks(
    rootDir: string,
    rootFileNames: Set<string>,
    rootFileContent: Map<string, string>,
  ): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];
    const seen = new Set<string>();

    const addFramework = (name: string, category: FrameworkInfo["category"]) => {
      if (!seen.has(name)) {
        seen.add(name);
        frameworks.push({ name, category });
      }
    };

    if (this.matchesGlob(rootFileNames, "next.config.")) {
      addFramework("Next.js", "fullstack");
    }

    if (this.matchesGlob(rootFileNames, "nuxt.config.")) {
      addFramework("Nuxt", "fullstack");
    }

    if (rootFileNames.has("angular.json")) {
      addFramework("Angular", "frontend");
    }

    if (this.matchesGlob(rootFileNames, "vite.config.")) {
      if (!seen.has("Next.js")) {
        addFramework("Vite", "frontend");
      }
    }

    if (rootFileNames.has("svelte.config.js") || rootFileNames.has("svelte.config.ts")) {
      addFramework("SvelteKit", "fullstack");
    }

    const pkgJson = rootFileContent.get("package.json");
    if (pkgJson) {
      try {
        const pkg = JSON.parse(pkgJson);
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        };

        if (allDeps["react"] || allDeps["react-dom"]) addFramework("React", "frontend");
        if (allDeps["vue"] || allDeps["vue2"]) addFramework("Vue", "frontend");
        if (allDeps["svelte"]) addFramework("Svelte", "frontend");
        if (allDeps["@angular/core"]) addFramework("Angular", "frontend");
        if (allDeps["express"]) addFramework("Express", "backend");
        if (allDeps["fastify"]) addFramework("Fastify", "backend");
        if (allDeps["koa"]) addFramework("Koa", "backend");
        if (allDeps["nestjs"] || allDeps["@nestjs/core"]) addFramework("NestJS", "backend");
        if (allDeps["hono"]) addFramework("Hono", "backend");
        if (allDeps["@hono/node-server"]) addFramework("Hono", "backend");
        if (allDeps["hapi"] || allDeps["@hapi/hapi"]) addFramework("Hapi", "backend");
        if (allDeps["electron"]) addFramework("Electron", "frontend");
        if (allDeps["react-native"] || allDeps["expo"]) addFramework("React Native", "mobile");
        if (allDeps["@react-native"]) addFramework("React Native", "mobile");
        if (allDeps["tailwindcss"]) addFramework("Tailwind CSS", "frontend");
        if (allDeps["@trpc/server"] || allDeps["@trpc/client"]) addFramework("tRPC", "fullstack");
        if (allDeps["prisma"] || allDeps["@prisma/client"]) addFramework("Prisma", "infra");
        if (allDeps["drizzle-orm"]) addFramework("Drizzle", "infra");
        if (allDeps["@tanstack/react-query"]) addFramework("TanStack Query", "frontend");
        if (allDeps["redux"] || allDeps["@reduxjs/toolkit"]) addFramework("Redux", "frontend");
        if (allDeps["zustand"]) addFramework("Zustand", "frontend");
        if (allDeps["three"] || allDeps["three.js"]) addFramework("Three.js", "frontend");
        if (allDeps["d3"] || allDeps["d3.js"]) addFramework("D3", "data");
        if (allDeps["@remix-run/react"] || allDeps["remix"]) addFramework("Remix", "fullstack");
        if (allDeps["@astrojs/react"] || allDeps["astro"]) addFramework("Astro", "frontend");
        if (allDeps["gatsby"]) addFramework("Gatsby", "frontend");
        if (allDeps["@storybook/react"] || allDeps["storybook"]) addFramework("Storybook", "frontend");
        if (allDeps["jest"] || allDeps["vitest"]) { /* handled in test detection */ }
        if (allDeps["express"] && allDeps["react"]) {
          // Already added individually
        }
      } catch {
        // Invalid JSON
      }
    }

    const cargoToml = rootFileContent.get("Cargo.toml");
    if (cargoToml) {
      if (cargoToml.includes("actix-web")) addFramework("Actix Web", "backend");
      if (cargoToml.includes("axum")) addFramework("Axum", "backend");
      if (cargoToml.includes("rocket")) addFramework("Rocket", "backend");
      if (cargoToml.includes("warp")) addFramework("Warp", "backend");
      if (cargoToml.includes("tokio")) addFramework("Tokio", "backend");
      if (cargoToml.includes("bevy")) addFramework("Bevy", "data");
      if (cargoToml.includes("leptos")) addFramework("Leptos", "fullstack");
      if (cargoToml.includes("yew")) addFramework("Yew", "frontend");
      if (cargoToml.includes("iced")) addFramework("Iced", "frontend");
      if (cargoToml.includes("diesel")) addFramework("Diesel", "infra");
      if (cargoToml.includes("sqlx")) addFramework("SQLx", "infra");
      if (cargoToml.includes("sea-orm")) addFramework("SeaORM", "infra");
    }

    const goMod = rootFileContent.get("go.mod");
    if (goMod) {
      if (goMod.includes("gin-gonic/gin")) addFramework("Gin", "backend");
      if (goMod.includes("labstack/echo") || goMod.includes("echo")) addFramework("Echo", "backend");
      if (goMod.includes("fiber")) addFramework("Fiber", "backend");
      if (goMod.includes("gorilla/mux")) addFramework("Gorilla Mux", "backend");
      if (goMod.includes("chi")) addFramework("Chi", "backend");
      if (goMod.includes("go-kratos")) addFramework("Kratos", "backend");
      if (goMod.includes("gorm.io")) addFramework("GORM", "infra");
    }

    const requirementsTxt = rootFileContent.get("requirements.txt");
    const pyprojectToml = rootFileContent.get("pyproject.toml");

    const pythonDeps: string[] = [];
    if (requirementsTxt) {
      pythonDeps.push(...requirementsTxt.split("\n"));
    }
    if (pyprojectToml) {
      pythonDeps.push(...pyprojectToml.split("\n"));
    }
    const pythonDepsStr = pythonDeps.join("\n").toLowerCase();

    if (pythonDepsStr.includes("django")) addFramework("Django", "backend");
    if (pythonDepsStr.includes("flask")) addFramework("Flask", "backend");
    if (pythonDepsStr.includes("fastapi")) addFramework("FastAPI", "backend");
    if (pythonDepsStr.includes("starlette")) addFramework("Starlette", "backend");
    if (pythonDepsStr.includes("pyramid")) addFramework("Pyramid", "backend");
    if (pythonDepsStr.includes("sanic")) addFramework("Sanic", "backend");
    if (pythonDepsStr.includes("celery")) addFramework("Celery", "backend");
    if (pythonDepsStr.includes("scrapy")) addFramework("Scrapy", "data");
    if (pythonDepsStr.includes("pandas")) addFramework("Pandas", "data");
    if (pythonDepsStr.includes("numpy")) addFramework("NumPy", "data");
    if (pythonDepsStr.includes("tensorflow")) addFramework("TensorFlow", "data");
    if (pythonDepsStr.includes("torch") || pythonDepsStr.includes("pytorch")) addFramework("PyTorch", "data");
    if (pythonDepsStr.includes("scikit-learn") || pythonDepsStr.includes("sklearn")) addFramework("scikit-learn", "data");
    if (pythonDepsStr.includes("sqlalchemy")) addFramework("SQLAlchemy", "infra");
    if (pythonDepsStr.includes("flask-restful") || pythonDepsStr.includes("flask-restx")) addFramework("Flask-RESTful", "backend");
    if (pythonDepsStr.includes(" Strawberry")) addFramework("Strawberry", "backend");

    const gemfile = rootFileContent.get("Gemfile");
    if (gemfile) {
      if (gemfile.includes("rails")) addFramework("Ruby on Rails", "fullstack");
      if (gemfile.includes("sinatra")) addFramework("Sinatra", "backend");
      if (gemfile.includes("hanami")) addFramework("Hanami", "fullstack");
      if (gemfile.includes("grape")) addFramework("Grape", "backend");
      if (gemfile.includes("sidekiq")) addFramework("Sidekiq", "backend");
      if (gemfile.includes("rspec")) { /* test framework */ }
      if (gemfile.includes("activerecord")) addFramework("ActiveRecord", "infra");
    }

    if (rootFileNames.has("pubspec.yaml")) {
      addFramework("Flutter", "mobile");
    }

    if (rootFileNames.has("mix.exs")) {
      addFramework("Phoenix", "fullstack");
    }

    if (rootFileNames.has("build.gradle") || rootFileNames.has("build.gradle.kts") || rootFileNames.has("pom.xml")) {
      if (rootFileNames.has("pom.xml")) addFramework("Maven", "infra");
      else addFramework("Gradle", "infra");

      const springSource = rootFileNames.has("pom.xml")
        ? this.tryRead(path.join(rootDir, "pom.xml"))
        : this.tryRead(path.join(rootDir, "build.gradle")) || this.tryRead(path.join(rootDir, "build.gradle.kts"));
      if (springSource && springSource.includes("spring")) {
        addFramework("Spring", "backend");
      }
    }

    if (rootFileNames.has("docker-compose.yml") || rootFileNames.has("docker-compose.yaml")) {
      addFramework("Docker Compose", "infra");
    }

    if (rootFileNames.has("terraform") || this.hasDir(rootDir, "terraform")) {
      addFramework("Terraform", "infra");
    }

    if (rootFileNames.has("serverless.yml") || rootFileNames.has("serverless.yaml")) {
      addFramework("Serverless", "infra");
    }

    if (rootFileNames.has("sam.yaml") || rootFileNames.has("template.yaml")) {
      addFramework("AWS SAM", "infra");
    }

    return frameworks;
  }

  private detectTestFramework(
    rootDir: string,
    rootFileNames: Set<string>,
    rootFileContent: Map<string, string>,
  ): string | null {
    if (this.matchesGlob(rootFileNames, "vitest.config.")) return "Vitest";
    if (this.matchesGlob(rootFileNames, "jest.config.")) return "Jest";

    const pkgJson = rootFileContent.get("package.json");
    if (pkgJson) {
      try {
        const pkg = JSON.parse(pkgJson);
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        };
        if (allDeps["vitest"]) return "Vitest";
        if (allDeps["jest"]) return "Jest";
        if (allDeps["mocha"]) return "Mocha";
        if (allDeps["ava"]) return "AVA";
        if (allDeps["cypress"]) return "Cypress";
        if (allDeps["@playwright/test"]) return "Playwright";
        if (allDeps["@testing-library/react"]) return "Testing Library";
        if (allDeps["tap"]) return "tap";
        if (allDeps["uvu"]) return "UVU";
        if (allDeps["buster"]) return "Buster";
      } catch {
        // Invalid JSON
      }
    }

    if (rootFileNames.has("pytest.ini") || rootFileNames.has("conftest.py")) return "pytest";
    const pyproject = rootFileContent.get("pyproject.toml");
    if (pyproject && (pyproject.includes("pytest") || pyproject.includes("[tool.pytest"))) return "pytest";

    const cargoToml = rootFileContent.get("Cargo.toml");
    if (cargoToml && cargoToml.includes("[dev-dependencies]")) return "cargo test";

    if (rootFileNames.has("go.mod")) {
      const goTestDir = path.join(rootDir, "..._test.go");
      try {
        const testFiles = fs.readdirSync(rootDir, { recursive: true }) as string[];
        if (testFiles.some((f) => typeof f === "string" && f.endsWith("_test.go"))) {
          return "go test";
        }
      } catch {
        // ignore
      }
    }

    const gemfile = rootFileContent.get("Gemfile");
    if (gemfile && gemfile.includes("rspec")) return "RSpec";

    if (rootFileNames.has("Makefile")) {
      const makefile = this.tryRead(path.join(rootDir, "Makefile"));
      if (makefile && makefile.includes("test")) return "make test";
    }

    return null;
  }

  private detectBuildTool(rootFileNames: Set<string>): string | null {
    if (rootFileNames.has("tsconfig.json")) return "tsc";
    if (this.matchesGlob(rootFileNames, "webpack.config.")) return "webpack";
    if (this.matchesGlob(rootFileNames, "vite.config.")) return "vite";
    if (this.matchesGlob(rootFileNames, "rollup.config.")) return "rollup";
    if (this.matchesGlob(rootFileNames, "esbuild.") || rootFileNames.has("esbuild.js") || rootFileNames.has("esbuild.ts") || rootFileNames.has("esbuild.mjs")) return "esbuild";
    if (rootFileNames.has("turbo.json")) return "Turborepo";
    if (this.matchesGlob(rootFileNames, "parcelrc") || this.matchesGlob(rootFileNames, ".parcelrc")) return "Parcel";
    if (rootFileNames.has("Gruntfile.js") || rootFileNames.has("Gruntfile.ts")) return "Grunt";
    if (rootFileNames.has("Gulpfile.js") || rootFileNames.has("Gulpfile.ts") || rootFileNames.has("Gulpfile.mjs")) return "Gulp";
    if (rootFileNames.has("Makefile")) return "make";
    if (rootFileNames.has("CMakeLists.txt")) return "CMake";
    if (rootFileNames.has("Cargo.toml")) return "cargo";
    if (rootFileNames.has("build.gradle") || rootFileNames.has("build.gradle.kts")) return "Gradle";
    if (rootFileNames.has("pom.xml")) return "Maven";
    if (rootFileNames.has("build.sbt")) return "sbt";
    if (rootFileNames.has("justfile") || rootFileNames.has("Justfile")) return "just";
    if (rootFileNames.has("Taskfile.yml") || rootFileNames.has("Taskfile.yaml")) return "Task";
    if (rootFileNames.has("bazel") || rootFileNames.has("WORKSPACE") || rootFileNames.has("WORKSPACE.bazel")) return "Bazel";
    if (rootFileNames.has("BUCK") || rootFileNames.has(".buckconfig")) return "Buck";
    if (rootFileNames.has("meson.build")) return "Meson";
    if (rootFileNames.has("build.zig")) return "Zig Build";

    return null;
  }

  private detectCI(rootDir: string, rootFileNames: Set<string>): boolean {
    if (rootFileNames.has(".github")) {
      const workflowsDir = path.join(rootDir, ".github", "workflows");
      try {
        const stat = fs.statSync(workflowsDir);
        if (stat.isDirectory()) {
          const files = fs.readdirSync(workflowsDir);
          if (files.length > 0) return true;
        }
      } catch {
        // .github exists but no workflows
      }
    }

    // Re-check by trying to read .github/workflows directly
    try {
      const workflowsDir = path.join(rootDir, ".github", "workflows");
      const files = fs.readdirSync(workflowsDir);
      if (files.length > 0) return true;
    } catch {
      // doesn't exist
    }

    if (rootFileNames.has(".gitlab-ci.yml")) return true;
    if (rootFileNames.has("Jenkinsfile")) return true;
    if (rootFileNames.has(".circleci") || rootFileNames.has(".circleci")) {
      try {
        const configPath = path.join(rootDir, ".circleci", "config.yml");
        if (fs.existsSync(configPath)) return true;
      } catch {
        // ignore
      }
    }
    if (rootFileNames.has(".travis.yml")) return true;
    if (rootFileNames.has("azure-pipelines.yml") || rootFileNames.has("azure-pipelines.yaml")) return true;
    if (rootFileNames.has("bitbucket-pipelines.yml")) return true;
    if (rootFileNames.has("cloudbuild.yaml") || rootFileNames.has("cloudbuild.yml")) return true;
    if (rootFileNames.has("buildkite.yml") || rootFileNames.has("buildkite.yaml")) return true;

    return false;
  }

  private detectDocker(rootFileNames: Set<string>): boolean {
    if (rootFileNames.has("Dockerfile")) return true;
    if (this.matchesGlob(rootFileNames, "docker-compose.")) return true;
    if (rootFileNames.has("Dockerfile.dev") || rootFileNames.has("Dockerfile.prod")) return true;
    if (rootFileNames.has(".dockerignore")) return true;

    return false;
  }

  private detectHasTests(rootDir: string, allFiles: string[]): boolean {
    for (const file of allFiles) {
      const base = path.basename(file);
      if (
        base.includes(".test.") ||
        base.includes(".spec.") ||
        base.includes("_test.") ||
        base.includes("_spec.") ||
        base.includes("Test.") ||
        base.startsWith("test_") ||
        base.startsWith("tests/")
      ) {
        return true;
      }
    }

    const testDirs = ["test", "tests", "__tests__", "spec", "specs", "testing"];
    try {
      const rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (entry.isDirectory() && testDirs.includes(entry.name)) {
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  }

  private estimateLinesOfCode(files: string[]): number {
    if (files.length === 0) return 0;

    const codeFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return CODE_EXTENSIONS.has(ext);
    });

    if (codeFiles.length === 0) return 0;

    const sortedBySize = codeFiles
      .map((f) => {
        try {
          return { file: f, size: fs.statSync(f).size };
        } catch {
          return { file: f, size: 0 };
        }
      })
      .filter((entry) => entry.size > 0)
      .sort((a, b) => b.size - a.size);

    const sampleSize = Math.min(sortedBySize.length, 100);
    const sampleFiles = sortedBySize.slice(0, sampleSize);

    let sampledLines = 0;
    let sampledBytes = 0;

    for (const entry of sampleFiles) {
      try {
        const content = fs.readFileSync(entry.file, "utf-8");
        const lines = content.split("\n").length;
        sampledLines += lines;
        sampledBytes += entry.size;
      } catch {
        continue;
      }
    }

    if (sampledBytes === 0) return 0;

    const avgLinesPerByte = sampledLines / sampledBytes;

    let totalBytes = 0;
    for (const entry of sortedBySize) {
      totalBytes += entry.size;
    }

    return Math.round(avgLinesPerByte * totalBytes);
  }

  private computeComplexity(totalFiles: number): ProjectProfile["complexity"] {
    if (totalFiles < COMPLEXITY_THRESHOLDS.tiny) return "tiny";
    if (totalFiles < COMPLEXITY_THRESHOLDS.small) return "small";
    if (totalFiles < COMPLEXITY_THRESHOLDS.medium) return "medium";
    if (totalFiles < COMPLEXITY_THRESHOLDS.large) return "large";
    return "monorepo";
  }

  private computeModelRequirements(
    complexity: ProjectProfile["complexity"],
    languages: LanguageInfo[],
    allFiles: string[],
  ): ModelRequirements {
    const minContextTokens = CONTEXT_TOKEN_MAP[complexity];

    const hasCompiledLanguage = languages.some(
      (l) => COMPILED_LANGUAGES.has(l.language),
    );

    let codeFileCount = 0;
    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      if (CODE_EXTENSIONS.has(ext)) codeFileCount++;
    }
    const codeRatio = allFiles.length > 0 ? codeFileCount / allFiles.length : 0;

    return {
      minContextTokens,
      reasoningNeeded: hasCompiledLanguage,
      toolUseNeeded: true,
      codeHeavy: codeRatio > 0.6,
    };
  }

  private matchesGlob(fileNames: Set<string>, prefix: string): boolean {
    for (const name of fileNames) {
      if (name.startsWith(prefix)) return true;
    }
    return false;
  }

  private tryRead(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  private hasDir(rootDir: string, name: string): boolean {
    try {
      const stat = fs.statSync(path.join(rootDir, name));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}

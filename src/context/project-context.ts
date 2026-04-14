import { ProjectAnalyzer, type ProjectProfile } from "../model/project.js";

export class ProjectContext {
  private rootDir: string;
  private _profile: ProjectProfile | null = null;
  private analyzer: ProjectAnalyzer;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.analyzer = new ProjectAnalyzer();
  }

  get profile(): ProjectProfile | null {
    return this._profile;
  }

  private ensureProfile(): ProjectProfile {
    if (!this._profile) {
      this._profile = this.analyzer.analyze(this.rootDir);
    }
    return this._profile;
  }

  getProjectContextString(): string {
    const p = this.ensureProfile();
    const lines: string[] = [];

    lines.push(`Project: ${p.name}`);

    if (p.languages.length > 0) {
      const langStr = p.languages
        .slice(0, 5)
        .map((l) => `${l.language} (${l.percentage}%)`)
        .join(", ");
      lines.push(`Languages: ${langStr}`);
    }

    if (p.frameworks.length > 0) {
      const fwStr = p.frameworks.map((f) => f.name).join(", ");
      lines.push(`Frameworks: ${fwStr}`);
    }

    if (p.packageManager) {
      lines.push(`Package Manager: ${p.packageManager}`);
    }

    lines.push(`Test: ${this.getTestCommand()}`);
    lines.push(`Build: ${this.getBuildCommand()}`);
    lines.push(`Complexity: ${p.complexity} (${p.totalFiles} files)`);
    lines.push(
      `Has TypeScript: ${p.hasTypeScript}, Has Tests: ${p.hasTests}, Has CI: ${p.hasCI}, Has Docker: ${p.hasDocker}`,
    );

    return lines.join("\n");
  }

  getTestCommand(): string {
    const p = this.ensureProfile();
    if (!p.testFramework) return "echo 'No test framework detected'";

    switch (p.testFramework) {
      case "Vitest":
        return "vitest run";
      case "Jest":
        return "jest";
      case "Mocha":
        return "mocha";
      case "AVA":
        return "ava";
      case "Cypress":
        return "cypress run";
      case "Playwright":
        return "npx playwright test";
      case "pytest":
        return "pytest";
      case "cargo test":
        return "cargo test";
      case "go test":
        return "go test ./...";
      case "RSpec":
        return "bundle exec rspec";
      case "make test":
        return "make test";
      default:
        return p.testFramework;
    }
  }

  getBuildCommand(): string {
    const p = this.ensureProfile();
    if (!p.buildTool) return "echo 'No build tool detected'";

    switch (p.buildTool) {
      case "tsc":
        return "tsc";
      case "webpack":
        return "webpack";
      case "vite":
        return "vite build";
      case "rollup":
        return "rollup -c";
      case "esbuild":
        return "esbuild";
      case "Turborepo":
        return "turbo build";
      case "Parcel":
        return "parcel build";
      case "Grunt":
        return "grunt";
      case "Gulp":
        return "gulp";
      case "make":
        return "make";
      case "CMake":
        return "cmake --build .";
      case "cargo":
        return "cargo build";
      case "Gradle":
        return "gradle build";
      case "Maven":
        return "mvn package";
      case "sbt":
        return "sbt compile";
      case "just":
        return "just build";
      case "Task":
        return "task build";
      case "Bazel":
        return "bazel build //...";
      case "Buck":
        return "buck build //...";
      case "Meson":
        return "meson compile -C builddir";
      case "Zig Build":
        return "zig build";
      default:
        return p.buildTool;
    }
  }

  getLintCommand(): string {
    const p = this.ensureProfile();
    if (p.hasTypeScript) return "npx eslint .";
    if (p.languages.some((l) => l.language === "Python")) return "ruff check .";
    if (p.languages.some((l) => l.language === "Rust")) return "cargo clippy";
    if (p.languages.some((l) => l.language === "Go")) return "golint ./...";
    if (p.languages.some((l) => l.language === "Ruby")) return "rubocop";
    return "echo 'No linter detected'";
  }

  getPackageManager(): string {
    const p = this.ensureProfile();
    return p.packageManager ?? "npm";
  }
}

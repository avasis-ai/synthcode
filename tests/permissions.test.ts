import { describe, it, expect } from "vitest";
import { PermissionEngine } from "../src/permissions/engine.js";

describe("PermissionEngine", () => {
  it("default (no config) allows all tools", () => {
    const engine = new PermissionEngine();
    expect(engine.check("any_tool").allowed).toBe(true);
    expect(engine.check("file_read").allowed).toBe(true);
    expect(engine.check("bash").allowed).toBe(true);
  });

  it("deniedTools blocks specific tools", () => {
    const engine = new PermissionEngine({ deniedTools: ["dangerous_tool"] });
    expect(engine.check("dangerous_tool").allowed).toBe(false);
    expect(engine.check("safe_tool").allowed).toBe(true);
  });

  it("allowedTools allows specific tools even when default is deny", () => {
    const engine = new PermissionEngine({
      defaultAction: "deny",
      allowedTools: ["safe_tool"],
    });
    expect(engine.check("safe_tool").allowed).toBe(true);
    expect(engine.check("other_tool").allowed).toBe(false);
  });

  it("askTools returns reason 'ask'", () => {
    const engine = new PermissionEngine({ askTools: ["risky_tool"] });
    const result = engine.check("risky_tool");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ask");
  });

  it("addAllowed works at runtime", () => {
    const engine = new PermissionEngine({ defaultAction: "deny" });
    expect(engine.check("tool_a").allowed).toBe(false);
    engine.addAllowed("tool_a");
    expect(engine.check("tool_a").allowed).toBe(true);
  });

  it("addDenied works at runtime", () => {
    const engine = new PermissionEngine();
    expect(engine.check("tool_a").allowed).toBe(true);
    engine.addDenied("tool_a");
    expect(engine.check("tool_a").allowed).toBe(false);
  });

  it("addAsk works at runtime", () => {
    const engine = new PermissionEngine();
    engine.addAsk("tool_b");
    const result = engine.check("tool_b");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ask");
  });

  it("pattern matching with * wildcard works", () => {
    const engine = new PermissionEngine({ deniedTools: ["file_*"] });
    expect(engine.check("file_read").allowed).toBe(false);
    expect(engine.check("file_write").allowed).toBe(false);
    expect(engine.check("file_edit").allowed).toBe(false);
    expect(engine.check("bash").allowed).toBe(true);
  });

  it("wildcard * matches zero or more characters", () => {
    const engine = new PermissionEngine({ deniedTools: ["*"] });
    expect(engine.check("anything").allowed).toBe(false);
    expect(engine.check("file_read").allowed).toBe(false);
  });

  it("exact string match works", () => {
    const engine = new PermissionEngine({ allowedTools: ["exact_tool"], defaultAction: "deny" });
    expect(engine.check("exact_tool").allowed).toBe(true);
    expect(engine.check("exact_tool_extra").allowed).toBe(false);
  });

  it("denied takes priority over allowed", () => {
    const engine = new PermissionEngine({
      allowedTools: ["my_tool"],
      deniedTools: ["my_tool"],
    });
    const result = engine.check("my_tool");
    expect(result.allowed).toBe(false);
  });

  it("denied takes priority over allowed with wildcards", () => {
    const engine = new PermissionEngine({
      allowedTools: ["*"],
      deniedTools: ["dangerous_*"],
    });
    expect(engine.check("safe_tool").allowed).toBe(true);
    expect(engine.check("dangerous_tool").allowed).toBe(false);
    expect(engine.check("dangerous_cmd").allowed).toBe(false);
  });

  it("defaultAction 'deny' blocks unmatched tools", () => {
    const engine = new PermissionEngine({ defaultAction: "deny" });
    const result = engine.check("unlisted_tool");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not explicitly allowed");
  });

  it("defaultAction 'ask' returns ask for unmatched tools", () => {
    const engine = new PermissionEngine({ defaultAction: "ask" });
    const result = engine.check("unlisted_tool");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ask");
  });
});

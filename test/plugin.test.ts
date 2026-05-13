import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Plugin structure", () => {
  const indexPath = resolve(__dirname, "../src/index.ts");
  const source = readFileSync(indexPath, "utf-8");

  it("exports a function named cookieConsentPlugin", () => {
    expect(source).toMatch(/export\s+function\s+cookieConsentPlugin/);
  });

  it("has correct plugin id", () => {
    expect(source).toMatch(/id:\s*["']cookie-consent["']/);
  });

  it("uses standard format", () => {
    expect(source).toMatch(/format:\s*["']standard["']/);
  });

  it("uses bare specifier entrypoint for npm publishing", () => {
    expect(source).toContain('"emdash-plugin-cookie-consent/sandbox"');
  });

  it("declares page-fragments capability", () => {
    expect(source).toContain("hooks.page-fragments:register");
  });

  it("declares admin settings page", () => {
    expect(source).toContain("adminPages");
    expect(source).toContain("/settings");
    expect(source).toContain("shield");
  });
});

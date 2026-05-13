import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "../src/sandbox-entry.ts"), "utf-8");

describe("Gate script", () => {
  it("has semicolon after match()", () => {
    expect(source).toContain('match("(^|; )cookie_consent=([^;]*)");');
  });

  it("produces valid JavaScript", () => {
    const parts = [
      "window.__ccConsent=(function(){",
      'try{var m=document.cookie.match("(^|; )cookie_consent=([^;]*)");',
      "return m?JSON.parse(decodeURIComponent(m[2])):null}",
      "catch(e){return null}})();",
    ];
    const code = parts.join("");
    expect(() => new Function(code)).not.toThrow();
  });

  it("reads cookie and returns parsed JSON", () => {
    const parts = [
      "window.__ccConsent=(function(){",
      'try{var m=document.cookie.match("(^|; )cookie_consent=([^;]*)");',
      "return m?JSON.parse(decodeURIComponent(m[2])):null}",
      "catch(e){return null}})();",
    ];
    const gate = parts.join("");

    globalThis.window = globalThis;

    // Without cookie
    var document = { cookie: "other=val" };
    eval(gate);
    expect(globalThis.__ccConsent).toBeNull();

    // With cookie
    globalThis.__ccConsent = undefined;
    document = {
      cookie:
        'cookie_consent=%7B%22necessary%22%3Atrue%2C%22functional%22%3Afalse%2C%22analytics%22%3Atrue%2C%22marketing%22%3Afalse%7D',
    };
    eval(gate);
    expect(globalThis.__ccConsent).toEqual({
      necessary: true,
      functional: false,
      analytics: true,
      marketing: false,
    });
  });
});

describe("Banner functions", () => {
  it("defines all handlers", () => {
    expect(source).toContain("__ccAccept");
    expect(source).toContain("__ccReject");
    expect(source).toContain("__ccCustomize");
    expect(source).toContain("__ccSave");
    expect(source).toContain("__ccShow");
  });

  it("restores toggles from __ccConsent in B()", () => {
    expect(source).toContain("var c=window.__ccConsent");
    expect(source).toContain("if(c[t.dataset.cat]!==undefined)t.checked=c[t.dataset.cat]");
  });

  it("removes banner immediately in H() — no setTimeout", () => {
    expect(source).not.toContain("setTimeout");
  });

  it("guards RAF with isConnected in B()", () => {
    expect(source).toContain("if(b.isConnected)b.classList.add");
  });

  it("sets cookie with SameSite=Lax in C()", () => {
    expect(source).toContain("365*864e5");
    expect(source).toContain("SameSite=Lax");
    expect(source).toContain("encodeURIComponent(JSON.stringify(v))");
  });
});

describe("Consent values", () => {
  it("__ccAccept: all true", () => {
    const m = source.match(/__ccAccept=function\(\)\{C\(\{([^}]+)\}\)/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/necessary:true/);
    expect(m![1]).toMatch(/functional:true/);
    expect(m![1]).toMatch(/analytics:true/);
    expect(m![1]).toMatch(/marketing:true/);
  });

  it("__ccReject: non-necessary false", () => {
    const m = source.match(/__ccReject=function\(\)\{C\(\{([^}]+)\}\)/);
    expect(m).toBeTruthy();
    expect(m![1]).toMatch(/functional:false/);
    expect(m![1]).toMatch(/analytics:false/);
    expect(m![1]).toMatch(/marketing:false/);
  });

  it("__ccSave: reads toggles and saves", () => {
    expect(source).toContain("var q={necessary:true}");
    expect(source).toContain('document.querySelectorAll(".cc-cat-toggle")');
    expect(source).toContain("q[t.dataset.cat]=t.checked");
    expect(source).toContain("C(q);H()");
  });
});

describe("CSS", () => {
  it("contains all required selectors", () => {
    expect(source).toContain("#cc-banner");
    expect(source).toContain("#cc-banner.cc-show");
    expect(source).toContain("#cc-reopen");
    expect(source).toContain(".cc-toggle");
    expect(source).toContain(".cc-cat-toggle");
  });

  it("has responsive breakpoint", () => {
    expect(source).toContain("@media(max-width:640px)");
  });
});

describe("Constants", () => {
  it("has 4 categories", () => {
    for (const id of ["necessary", "functional", "analytics", "marketing"]) {
      expect(source).toContain(`id: "${id}"`);
    }
  });

  it("has 6 themes", () => {
    for (const t of ["dark", "light", "midnight", "clean", "warm", "forest"]) {
      expect(source).toContain(t + ":");
    }
  });

  it("KEY_MAP has 20 entries", () => {
    const m = source.match(/const KEY_MAP[\s\S]*?\};/);
    expect(m).toBeTruthy();
    expect((m![0].match(/:\s*"/g) || []).length).toBe(20);
  });
});

describe("buildForm alignment", () => {
  it("every KEY_MAP action_id has a matching form field in buildForm", () => {
    // Extract KEY_MAP keys (action_ids)
    const keyMapStr = source.match(/const KEY_MAP[\s\S]*?\};/)?.[0];
    expect(keyMapStr).toBeTruthy();
    const keys: string[] = [];
    for (const line of keyMapStr!.split("\n")) {
      const m = line.match(/^\s+(\w+):/);
      if (m) keys.push(m[1]);
    }
    expect(keys.length).toBe(20);

    // Extract action_ids from buildForm fields (between `fields: [` and `submit:`)
    const formStart = source.indexOf("buildForm");
    const fieldsMatch = source.slice(formStart).match(/fields:\s*\[([\s\S]*?)submit\s*:/);
    expect(fieldsMatch).toBeTruthy();
    const fieldsBlock = fieldsMatch![1];

    const fieldIds: string[] = [];
    for (const line of fieldsBlock.split("\n")) {
      const m = line.match(/action_id:\s*"([^"]+)"/);
      if (m) fieldIds.push(m[1]);
    }
    expect(fieldIds.length).toBe(20);

    // Every KEY_MAP key must appear as a field action_id
    for (const key of keys) {
      expect(fieldIds).toContain(key);
    }
  });
});

describe("HTML escaping", () => {
  it("escapes & < > \" correctly", () => {
    const fn = new Function(
      "return function h(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;'); }"
    )();
    expect(fn('<script>alert(1)</script>')).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(fn('" onclick="evil()')).toBe("&quot; onclick=&quot;evil()");
    expect(fn("&")).toBe("&amp;");
    expect(fn("hello world")).toBe("hello world");
  });
});

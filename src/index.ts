import type { PluginDescriptor } from "emdash";

export function cookieConsentPlugin(): PluginDescriptor {
  return {
    id: "cookie-consent",
    version: "1.0.0",
    format: "standard",
    entrypoint: "emdash-plugin-cookie-consent/sandbox",
    capabilities: ["hooks.page-fragments:register"],
    adminPages: [{ path: "/settings", label: "Cookie Consent", icon: "shield" }],
  };
}

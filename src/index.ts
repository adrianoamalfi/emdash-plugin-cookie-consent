import type { PluginDescriptor } from "emdash";

export function cookieConsentPlugin(): PluginDescriptor {
  return {
    id: "cookie-consent",
    version: "0.1.0",
    format: "standard",
    entrypoint: "emdash-plugin-cookie-consent/sandbox",
    options: {},
    capabilities: ["hooks.page-fragments:register"],
    adminPages: [{ path: "/settings", label: "Cookie Consent", icon: "shield" }],
  };
}

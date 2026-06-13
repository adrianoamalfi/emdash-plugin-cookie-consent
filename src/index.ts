import { definePlugin } from "emdash";
import type { PluginDescriptor, PluginContext } from "emdash";

const SETTINGS_KEY = "settings:all";

const DEFAULTS: Settings = {
  enabled: true,
  message: "We use cookies to enhance your experience. Choose which categories you allow.",
  acceptLabel: "Accept All",
  rejectLabel: "Reject All",
  customizeLabel: "Customize",
  footerLinkText: "Cookie Preferences",
  privacyPolicyUrl: "",
  theme: "dark",
  position: "bottom",
  backgroundColor: "#1a1a2e",
  textColor: "#ffffff",
  buttonColor: "#4f46e5",
  catNecessaryName: "Necessary",
  catNecessaryDesc: "Required for basic site functionality. Always active.",
  catFunctionalName: "Functional",
  catFunctionalDesc: "Enables enhanced features like video embeds and live chat.",
  catAnalyticsName: "Analytics",
  catAnalyticsDesc: "Helps us understand how visitors interact with the site.",
  catMarketingName: "Marketing",
  catMarketingDesc: "Used to deliver relevant ads and track social media engagement.",
};

const CATEGORIES = [
  { id: "necessary", nameKey: "catNecessaryName" as const, descKey: "catNecessaryDesc" as const, required: true },
  { id: "functional", nameKey: "catFunctionalName" as const, descKey: "catFunctionalDesc" as const, required: false },
  { id: "analytics", nameKey: "catAnalyticsName" as const, descKey: "catAnalyticsDesc" as const, required: false },
  { id: "marketing", nameKey: "catMarketingName" as const, descKey: "catMarketingDesc" as const, required: false },
] as const;

const THEMES: Record<string, { label: string; backgroundColor: string; textColor: string; buttonColor: string }> = {
  dark: { label: "Dark", backgroundColor: "#1a1a2e", textColor: "#ffffff", buttonColor: "#4f46e5" },
  light: { label: "Light", backgroundColor: "#ffffff", textColor: "#1a1a2e", buttonColor: "#2563eb" },
  midnight: { label: "Midnight", backgroundColor: "#0f172a", textColor: "#e2e8f0", buttonColor: "#3b82f6" },
  clean: { label: "Clean", backgroundColor: "#f8fafc", textColor: "#1e293b", buttonColor: "#0ea5e9" },
  warm: { label: "Warm", backgroundColor: "#1c1917", textColor: "#fafaf9", buttonColor: "#d97706" },
  forest: { label: "Forest", backgroundColor: "#052e16", textColor: "#ecfdf5", buttonColor: "#16a34a" },
};

interface Settings {
  enabled: boolean;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  customizeLabel: string;
  footerLinkText: string;
  privacyPolicyUrl: string;
  theme: string;
  position: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  catNecessaryName: string;
  catNecessaryDesc: string;
  catFunctionalName: string;
  catFunctionalDesc: string;
  catAnalyticsName: string;
  catAnalyticsDesc: string;
  catMarketingName: string;
  catMarketingDesc: string;
}

const KEY_MAP: Record<string, string> = {
  enabled: "enabled",
  message: "message",
  accept_label: "acceptLabel",
  reject_label: "rejectLabel",
  customize_label: "customizeLabel",
  footer_link_text: "footerLinkText",
  privacy_policy_url: "privacyPolicyUrl",
  theme: "theme",
  position: "position",
  bg_color: "backgroundColor",
  text_color: "textColor",
  button_color: "buttonColor",
  cat_necessary_name: "catNecessaryName",
  cat_necessary_desc: "catNecessaryDesc",
  cat_functional_name: "catFunctionalName",
  cat_functional_desc: "catFunctionalDesc",
  cat_analytics_name: "catAnalyticsName",
  cat_analytics_desc: "catAnalyticsDesc",
  cat_marketing_name: "catMarketingName",
  cat_marketing_desc: "catMarketingDesc",
};

async function getSettings(ctx: PluginContext): Promise<Settings> {
  const stored = await ctx.kv.get(SETTINGS_KEY);
  const r: Settings = { ...DEFAULTS };
  if (stored) Object.assign(r, stored as Settings);
  applyThemeDefaults(r);
  return r;
}

function applyThemeDefaults(s: Settings): void {
  if (s.theme && s.theme !== "custom") {
    const t = THEMES[s.theme];
    if (t) {
      s.backgroundColor = t.backgroundColor;
      s.textColor = t.textColor;
      s.buttonColor = t.buttonColor;
    }
  }
}

async function saveSettings(ctx: PluginContext, values: Record<string, any>) {
  const s: Record<string, any> = {};
  for (const [actionId, settingKey] of Object.entries(KEY_MAP)) {
    if (values[actionId] !== undefined) s[settingKey] = values[actionId];
  }
  applyThemeDefaults(s as Settings);
  if (s.privacyPolicyUrl && s.privacyPolicyUrl.trim() !== "") {
    try {
      const url = new URL(s.privacyPolicyUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed for the privacy policy.");
      }
    } catch {
      throw new Error("Privacy Policy URL must be a valid HTTP or HTTPS URL.");
    }
  }
  const hexColor = /^#[0-9a-fA-F]{3,6}$/;
  for (const key of ["backgroundColor", "textColor", "buttonColor"]) {
    if (s[key] && !hexColor.test(s[key])) {
      throw new Error(`Invalid color format for ${key}. Must be a hex color (e.g. #1a1a2e).`);
    }
  }
  await ctx.kv.set(SETTINGS_KEY, s);
}

function h(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function cookieConsentPlugin(): PluginDescriptor {
  return {
    id: "cookie-consent",
    version: "1.1.0",
    format: "native",
    entrypoint: "emdash-plugin-cookie-consent",
    capabilities: ["hooks.page-fragments:register"],
    adminPages: [{ path: "/settings", label: "Cookie Consent", icon: "shield" }],
  };
}

export default definePlugin({
  id: "cookie-consent",
  version: "1.1.0",
  capabilities: ["hooks.page-fragments:register"],

  hooks: {
    "plugin:install": async (_event, ctx) => {
      await ctx.kv.set(SETTINGS_KEY, { ...DEFAULTS });
    },

    "page:fragments": async (_event, ctx) => {
      const s = await getSettings(ctx);
      if (!s.enabled) return null;

      const top = s.position === "top";

      const catRows = CATEGORIES.map(c => {
        const name = s[c.nameKey] || c.id;
        const desc = s[c.descKey] || "";
        const dis = c.required ? " disabled" : "";
        const chk = c.required ? " checked" : "";
        return `<div class="cc-cat"><div class="cc-cat-info"><div class="cc-cat-name">${h(name)}</div><div class="cc-cat-desc">${h(desc)}</div></div><label class="cc-toggle"><input type="checkbox" class="cc-cat-toggle" data-cat="${c.id}"${chk}${dis}><span class="cc-slider"></span></label></div>`;
      }).join("");

      const privacyLink = s.privacyPolicyUrl
        ? `<a href="${h(s.privacyPolicyUrl)}" class="cc-btn cc-privacy" target="_blank" rel="noopener">Privacy Policy</a>`
        : "";

      const bannerHTML = `<div class="cc-main"><p>${h(s.message)}</p><div class="cc-btns"><button class="cc-btn cc-reject" onclick="__ccReject()">${h(s.rejectLabel)}</button><button class="cc-btn cc-customize" onclick="__ccCustomize()">${h(s.customizeLabel)}</button><button class="cc-btn cc-accept" onclick="__ccAccept()">${h(s.acceptLabel)}</button></div></div><div class="cc-detail"><div class="cc-cats">${catRows}</div><div class="cc-detail-btns">${privacyLink}<button class="cc-btn cc-save" onclick="__ccSave()">Save Preferences</button></div></div>`;

      const css = [
        `#cc-banner{position:fixed;${top?"top":"bottom"}:0;left:0;right:0;background:${s.backgroundColor};color:${s.textColor};z-index:9999;font-family:system-ui,sans-serif;font-size:.9rem;transform:translateY(${top?"-100%":"100%"});transition:transform .3s ease;box-shadow:${top?"0 2px 10px":"0 -2px 10px"} rgba(0,0,0,.15)}`,
        `#cc-banner.cc-show{transform:translateY(0)}`,
        `#cc-banner .cc-main{padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center;gap:1rem}`,
        `#cc-banner .cc-main p{margin:0;line-height:1.5}`,
        `#cc-banner .cc-btns{display:flex;gap:.5rem;flex-shrink:0}`,
        `.cc-btn{padding:.5rem 1rem;border:none;border-radius:4px;cursor:pointer;font-size:.85rem;font-weight:500;transition:opacity .15s;text-decoration:none;display:inline-block}`,
        `.cc-btn:hover{opacity:.9}`,
        `.cc-accept{background:${s.buttonColor};color:#fff}`,
        `.cc-reject,.cc-customize,.cc-save{background:transparent;color:${s.textColor};border:1px solid ${s.textColor}44}`,
        `.cc-reject:hover,.cc-customize:hover,.cc-save:hover{background:${s.textColor}11}`,
        `.cc-privacy{background:transparent;color:${s.textColor};border:1px solid ${s.textColor}44}`,
        `#cc-banner .cc-detail{display:none;padding:0 2rem 1rem}`,
        `#cc-banner.cc-expanded .cc-detail{display:block}`,
        `#cc-banner .cc-cats{display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem}`,
        `.cc-cat{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.6rem .75rem;border-radius:4px;background:${s.textColor}11}`,
        `.cc-cat-info{flex:1;min-width:0}`,
        `.cc-cat-name{font-weight:600;font-size:.85rem}`,
        `.cc-cat-desc{font-size:.75rem;opacity:.8;margin-top:2px}`,
        `.cc-toggle{position:relative;display:inline-block;width:40px;height:22px;flex-shrink:0}`,
        `.cc-toggle input{opacity:0;width:0;height:0}`,
        `.cc-toggle .cc-slider{position:absolute;cursor:pointer;inset:0;background:${s.textColor}44;transition:.2s;border-radius:22px}`,
        `.cc-toggle .cc-slider::before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;transition:.2s;border-radius:50%}`,
        `.cc-toggle input:checked+.cc-slider{background:${s.buttonColor}}`,
        `.cc-toggle input:checked+.cc-slider::before{transform:translateX(18px)}`,
        `.cc-toggle input:disabled+.cc-slider{opacity:.5;cursor:not-allowed}`,
        `.cc-detail-btns{display:flex;gap:.5rem;justify-content:flex-end;align-items:center}`,
        `#cc-reopen{position:fixed;${top?"top":"bottom"}:1rem;left:1rem;z-index:9998;font-size:.75rem;padding:.4rem .75rem;cursor:pointer;background:${s.backgroundColor};color:${s.textColor};border:1px solid ${s.textColor}33;border-radius:4px;font-family:system-ui,sans-serif;display:none;transition:opacity .15s}`,
        `#cc-reopen:hover{opacity:.85}`,
        `@media(max-width:640px){#cc-banner .cc-main{flex-direction:column;text-align:center;padding:.75rem 1rem}#cc-banner .cc-btns{width:100%;flex-wrap:wrap;justify-content:center}#cc-banner .cc-detail{padding:0 1rem .75rem}.cc-cat{flex-wrap:wrap;gap:.5rem}.cc-detail-btns{flex-wrap:wrap;justify-content:center}}`,
      ].join("");

      const gate = [
        `window.__ccConsent=(function(){`,
        `try{var m=document.cookie.match("(^|; )cookie_consent=([^;]*)");`,
        `return m?JSON.parse(decodeURIComponent(m[2])):null}`,
        `catch(e){return null}})();`,
      ].join("");

      const allCatIds = CATEGORIES.map(c => c.id);
      const requiredCatIds = CATEGORIES.filter(c => c.required).map(c => c.id);
      const optionalCatIds = CATEGORIES.filter(c => !c.required).map(c => c.id);

      const bannerJs = [
        `(function(){`,
        `var k="cookie_consent";`,
        `var p=window.__ccConsent;`,
        `function C(v){window.__ccConsent=v;var e=new Date();e.setTime(e.getTime()+365*864e5);document.cookie=k+"="+encodeURIComponent(JSON.stringify(v))+";path=/;expires="+e.toUTCString()+";SameSite=Lax;Secure"}`,
        `var html=${JSON.stringify(bannerHTML)};`,
        `function B(){var b=document.getElementById("cc-banner");if(!b){b=document.createElement("div");b.id="cc-banner";document.body.appendChild(b)}b.innerHTML=html;var c=window.__ccConsent;if(c){document.querySelectorAll(".cc-cat-toggle").forEach(function(t){if(c[t.dataset.cat]!==undefined)t.checked=c[t.dataset.cat]})}requestAnimationFrame(function(){if(b.isConnected)b.classList.add("cc-show")})}`,
        `function H(){var b=document.getElementById("cc-banner");if(b){b.remove();var e=document.getElementById("cc-reopen");if(e)e.style.display="block"}}`,
        `if(!p)B();`,
        `window.__ccAccept=function(){C({${allCatIds.map(id => `${id}:true`).join(",")}});H()};`,
        `window.__ccReject=function(){C({${requiredCatIds.map(id => `${id}:true`).join(",")},${optionalCatIds.map(id => `${id}:false`).join(",")}});H()};`,
        `window.__ccCustomize=function(){var b=document.getElementById("cc-banner");if(b)b.classList.add("cc-expanded")};`,
        `window.__ccSave=function(){var q={${requiredCatIds.map(id => `${id}:true`).join(",")}};document.querySelectorAll(".cc-cat-toggle").forEach(function(t){q[t.dataset.cat]=t.checked});C(q);H()};`,
        `window.__ccShow=function(){var r=document.getElementById("cc-reopen");if(r)r.style.display="none";B()};`,
        `var r=document.createElement("button");r.id="cc-reopen";r.textContent=${JSON.stringify(s.footerLinkText)};r.onclick=function(){window.__ccShow()};r.style.display=p?"block":"none";document.body.appendChild(r);`,
        `})();`,
      ].join("");

      return [
        { kind: "html", placement: "head", html: `<style>${css}</style>` },
        { kind: "inline-script", placement: "head", code: gate },
        { kind: "inline-script", placement: "body:end", code: bannerJs },
      ];
    },
  },

  routes: {
    admin: {
      handler: async (ctx) => {
        const interaction = ctx.input as Record<string, any>;

        if (interaction.type === "page_load") {
          return { blocks: buildForm(await getSettings(ctx)) };
        }

        if (interaction.type === "form_submit" && interaction.action_id === "save") {
          try {
            await saveSettings(ctx, interaction.values ?? {});
            return {
              blocks: [
                { type: "banner", title: "Settings saved successfully.", variant: "default" },
                ...buildForm(await getSettings(ctx)),
              ],
            };
          } catch (error) {
            return {
              blocks: [
                { type: "banner", title: "Failed to save settings. Please check your inputs and try again.", variant: "error" },
                ...buildForm(await getSettings(ctx)),
              ],
            };
          }
        }

        return { blocks: [{ type: "header", text: "Cookie Consent Settings" }] };
      },
    },
  },
});

function buildForm(s: Settings) {
  return [
    { type: "header", text: "Cookie Consent Settings" },
    { type: "context", text: "Configure the cookie consent popup displayed on your site." },
    {
      type: "form", block_id: "settings",
      fields: [
        { type: "toggle", action_id: "enabled", label: "Enabled", initial_value: s.enabled },
        { type: "text_input", action_id: "message", label: "Consent Message", multiline: true, initial_value: s.message },
        { type: "text_input", action_id: "accept_label", label: "Accept All Label", initial_value: s.acceptLabel },
        { type: "text_input", action_id: "reject_label", label: "Reject All Label", initial_value: s.rejectLabel },
        { type: "text_input", action_id: "customize_label", label: "Customize Label", initial_value: s.customizeLabel },
        { type: "text_input", action_id: "footer_link_text", label: "Footer Reopen Text", initial_value: s.footerLinkText },
        { type: "text_input", action_id: "privacy_policy_url", label: "Privacy Policy URL", placeholder: "https://", initial_value: s.privacyPolicyUrl },
        {
          type: "select", action_id: "position", label: "Banner Position", initial_value: s.position,
          options: [
            { value: "bottom", label: "Bottom" },
            { value: "top", label: "Top" },
          ],
        },
        {
          type: "select", action_id: "theme", label: "Color Theme", initial_value: s.theme,
          options: [
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "midnight", label: "Midnight" },
            { value: "clean", label: "Clean" },
            { value: "warm", label: "Warm" },
            { value: "forest", label: "Forest" },
            { value: "custom", label: "Custom Colors" },
          ],
        },
        { type: "text_input", action_id: "bg_color", label: "Background Color", placeholder: "#1a1a2e", initial_value: s.backgroundColor },
        { type: "text_input", action_id: "text_color", label: "Text Color", placeholder: "#ffffff", initial_value: s.textColor },
        { type: "text_input", action_id: "button_color", label: "Button Color", placeholder: "#4f46e5", initial_value: s.buttonColor },
        { type: "text_input", action_id: "cat_necessary_name", label: "Necessary — Name", initial_value: s.catNecessaryName },
        { type: "text_input", action_id: "cat_necessary_desc", label: "Necessary — Description", initial_value: s.catNecessaryDesc },
        { type: "text_input", action_id: "cat_functional_name", label: "Functional — Name", initial_value: s.catFunctionalName },
        { type: "text_input", action_id: "cat_functional_desc", label: "Functional — Description", initial_value: s.catFunctionalDesc },
        { type: "text_input", action_id: "cat_analytics_name", label: "Analytics — Name", initial_value: s.catAnalyticsName },
        { type: "text_input", action_id: "cat_analytics_desc", label: "Analytics — Description", initial_value: s.catAnalyticsDesc },
        { type: "text_input", action_id: "cat_marketing_name", label: "Marketing — Name", initial_value: s.catMarketingName },
        { type: "text_input", action_id: "cat_marketing_desc", label: "Marketing — Description", initial_value: s.catMarketingDesc },
      ],
      submit: { label: "Save", action_id: "save" },
    },
  ];
}

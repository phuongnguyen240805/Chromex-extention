/**
 * Manifest configuration for Social AIO
 * Note: Plasmo primarily uses package.json for manifest settings, 
 * but this file can be used to centralize complex configuration logic.
 */
export const manifestConfig = {
  permissions: ["storage", "sidePanel", "notifications", "tabs", "scripting", "declarativeNetRequest"],
  host_permissions: ["<all_urls>"],
  declarative_net_request: {
    rule_resources: [
      {
        id: "rules_1",
        enabled: false,
        path: "src/background/rules/rules_1.json"
      },
      {
        id: "rules_phishing_1",
        enabled: true,
        path: "src/background/rules/rules_phishing_1.json"
      },
      {
        id: "rules_phishing_2",
        enabled: true,
        path: "src/background/rules/rules_phishing_2.json"
      }
    ]
  },
  action: {
    default_popup: "popup.html",
    default_icon: "assets/icon.png"
  },
  side_panel: {
    default_path: "sidepanel.html"
  },
  web_accessible_resources: [
    {
      resources: ["*.js", "*.css", "assets/*", "scripts/*", "locales/*"],
      matches: ["<all_urls>"]
    }
  ]
};

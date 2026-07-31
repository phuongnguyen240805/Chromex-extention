export const initializeFacebookBackground = () => {
  console.log("🛡️ Facebook Platform: Dedicated Background initializing...");

  const PHISHING_RULESETS = ["rules_1", "rules_phishing_1", "rules_phishing_2"];

  const syncPhishingRules = (antiPhishing: boolean) => {
    if (antiPhishing) {
      chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: PHISHING_RULESETS
      }).catch(err => console.error("Failed to enable FB phishing rules:", err));
    } else {
      chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: PHISHING_RULESETS
      }).catch(err => console.error("Failed to disable FB phishing rules:", err));
    }
  };

  // Listen for storage changes specifically for Anti-Phishing toggle
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["wsk-state"]) {
      try {
        const rawVal = changes["wsk-state"].newValue;
        const newState = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
        if (newState && newState.state) {
          syncPhishingRules(!!newState.state.antiPhishing);
        }
      } catch (err) {
        console.error("FB Background: Failed to parse wsk-state on change:", err);
      }
    }
  });

  // Initial sync on background startup
  chrome.storage.local.get("wsk-state", (data) => {
    try {
      const rawVal = data["wsk-state"];
      const stateData = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
      if (stateData && stateData.state) {
        syncPhishingRules(!!stateData.state.antiPhishing);
      }
    } catch (err) {
      console.error("FB Background: Failed to parse wsk-state on startup:", err);
    }
  });

  console.log("✅ Facebook Platform: Dedicated Background completely active.");
};

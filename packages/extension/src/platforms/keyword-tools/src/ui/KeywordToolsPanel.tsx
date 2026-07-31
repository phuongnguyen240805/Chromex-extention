import React, { useEffect, useState } from "react";
import {
  Search, FileText, Globe, BarChart3, TrendingUp, Star,
  Code2, Layout, Trophy, Building2, Link2, Swords, Shield,
  Truck, Beer, Settings, ExternalLink
} from "lucide-react";

interface KeywordToolsPanelProps {
  onSelectTool?: (tool: any) => void;
}

interface Settings {
  enabled: boolean;
  apiKey: string;
  country: string;
}

export const KeywordToolsPanel: React.FC<KeywordToolsPanelProps> = ({ onSelectTool }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["settings"], (data) => {
      if (data.settings) {
        setSettings(data.settings);
      } else {
        setSettings({ enabled: true, apiKey: "", country: "" });
      }
    });

    chrome.runtime.sendMessage({ cmd: "api.getCountries" }, (res) => {
      if (res && !res.error) setCountries(res);
    });
  }, []);

  useEffect(() => {
    if (settings?.apiKey) {
      chrome.runtime.sendMessage({ cmd: "api.getPlan" }, (res) => {
        if (res && !res.error) setPlan(res.data);
        else setPlan(null);
      });
    }
  }, [settings?.apiKey]);

  const handleToggleState = () => {
    if (!settings) return;
    const nextState = !settings.enabled;
    chrome.runtime.sendMessage({ cmd: "app.setState", data: { state: nextState } }, () => {
      setSettings({ ...settings, enabled: nextState });
    });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!settings) return;
    const nextCountry = e.target.value;
    const updated = { ...settings, country: nextCountry };
    setSettings(updated);
    chrome.storage.local.set({ settings: updated }, () => {
      chrome.runtime.sendMessage({ cmd: "settings.update" });
    });
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const openPage = (pageName: string, extras: Record<string, string> = {}) => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    const params = new URLSearchParams({ page: pageName, ...extras });
    chrome.tabs.create({
      url: chrome.runtime.getURL(`tabs/page.html?${params.toString()}`)
    });
  };

  const handleAnalyzePageHTML = () => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.startsWith("http")) {
        showError("Please open a valid website before using page analyzer.");
        return;
      }
      const encodedId = btoa(activeTab.url);
      chrome.runtime.sendMessage(
        { cmd: "urlToAnalyze", data: { id: encodedId, url: activeTab.url } },
        () => {
          chrome.tabs.create({
            url: chrome.runtime.getURL(`tabs/page.html?page=analyze&id=${encodeURIComponent(encodedId)}`)
          });
        }
      );
    });
  };

  const handleAnalyzePageDOM = () => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.startsWith("http") || !activeTab.id) {
        showError("Please open a valid website before using page DOM analyzer.");
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: () => {
            chrome.runtime.sendMessage({
              cmd: "page.dom",
              data: { url: window.location.href, dom: document.documentElement.outerHTML }
            });
          }
        },
        () => {
          const encodedId = btoa(activeTab.url || "");
          chrome.runtime.sendMessage(
            { cmd: "urlToAnalyze", data: { id: encodedId, url: activeTab.url } },
            () => {
              chrome.tabs.create({
                url: chrome.runtime.getURL(`tabs/page.html?page=analyze&id=${encodeURIComponent(encodedId)}`)
              });
            }
          );
        }
      );
    });
  };

  const handleOrganicRanking = (target: "domain" | "url") => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.startsWith("http")) {
        showError("Please open a valid website to retrieve rankings.");
        return;
      }
      const encodedId = btoa(activeTab.url);
      chrome.tabs.create({
        url: chrome.runtime.getURL(`tabs/page.html?page=keywords&target=${target}&id=${encodeURIComponent(encodedId)}`)
      });
    });
  };

  const handleTopRankingPages = () => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.startsWith("http")) {
        showError("Please open a valid website.");
        return;
      }
      const encodedId = btoa(activeTab.url);
      chrome.tabs.create({
        url: chrome.runtime.getURL(`tabs/page.html?page=toppages&id=${encodeURIComponent(encodedId)}`)
      });
    });
  };

  const handleKeywordKeg = () => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.create({
      url: `https://keywordseverywhere.com/ctl/bulk?apiKey=${settings.apiKey || ""}`
    });
  };

  const tools = [
    { icon: FileText, label: "Bulk Keywords", action: () => openPage("manual"), color: "#F59E0B" },
    { icon: TrendingUp, label: "Bulk Trends", action: () => openPage("trends"), color: "#3B82F6" },
    { icon: Star, label: "Favorite Keywords", action: () => openPage("favorites"), color: "#EAB308" },
    { icon: Search, label: "Analyze HTML", action: handleAnalyzePageHTML, color: "#06B6D4" },
    { icon: Code2, label: "Analyze DOM", action: handleAnalyzePageDOM, color: "#8B5CF6" },
    { icon: Trophy, label: "Top Pages", action: handleTopRankingPages, color: "#F97316" },
    { icon: Building2, label: "Organic Domain", action: () => handleOrganicRanking("domain"), color: "#10B981" },
    { icon: Link2, label: "Organic URL", action: () => handleOrganicRanking("url"), color: "#6366F1" },
    { icon: Swords, label: "Gap Domain", action: () => openPage("gap", { type: "website" }), color: "#EC4899" },
    { icon: Shield, label: "Gap URL", action: () => openPage("gap", { type: "url" }), color: "#14B8A6" },
    { icon: Truck, label: "Traffic Domain", action: () => openPage("bulkTraffic", { target: "domain" }), color: "#F43F5E" },
    { icon: Beer, label: "Keyword Keg", action: handleKeywordKeg, color: "#D97706" },
  ];

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-10 bg-[rgb(var(--bg-main))]">
        <span className="text-xs font-semibold text-[rgb(var(--text-muted))]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[rgb(var(--bg-main))]">
      <div className="flex-1 min-h-0 pointer-events-auto">
        <div className="py-2">

          {/* Status Header */}
          <div className="px-5 py-3">
            <div className="flex items-center justify-between bg-[rgb(var(--bg-card))] border border-[rgba(var(--border-main),var(--border-opacity))] p-3 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.enabled}
                      onChange={handleToggleState}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-300 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                  <span className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                    {settings.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                {plan ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg">
                    {(plan.credits || 0).toLocaleString()} credits
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[rgb(var(--text-muted))]">
                    No API key
                  </span>
                )}
              </div>
              <select
                value={settings.country}
                onChange={handleCountryChange}
                disabled={!settings.enabled}
                className="bg-[rgb(var(--bg-main))] border border-[rgba(var(--border-main),var(--border-opacity))] text-[10px] font-bold text-[rgb(var(--text-muted))] rounded-lg px-2 py-1 outline-none max-w-[120px] disabled:opacity-50"
              >
                <option value="">Global</option>
                {Object.entries(countries).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mx-5 mb-2 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center text-[10px] font-bold text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Tools Grid */}
          <div className="px-5 py-2">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <h3 className="text-[10px] font-bold text-[rgb(var(--text-muted))] uppercase tracking-[0.2em]">Keyword Tools</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  onClick={tool.action}
                  disabled={!settings.enabled}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-[rgba(var(--border-main),var(--border-opacity))] bg-[rgb(var(--bg-card))] hover:bg-[rgb(var(--bg-card-hover))] hover:border-blue-500/30 hover:shadow-lg transition-all active:scale-[0.98] group disabled:opacity-40 disabled:pointer-events-none"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${tool.color}15` }}
                  >
                    <tool.icon size={18} style={{ color: tool.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-[rgb(var(--text-main))] text-left leading-tight">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="px-5 py-3 mt-2 border-t border-[rgba(var(--border-main),var(--border-opacity))]">
            <div className="flex items-center justify-between">
              <a
                href="https://keywordseverywhere.com/ke/3/invoices.php"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-[rgb(var(--text-muted))] hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                Invoices <ExternalLink size={10} />
              </a>
              <a
                href="https://keywordseverywhere.com/contact.html"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-[rgb(var(--text-muted))] hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                Support <ExternalLink size={10} />
              </a>
              <button
                onClick={() => {
                  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
                }}
                className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Settings Panel
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

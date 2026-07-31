import React, { useEffect, useState } from "react";
import { SourceList } from "./services/SourceList";
import "../../../style.css";

interface Settings {
  enabled: boolean;
  apiKey: string;
  country: string;
  currency: string;
}

export default function Popup() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["settings"], (data) => {
      if (data.settings) {
        setSettings(data.settings);
      } else {
        setSettings({
          enabled: true,
          apiKey: "",
          country: "",
          currency: ""
        });
      }
    });

    chrome.runtime.sendMessage({ cmd: "api.getCountries" }, (res) => {
      if (res && !res.error) setCountries(res);
    });
  }, []);

  useEffect(() => {
    if (settings?.apiKey) {
      chrome.runtime.sendMessage({ cmd: "api.getPlan" }, (res) => {
        if (res && !res.error) {
          setPlan(res.data);
        } else {
          setPlan(null);
        }
      });
    }
  }, [settings?.apiKey]);

  const handleToggleState = () => {
    if (!settings) return;
    const nextState = !settings.enabled;
    chrome.runtime.sendMessage({ cmd: "app.setState", data: { state: nextState } }, (res) => {
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

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const handleAnalyzePageHTML = () => {
    if (!settings?.enabled) {
      showError("Please enable the extension to use this feature.");
      return;
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.url?.startsWith("http")) {
        alert("Please open a valid website before using page analyzer.");
        return;
      }
      const encodedId = btoa(activeTab.url);
      chrome.runtime.sendMessage(
        {
          cmd: "urlToAnalyze",
          data: {
            id: encodedId,
            url: activeTab.url
          }
        },
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
        alert("Please open a valid website before using page DOM analyzer.");
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          func: () => {
            chrome.runtime.sendMessage({
              cmd: "page.dom",
              data: {
                url: window.location.href,
                dom: document.documentElement.outerHTML
              }
            });
          }
        },
        () => {
          const encodedId = btoa(activeTab.url || "");
          chrome.runtime.sendMessage(
            {
              cmd: "urlToAnalyze",
              data: {
                id: encodedId,
                url: activeTab.url
              }
            },
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
        alert("Please open a valid website to retrieve rankings.");
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
        alert("Please open a valid website.");
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

  if (!settings) {
    return (
      <div className="w-[380px] h-[480px] bg-[#0F172A] text-slate-200 flex items-center justify-center font-sans">
        <span className="text-xs font-semibold">Loading console options...</span>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#0F172A] text-slate-200 select-none font-sans flex flex-col min-h-[480px] border border-slate-800/80 shadow-2xl">
      
      {/* Top Header */}
      <header className="p-4 bg-slate-900/60 border-b border-slate-850 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              className="h-7 w-auto filter drop-shadow-[0_0_6px_rgba(14,165,233,0.3)]"
              src="https://keywordseverywhere.com/img/keywords-everywhere-logo.png"
              alt="Keywords Everywhere"
            />
            <div>
              <h1 className="text-xs font-black tracking-tight text-white leading-none">Keywords Everywhere</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Control Panel</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleState}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-350 after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl">
          <div className="truncate pr-2">
            {plan ? (
              <div>
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider leading-none">Paid plan enabled</p>
                <p className="text-[10px] text-slate-300 font-bold truncate mt-0.5">{(plan.credits || 0).toLocaleString()} credits remaining</p>
              </div>
            ) : (
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider leading-none">No active api key</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Metrics limited</p>
              </div>
            )}
          </div>

          <select
            value={settings.country}
            onChange={handleCountryChange}
            disabled={!settings.enabled}
            className="bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg px-2 py-1 outline-none max-w-[130px] disabled:opacity-50"
          >
            <option value="">Global Filter</option>
            {Object.entries(countries).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-900/60 p-2.5 rounded-lg text-center text-[10px] font-bold text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          
          <button
            onClick={() => openPage("manual")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">📂</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Bulk Keywords</span>
          </button>

          <button
            onClick={() => openPage("trends")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">📈</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Bulk Trends</span>
          </button>

          <button
            onClick={() => openPage("favorites")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">⭐</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Favorite Keywords</span>
          </button>

          <button
            onClick={handleAnalyzePageHTML}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🔍</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Analyze HTML</span>
          </button>

          <button
            onClick={handleAnalyzePageDOM}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🕸️</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Analyze DOM</span>
          </button>

          <button
            onClick={handleTopRankingPages}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🏆</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Top Pages</span>
          </button>

          <button
            onClick={() => handleOrganicRanking("domain")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🏢</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Organic Domain</span>
          </button>

          <button
            onClick={() => handleOrganicRanking("url")}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">📄</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Organic URL</span>
          </button>

          <button
            onClick={() => openPage("gap", { type: "website" })}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">⚔️</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Gap Domain</span>
          </button>

          <button
            onClick={() => openPage("gap", { type: "url" })}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🛡️</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Gap URL</span>
          </button>

          <button
            onClick={() => openPage("bulkTraffic", { target: "domain" })}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🚦</span>
            <span className="text-[9px] font-extrabold text-slate-300 leading-tight">Traffic Domain</span>
          </button>

          <button
            onClick={handleKeywordKeg}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/60 transition-colors group text-center font-bold text-amber-400 border-amber-950/20 shadow-inner"
          >
            <span className="text-base group-hover:scale-110 transition-transform">🍺</span>
            <span className="text-[9px] font-extrabold leading-tight">Keyword Keg</span>
          </button>

        </div>
      </main>

      {/* Footer Nav links */}
      <footer className="p-3 bg-slate-900/40 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-bold px-5">
        <a
          href="https://keywordseverywhere.com/ke/3/invoices.php"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          Invoices
        </a>
        <a
          href="https://keywordseverywhere.com/contact.html"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          Contact Support
        </a>
        <button
          onClick={() => {
            chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
          }}
          className="hover:text-sky-400 transition-colors font-extrabold"
        >
          Settings Panel
        </button>
      </footer>

    </div>
  );
}

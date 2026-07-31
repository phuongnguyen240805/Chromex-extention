import React, { useEffect, useState } from "react";
import { SourceList } from "./services/SourceList";
import "../../../style.css";

interface MetricsList {
  vol: boolean;
  cpc: boolean;
  comp: boolean;
  trend: boolean;
}

interface Settings {
  enabled: boolean;
  apiKey: string;
  country: string;
  currency: string;
  dataSource: string;
  metricsList: MetricsList;
  sourceList: Record<string, boolean>;
  googlePos: string;
  showAddAllButton: boolean;
  showExportButton: boolean;
  showAutocompleteButton: boolean;
  showDifficultyMetrics: boolean;
  showMetricsForSuggestions: boolean;
  showChartsForGoogleTrends: boolean;
  showGoogleTraffic: boolean;
  showGoogleMetrics: boolean;
  showGoogleTrendChart: boolean;
  showYoutubeAdvancedMetrics: boolean;
  showChatGPTactions: boolean;
  showPinterestPinMetrics: boolean;
  googleTrendChartDefaultTime: string;
  widgetKeywordsPerPage: string;
  widgetBacklinksPerPage: number;
  highlightVolume: boolean;
  highlightVolumeValue: number;
  highlightVolumeCond: string;
  highlightCPC: boolean;
  highlightCPCValue: number;
  highlightCPCCond: string;
  highlightComp: boolean;
  highlightCompValue: number;
  highlightCompCond: string;
  highlightVolumeValueSec: string;
  highlightVolumeCondSec: string;
  highlightCPCValueSec: string;
  highlightCPCCondSec: string;
  highlightCompValueSec: string;
  highlightCompCondSec: string;
  highlightColor: string;
  defaultPopupAction: string;
}

export default function OptionsTab() {
  const [activeTab, setActiveTab] = useState<string>("api-settings");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | ""; text: string }>({ type: "", text: "" });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["settings"], (data) => {
      if (data.settings) {
        setSettings(data.settings);
      } else {
        chrome.runtime.sendMessage({ cmd: "settings.reset", data: { apiKey: "" } }, () => {
          chrome.storage.local.get(["settings"], (fresh) => {
            setSettings(fresh.settings);
          });
        });
      }
    });

    chrome.runtime.sendMessage({ cmd: "api.getCountries" }, (res) => {
      if (res && !res.error) setCountries(res);
    });

    chrome.runtime.sendMessage({ cmd: "api.getCurrencies" }, (res) => {
      if (res && !res.error) setCurrencies(res);
    });
  }, []);

  useEffect(() => {
    if (settings?.apiKey) {
      fetchPlan();
    }
  }, [settings?.apiKey]);

  const fetchPlan = () => {
    chrome.runtime.sendMessage({ cmd: "api.getPlan" }, (res) => {
      if (res && !res.error) {
        setPlan(res.data);
      } else {
        setPlan(null);
      }
    });
  };

  const handleSave = (newSettings: Settings) => {
    setSettings(newSettings);
    chrome.storage.local.set({ settings: newSettings }, () => {
      chrome.runtime.sendMessage({ cmd: "settings.update" });
    });
  };

  const validateApiKey = () => {
    if (!settings?.apiKey) {
      setStatusMsg({ type: "error", text: "API key is empty" });
      return;
    }
    chrome.runtime.sendMessage({ cmd: "api.checkApiKey", data: { key: settings.apiKey } }, (json) => {
      if (json.error) {
        setStatusMsg({ type: "error", text: typeof json.data === "string" ? json.data : "Invalid API key" });
      } else {
        fetchPlan();
        if (json.data) {
          setStatusMsg({ type: "success", text: "Your API key has been successfully validated" });
        } else {
          setStatusMsg({
            type: "error",
            text: "The API Key is not valid. If you generated it recently, please wait 10 minutes."
          });
        }
      }
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
    });
  };

  const resetSettings = () => {
    chrome.runtime.sendMessage({ cmd: "settings.reset", data: { apiKey: settings?.apiKey || "" } }, () => {
      chrome.storage.local.get(["settings"], (fresh) => {
        setSettings(fresh.settings);
        setShowResetModal(false);
        setStatusMsg({ type: "success", text: "Settings reset successfully!" });
        setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
      });
    });
  };

  const exportSettings = (includeApiKey: boolean) => {
    if (!settings) return;
    const exportData = { ...settings };
    const today = new Date().toISOString().slice(0, 10);
    let filename = "";

    if (!includeApiKey) {
      delete (exportData as any).apiKey;
      filename = `ke-settings-${today}-no-api-key.json`;
    } else {
      filename = `ke-settings-${today}-contains-api-key.json`;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (settings) {
            const apiKey = settings.apiKey;
            const updated = { ...settings, ...imported };
            if (apiKey && !updated.apiKey) updated.apiKey = apiKey;
            handleSave(updated);
            setStatusMsg({ type: "success", text: "Settings imported successfully!" });
            setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
          }
        } catch (err) {
          alert("Failed to import settings: Invalid JSON format.");
        }
      };
      reader.readAsText(file);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-sm">Loading options configuration...</span>
        </div>
      </div>
    );
  }

  const toggleSource = (key: string) => {
    const updatedSources = { ...settings.sourceList, [key]: !settings.sourceList[key] };
    handleSave({ ...settings, sourceList: updatedSources });
  };

  const toggleMetric = (key: keyof MetricsList) => {
    const updatedMetrics = { ...settings.metricsList, [key]: !settings.metricsList[key] };
    handleSave({ ...settings, metricsList: updatedMetrics });
  };

  const toggleSectionSources = (type: "site" | "widget", checked: boolean) => {
    const updatedSources = { ...settings.sourceList };
    Object.keys(SourceList).forEach((key) => {
      if (SourceList[key].type === type) {
        updatedSources[key] = checked;
      }
    });
    handleSave({ ...settings, sourceList: updatedSources });
  };

  return (
    <div className="text-slate-200 bg-[#0F172A] min-h-screen flex select-text font-sans">
      
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/60 p-6 flex flex-col gap-6 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <img
            className="h-9 w-auto filter drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]"
            src="https://keywordseverywhere.com/img/keywords-everywhere-logo.png"
            alt="Keywords Everywhere"
          />
          <div>
            <p className="text-base font-black tracking-tight text-white leading-tight">Keywords Everywhere</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Settings Panel</p>
          </div>
        </div>

        {/* Plan Widget */}
        {plan ? (
          <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-2 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400">👑</div>
              <div className="truncate">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{plan.plan || "Paid Plan"}</p>
                <p className="text-[11px] text-slate-400 truncate" title={plan.email}>{plan.email}</p>
              </div>
            </div>
            <div className="text-center bg-amber-950/40 border border-amber-900/50 py-1.5 rounded-lg text-xs font-extrabold text-amber-300">
              {(plan.credits || 0).toLocaleString()} credits left
            </div>
          </div>
        ) : (
          <a
            href="https://keywordseverywhere.com/first-install-addon.html"
            target="_blank"
            rel="noreferrer"
            className="bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🔑</span>
            <div>
              <p className="text-xs font-extrabold text-sky-400">Get API Key</p>
              <p className="text-[10px] text-slate-400 leading-normal">Enter key to access paid indicators</p>
            </div>
          </a>
        )}

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1 overflow-y-auto pr-1">
          {[
            { id: "api-settings", label: "API Settings", icon: "⚙️" },
            { id: "data-sources", label: "Data Sources", icon: "🌐" },
            { id: "enable-disable-metrics", label: "Metrics Visibility", icon: "📈" },
            { id: "metrics-highlighting", label: "Highlighting Rules", icon: "✨" },
            { id: "supported-websites", label: "Supported Websites", icon: "🖥️" },
            { id: "credit-usage-for-widgets", label: "Widgets & Credits", icon: "⏳" },
            { id: "miscellaneous-settings", label: "Miscellaneous", icon: "🛠️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                activeTab === tab.id
                  ? "bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-md shadow-sky-500/5"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto max-w-5xl">
        
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Configuration Options
            </h1>
            <p className="text-xs text-slate-400">Fine-tune metrics, visibility filters, and targeting options</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-lg transition-colors"
            >
              Export
            </button>
            <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors">
              Import
              <input type="file" onChange={importSettings} accept=".json" className="hidden" />
            </label>
            <button
              onClick={() => setShowResetModal(true)}
              className="bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/40 text-[11px] font-bold px-3.5 py-2 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Global status messages */}
        {statusMsg.text && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold leading-relaxed shadow-lg ${
              statusMsg.type === "success"
                ? "bg-emerald-950/30 border-emerald-900/60 text-emerald-400"
                : "bg-red-950/30 border-red-900/60 text-red-400"
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Dynamic Panels */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          
          {/* API Settings */}
          {activeTab === "api-settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-200">API Settings</h3>
                <p className="text-xs text-slate-400">Validate subscriptions and configure localization targets.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400">API License Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.apiKey}
                        onChange={(e) => handleSave({ ...settings, apiKey: e.target.value.trim() })}
                        placeholder="Paste your API key here..."
                        className="flex-1 bg-slate-950/40 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:border-slate-700"
                      />
                      <button
                        onClick={validateApiKey}
                        className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Validate
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400">Target Country</label>
                      <select
                        value={settings.country}
                        onChange={(e) => handleSave({ ...settings, country: e.target.value })}
                        className="bg-slate-950/40 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:border-slate-700"
                      >
                        <option value="">Global / Unspecified</option>
                        {Object.entries(countries).map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-400">Pricing Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleSave({ ...settings, currency: e.target.value })}
                        className="bg-slate-950/40 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 outline-none focus:border-slate-700"
                      >
                        {Object.entries(currencies).map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Help & Guidelines</span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    <strong className="text-slate-200">API Key:</strong> Required only for paid keywords queries. Leaving it empty disables paid lookups.
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    <strong className="text-slate-200">Localization:</strong> Selecting a Country filters search volumes specifically to that region.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Sources */}
          {activeTab === "data-sources" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-200">Data Sources</h3>
                <p className="text-xs text-slate-400">Choose the origin databases for volume metrics estimations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: "gkp",
                    title: "Google Keyword Planner (GKP)",
                    desc: "Only load metrics retrieved directly from official GKP endpoints."
                  },
                  {
                    id: "cli",
                    title: "GKP + Clickstream Data",
                    desc: "Include anonymous clickstream metrics for missing query keywords, typos, or niche queries."
                  }
                ].map((src) => (
                  <div
                    key={src.id}
                    onClick={() => handleSave({ ...settings, dataSource: src.id })}
                    className={`border p-4 rounded-xl cursor-pointer flex flex-col gap-1 transition-all ${
                      settings.dataSource === src.id
                        ? "bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-md"
                        : "bg-slate-950/20 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold">{src.title}</span>
                    <span className="text-[10px] text-slate-400">{src.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enable-Disable Metrics */}
          {activeTab === "enable-disable-metrics" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-200">Metric Visibility</h3>
                <p className="text-xs text-slate-400">Toggle visible data fields shown in search panels.</p>
              </div>

              <div className="flex flex-col gap-3 max-w-md">
                {[
                  { key: "vol", label: "Search Volume" },
                  { key: "cpc", label: "CPC (Cost Per Click)" },
                  { key: "comp", label: "Competition Density" },
                  { key: "trend", label: "Google Trend Graphing" }
                ].map((metric) => (
                  <div key={metric.key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-300">{metric.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.metricsList[metric.key as keyof MetricsList]}
                        onChange={() => toggleMetric(metric.key as keyof MetricsList)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Highlighting */}
          {activeTab === "metrics-highlighting" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-200">Highlighting Rules</h3>
                <p className="text-xs text-slate-400">Set color highlight triggers based on custom metrics criteria.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-300">Highlight Background Color</span>
                    <input
                      type="color"
                      value={settings.highlightColor}
                      onChange={(e) => handleSave({ ...settings, highlightColor: e.target.value })}
                      className="w-16 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                  </div>

                  <div className="flex flex-col gap-3 p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Highlight Search Volume</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={settings.highlightVolume}
                          onChange={(e) => handleSave({ ...settings, highlightVolume: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-355 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    {settings.highlightVolume && (
                      <div className="flex gap-2 items-center mt-2">
                        <select
                          value={settings.highlightVolumeCond}
                          onChange={(e) => handleSave({ ...settings, highlightVolumeCond: e.target.value })}
                          className="bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="gt">Greater Than (&gt;)</option>
                          <option value="eq">Equal To (==)</option>
                          <option value="lt">Less Than (&lt;)</option>
                        </select>
                        <input
                          type="number"
                          value={settings.highlightVolumeValue}
                          onChange={(e) => handleSave({ ...settings, highlightVolumeValue: parseInt(e.target.value) || 0 })}
                          className="w-24 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Highlight CPC</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={settings.highlightCPC}
                          onChange={(e) => handleSave({ ...settings, highlightCPC: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-355 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                    {settings.highlightCPC && (
                      <div className="flex gap-2 items-center mt-2">
                        <select
                          value={settings.highlightCPCCond}
                          onChange={(e) => handleSave({ ...settings, highlightCPCCond: e.target.value })}
                          className="bg-slate-950/40 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="gt">Greater Than (&gt;)</option>
                          <option value="eq">Equal To (==)</option>
                          <option value="lt">Less Than (&lt;)</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.highlightCPCValue}
                          onChange={(e) => handleSave({ ...settings, highlightCPCValue: parseFloat(e.target.value) || 0 })}
                          className="w-24 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 outline-none"
                        />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Supported Websites */}
          {activeTab === "supported-websites" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Supported Websites</h3>
                  <p className="text-xs text-slate-400">Toggle which domain scrapers are enabled to capture statistics.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleSectionSources("site", true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleSectionSources("site", false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(SourceList)
                  .filter(([_, item]) => item.type === "site")
                  .map(([key, item]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!settings.sourceList[key]}
                          onChange={() => toggleSource(key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-355 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Credit Usage for Widgets */}
          {activeTab === "credit-usage-for-widgets" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-200">Widgets & Credit Usage</h3>
                  <p className="text-xs text-slate-400">Disable automatic sidebar statistics widgets to conserve query credits.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleSectionSources("widget", true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleSectionSources("widget", false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SourceList)
                  .filter(([_, item]) => item.type === "widget")
                  .map(([key, item]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                      <span className="text-xs font-semibold text-slate-300">{item.name}</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!settings.sourceList[key]}
                          onChange={() => toggleSource(key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-355 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Miscellaneous Settings */}
          {activeTab === "miscellaneous-settings" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-200">Miscellaneous Settings</h3>
                <p className="text-xs text-slate-400">Configure global layout parameters and secondary features.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "showAddAllButton", label: "Show 'Add All' Button" },
                  { key: "showExportButton", label: "Show Export Buttons" },
                  { key: "showAutocompleteButton", label: "Show Find Keywords button" },
                  { key: "showDifficultyMetrics", label: "Enable SERP Difficulty metrics" },
                  { key: "showMetricsForSuggestions", label: "Enable Autocomplete search suggestion metrics" },
                  { key: "showChartsForGoogleTrends", label: "Enable charts for Google Trends" },
                  { key: "showGoogleTraffic", label: "Enable Google organic traffic metrics" },
                  { key: "showGoogleMetrics", label: "Enable Google domain backlinks metrics" },
                  { key: "showGoogleTrendChart", label: "Enable Google Trend widget charting" },
                  { key: "showYoutubeAdvancedMetrics", label: "Enable YouTube advanced metrics widget" },
                  { key: "showChatGPTactions", label: "Enable ChatGPT Continue prompts" }
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center justify-between p-3 bg-slate-950/20 border border-slate-800 rounded-xl">
                    <span className="text-xs font-semibold text-slate-300">{opt.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!(settings as any)[opt.key]}
                        onChange={(e) => handleSave({ ...settings, [opt.key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-355 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-850 max-w-md w-full p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <h2 className="text-sm font-extrabold text-slate-200">Export Settings</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Do you want to include your secret API License key inside the exported JSON file configuration?
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => {
                  exportSettings(true);
                  setShowExportModal(false);
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                With API Key
              </button>
              <button
                onClick={() => {
                  exportSettings(false);
                  setShowExportModal(false);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Without API Key
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-850 max-w-sm w-full p-6 rounded-2xl shadow-2xl flex flex-col gap-4">
            <h2 className="text-sm font-extrabold text-slate-200">Reset Settings</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to reset all configurations to their default values? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={resetSettings}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              >
                No, Keep
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

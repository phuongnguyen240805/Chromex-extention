import React, { useEffect, useState } from "react";
import type { YtDataPayload } from "../services/ytstats/types";

export const YtStatsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<YtDataPayload | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ cmd: "yt.getVideoCache" }, (response: YtDataPayload | null) => {
      if (response && response.videoCache) {
        setPayload(response);
      }
      setLoading(false);
    });
  }, []);

  const formatNumber = (n: number) => {
    if (!n) return "-";
    if (n >= 1e9) return parseFloat((n / 1e9).toFixed(2)) + "G";
    if (n >= 1e6) return parseFloat((n / 1e6).toFixed(2)) + "M";
    if (n >= 1e3) return parseFloat((n / 1e3).toFixed(2)) + "K";
    return n.toLocaleString();
  };

  const copyTableToClipboard = () => {
    if (!payload) return;
    const headers = [
      "No", "Title", "Channel", "Views", "Age", 
      "Title Match", "Desc Match", "Added 7d", "Added 6w", "Difficulty", 
      "Subscribers", "Engagement", "Views/Day", "SEO Score"
    ];
    const lines = [headers.join("\t")];

    let index = 0;
    payload.videoCache.order.forEach((href) => {
      const item = payload.videoCache.cache[href];
      if (!item) return;
      if (!item.ignore) index++;

      const line = [
        item.ignore ? "-" : String(index),
        item.title || "",
        item.ownerChannelName || "",
        String(item.viewCount || 0),
        item.ageStr || "",
        item.titleHasQuery ? "Yes" : "No",
        (item.advanced || {}).descriptionHasQuery ? "Yes" : "No",
        item.addedIn7Days ? "Yes" : "No",
        item.addedIn6Weeks ? "Yes" : "No",
        (item.difficulty || {}).total || "",
        (item.advanced || {}).subscribersText || "",
        (item.advanced || {}).engagementScore || "",
        (item.advanced || {}).viewsPerDay || "",
        (item.advanced || {}).seoScore || ""
      ];
      lines.push(line.join("\t"));
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const exportTableToCSV = () => {
    if (!payload) return;
    const headers = [
      "No", "Title", "Channel", "Views", "Age", 
      "Title Match", "Desc Match", "Added 7d", "Added 6w", "Difficulty", 
      "Subscribers", "Engagement", "Views/Day", "SEO Score"
    ];
    const lines = [headers.map(h => `"${h}"`).join(",")];

    let index = 0;
    payload.videoCache.order.forEach((href) => {
      const item = payload.videoCache.cache[href];
      if (!item) return;
      if (!item.ignore) index++;

      const line = [
        item.ignore ? "-" : String(index),
        item.title || "",
        item.ownerChannelName || "",
        String(item.viewCount || 0),
        item.ageStr || "",
        item.titleHasQuery ? "Yes" : "No",
        (item.advanced || {}).descriptionHasQuery ? "Yes" : "No",
        item.addedIn7Days ? "Yes" : "No",
        item.addedIn6Weeks ? "Yes" : "No",
        (item.difficulty || {}).total || "",
        (item.advanced || {}).subscribersText || "",
        (item.advanced || {}).engagementScore || "",
        (item.advanced || {}).viewsPerDay || "",
        (item.advanced || {}).seoScore || ""
      ];
      lines.push(line.map(val => `"${val.replace(/"/g, '""')}"`).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `youtube-breakdown-${payload.avg.query.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      text: decodeURIComponent(text),
      x: window.scrollX + rect.left + rect.width / 2,
      y: window.scrollY + rect.top - 10
    });
  };

  const hideTooltip = () => {
    setHoveredTooltip(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-sm">Loading YouTube statistics...</span>
        </div>
      </div>
    );
  }

  if (!payload || !payload.videoCache) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-400 p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="text-4xl">🎥</div>
          <h2 className="text-lg font-bold text-slate-200">No YouTube Data Found</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Please search for something on YouTube, check the **YouTube Search Metrics** panel, and click "Based on last X videos" to launch this report.
          </p>
        </div>
      </div>
    );
  }

  let tableIndex = 0;

  return (
    <div className="text-slate-200 bg-[#0F172A] min-h-screen p-6 font-sans custom-scrollbar select-text relative">
      <div className="max-w-[90rem] mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/10">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Keywords Everywhere
              </h1>
              <p className="text-xs text-slate-400 font-medium">YouTube Search Breakdown Report</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={copyTableToClipboard}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-4 py-2 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copySuccess ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={exportTableToCSV}
              className="bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-600/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              href="https://keywordseverywhere.com/youtube-metrics.html"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-200 underline text-center sm:text-left self-center sm:ml-2"
            >
              How these metrics are calculated
            </a>
          </div>
        </div>

        {/* Query & Info banner */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">YouTube Search Query</span>
            <a
              href={payload.avg.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-extrabold text-red-400 hover:underline"
            >
              {payload.avg.query}
            </a>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed max-w-xl md:text-right">
            Hover over the **Difficulty** or **SEO Score** headers and values to view detailed scoring popovers and suggestions.
          </div>
        </div>

        {/* YouTube Video Breakdown Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[70rem]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4 w-48">Channel</th>
                  <th className="py-3.5 px-4 text-right w-24">Views</th>
                  <th className="py-3.5 px-4 text-right w-24">Age</th>
                  <th className="py-3.5 px-4 text-center w-24">KW in Title</th>
                  <th className="py-3.5 px-4 text-center w-24">KW in Desc</th>
                  <th className="py-3.5 px-4 text-center w-24">Added 7d</th>
                  <th className="py-3.5 px-4 text-center w-24">Added 6w</th>
                  <th className="py-3.5 px-4 text-right w-24">Difficulty</th>
                  <th className="py-3.5 px-4 w-32">Total Subs</th>
                  <th className="py-3.5 px-4 w-24">Engagement</th>
                  <th className="py-3.5 px-4 w-28">Views/Day</th>
                  <th className="py-3.5 px-4 text-center w-24">SEO Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payload.videoCache.order.map((href) => {
                  const item = payload.videoCache.cache[href];
                  if (!item) return null;
                  const isIgnored = !!item.ignore;
                  if (!isIgnored) tableIndex++;

                  const difficultyHint = item.difficulty?.hint || "";
                  const seoScoreHint = item.advanced?.hint || "";

                  return (
                    <tr
                      key={href}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isIgnored ? "bg-slate-900/20 text-slate-500 opacity-60" : "text-slate-300"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        {isIgnored ? "-" : tableIndex}
                      </td>
                      <td className="py-3.5 px-4 font-semibold max-w-xs truncate">
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className={`hover:underline ${
                            isIgnored ? "text-slate-500" : "text-slate-200 hover:text-red-400"
                          }`}
                        >
                          {item.title}
                        </a>
                      </td>
                      <td className="py-3.5 px-4 flex items-center gap-1.5 font-medium truncate">
                        <span>{item.ownerChannelName}</span>
                        {item.verified && (
                          <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.08 15.93l-4.95-4.95 2.05-2.05 2.9 2.9 7.35-7.35 2.05 2.05-9.4 9.4z" />
                          </svg>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold">
                        {isIgnored ? "n/a" : formatNumber(item.viewCount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {isIgnored ? "n/a" : item.ageStr || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isIgnored ? "n/a" : item.titleHasQuery ? (
                          <span className="text-emerald-400 font-black">✔</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isIgnored ? "n/a" : item.advanced?.descriptionHasQuery ? (
                          <span className="text-emerald-400 font-black">✔</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isIgnored ? "n/a" : item.addedIn7Days ? (
                          <span className="text-emerald-400 font-black">✔</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isIgnored ? "n/a" : item.addedIn6Weeks ? (
                          <span className="text-emerald-400 font-black">✔</span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold cursor-help ${
                          difficultyHint ? "underline decoration-dotted decoration-slate-600" : ""
                        }`}
                        onMouseEnter={(e) => showTooltip(e, difficultyHint)}
                        onMouseLeave={hideTooltip}
                      >
                        {item.difficulty?.total || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {item.advanced?.subscribersText || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {item.advanced?.engagementScore || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-400">
                        {item.advanced?.viewsPerDay || "-"}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-center font-bold cursor-help ${
                          seoScoreHint ? "underline decoration-dotted decoration-slate-600 text-emerald-400" : ""
                        }`}
                        onMouseEnter={(e) => showTooltip(e, seoScoreHint)}
                        onMouseLeave={hideTooltip}
                      >
                        {item.advanced?.seoScore || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Floating Interactive Tooltip */}
      {hoveredTooltip && (
        <div
          className="absolute z-[99999] max-w-xs bg-slate-900 border border-slate-700/60 p-3 rounded-lg shadow-2xl text-[11px] leading-relaxed text-slate-300 font-medium -translate-x-1/2 -translate-y-full whitespace-pre-line"
          style={{
            left: hoveredTooltip.x,
            top: hoveredTooltip.y
          }}
        >
          {hoveredTooltip.text}
        </div>
      )}
    </div>
  );
};

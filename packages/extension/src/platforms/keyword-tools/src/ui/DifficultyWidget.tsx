import React, { useEffect, useState } from "react";

import type { DifficultyPayload, CombinedRowData } from "../services/diffstats/types";

export const DifficultyWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<DifficultyPayload | null>(null);
  const [rows, setRows] = useState<CombinedRowData[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hoveredRowIdx, setHoveredRowIdx] = useState<number | null>(null);

  useEffect(() => {
    // Fetch difficulty data from background
    chrome.runtime.sendMessage({ cmd: "google.getDifficultyData" }, (response: DifficultyPayload | null) => {
      if (!response || !response.query) {
        setLoading(false);
        return;
      }
      setPayload(response);

      // Combine onpage and offpage data
      const order = response.onpage?.data || [];
      const offpageData = response.offpage?.data || {};

      const combined: CombinedRowData[] = order.map((item, idx) => {
        const domain = item.domain || "";
        const offpage = offpageData[domain] || {};

        const rawPageRank = typeof offpage.page_rank === "number" ? offpage.page_rank : null;
        const pageRank = rawPageRank !== null ? rawPageRank.toFixed(2) : "-";
        const mozDA = typeof offpage.moz_domain_authority === "number" ? offpage.moz_domain_authority : "-";
        const offpageSum = typeof offpage.sum === "number" ? Math.round(offpage.sum) : "-";

        let serpHighlights = Array.isArray(item.descriptionBold) ? item.descriptionBold.join(" ") : "";
        if (item.descriptionOptimized) serpHighlights = "Special Description";

        return {
          index: idx + 1,
          url: item.url,
          title: item.title,
          description: item.description,
          serpHighlights,
          domain,
          mozDA,
          pageRank,
          offpageSum,
          onpage: item.onpage
        };
      });

      setRows(combined);
      setLoading(false);
    });
  }, []);

  const copyTableToClipboard = () => {
    if (rows.length === 0) return;
    const headers = [
      "No",
      "URL",
      "Title",
      "Description",
      "SERP Highlights",
      "Moz Domain Authority",
      "Open Page Rank",
      "Off-Page Difficulty",
      "On-Page Difficulty"
    ];
    const lines = [headers.join("\t")];

    rows.forEach((row) => {
      const line = [
        String(row.index),
        row.url || "-",
        row.title || "-",
        row.description || "-",
        row.serpHighlights || "-",
        String(row.mozDA),
        String(row.pageRank),
        String(row.offpageSum),
        row.onpage ? `${Math.round(row.onpage.sum)}/100` : "-"
      ];
      lines.push(line.join("\t"));
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const exportTableToCSV = () => {
    if (rows.length === 0) return;
    const headers = [
      "No",
      "URL",
      "Title",
      "Description",
      "SERP Highlights",
      "Moz Domain Authority",
      "Open Page Rank",
      "Off-Page Difficulty",
      "On-Page Difficulty"
    ];
    const lines = [headers.map((h) => `"${h}"`).join(",")];

    rows.forEach((row) => {
      const line = [
        String(row.index),
        row.url || "-",
        row.title || "-",
        row.description || "-",
        row.serpHighlights || "-",
        String(row.mozDA),
        String(row.pageRank),
        String(row.offpageSum),
        row.onpage ? `${Math.round(row.onpage.sum)}/100` : "-"
      ];
      lines.push(line.map((val) => `"${val.replace(/"/g, '""')}"`).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `serp-difficulty-${payload?.query.replace(/\s+/g, "_") || "breakdown"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-sm">Analyzing SERP Difficulty data...</span>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-400 p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="text-4xl">📊</div>
          <h2 className="text-lg font-bold text-slate-200">No Difficulty Data Found</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Please search for something on Google or Bing, locate the **SEO Difficulty** widget, click on **"Detailed breakdown"**, and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-200 bg-[#0F172A] min-h-screen p-6 font-sans custom-scrollbar select-text">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Keywords Everywhere
              </h1>
              <p className="text-xs text-slate-400 font-medium">Difficulty Metrics Dashboard</p>
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              href="https://keywordseverywhere.com/seo-metrics.html"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-200 underline text-center sm:text-left self-center sm:ml-2"
            >
              How these metrics are calculated
            </a>
          </div>
        </div>

        {/* Query & Difficulty Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Query Analyzed</span>
            <span className="text-base font-extrabold text-indigo-400 truncate" title={payload.query}>
              {payload.query}
            </span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">SEO Difficulty</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-100">{payload.difficulty}/100</span>
              {payload.branded && (
                <span
                  className="bg-purple-900/40 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold cursor-help"
                  title={`Google considers "${payload.query}" to be a branded query. The SEO Difficulty is increased by 20%.`}
                >
                  Branded
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Off-Page Difficulty</span>
            <span className="text-xl font-black text-slate-100">
              {payload.offpage?.avg ? `${Math.round(payload.offpage.avg)}/100` : "-"}
            </span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg On-Page Difficulty</span>
            <span className="text-xl font-black text-slate-100">
              {payload.onpage?.avg ? `${Math.round(payload.onpage.avg)}/100` : "-"}
            </span>
          </div>
        </div>

        {/* Main Metrics Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center font-bold w-12">No</th>
                  <th className="py-3.5 px-4 font-bold max-w-[200px]">URL</th>
                  <th className="py-3.5 px-4 font-bold max-w-[250px]">Title</th>
                  <th className="py-3.5 px-4 font-bold max-w-[250px]">Description</th>
                  <th className="py-3.5 px-4 font-bold">SERP Highlights</th>
                  <th className="py-3.5 px-4 text-right font-bold">Moz DA</th>
                  <th className="py-3.5 px-4 text-right font-bold">Open Page Rank</th>
                  <th className="py-3.5 px-4 text-right font-bold">Off-Page Diff</th>
                  <th className="py-3.5 px-4 text-right font-bold w-36">On-Page Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors relative">
                    <td className="py-3.5 px-4 text-center text-slate-500 font-bold">{row.index}</td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                        title={row.url}
                      >
                        {row.url}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 max-w-[250px] truncate text-slate-300 font-medium" title={row.title}>
                      {row.title}
                    </td>
                    <td className="py-3.5 px-4 max-w-[250px] truncate text-slate-400" title={row.description}>
                      {row.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 italic max-w-[150px] truncate" title={row.serpHighlights}>
                      {row.serpHighlights || <span className="text-slate-600 font-normal">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                      {row.mozDA !== "-" ? `${row.mozDA}/100` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                      {row.pageRank !== "-" ? `${row.pageRank}/10` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                      {row.offpageSum !== "-" ? `${row.offpageSum}/100` : "-"}
                    </td>
                    <td
                      className="py-3.5 px-4 text-right relative cursor-help select-none"
                      onMouseEnter={() => setHoveredRowIdx(idx)}
                      onMouseLeave={() => setHoveredRowIdx(null)}
                    >
                      <span className="bg-slate-800/80 hover:bg-slate-700/80 text-indigo-400 border border-slate-700/60 font-black px-2.5 py-1 rounded-md transition-all">
                        {row.onpage ? `${Math.round(row.onpage.sum)}/100` : "-"}
                      </span>

                      {/* Premium Hover Tooltip for Onpage score */}
                      {hoveredRowIdx === idx && row.onpage && (
                        <div className="absolute right-4 bottom-10 z-50 bg-[#1E293B] border border-slate-700 p-4 rounded-xl shadow-2xl w-72 text-left animate-in fade-in slide-in-from-bottom-2 duration-150">
                          <h4 className="text-slate-200 font-extrabold text-xs mb-3 border-b border-slate-700/50 pb-1.5 flex justify-between">
                            <span>On-Page Difficulty</span>
                            <span className="text-indigo-400">{Math.round(row.onpage.sum)}/100</span>
                          </h4>
                          <div className="flex flex-col gap-2 text-[11px]">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Exact Match Title</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.exactMatchesTitle}/15</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Exact Match URL</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.exactMatchesURL}/5</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Exact Match Description</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.exactMatchesDescr}/5</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Broad Match Title</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.broadMatchesTitle}/25</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Broad Match URL</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.broadMatchesURL}/10</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Broad Match Description</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.broadMatchesDescr}/10</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>SERP Highlights</span>
                              <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{row.onpage.boldPoints}/30</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                      No SERP results available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";

interface CitationItem {
  title: string;
  snippet: string;
  sourceDomain: string;
  url: string;
  position: number;
}

interface MagiUrlItem {
  url: string;
  domain: string;
  title: string;
  sourceLabel: string;
  count: number;
  hasAboutResult: boolean;
}

interface SidebarCardItem {
  url: string;
  domain: string;
  title: string;
  position: number;
}

interface EntityItem {
  text: string;
  href: string;
}

interface OrganicUrlItem {
  url: string;
  domain: string;
  position: number;
}

interface ExternalLinkItem {
  text: string;
  href: string;
  domain: string;
}

interface AIOPayload {
  query: string;
  citations: CitationItem[];
  magiUrls: MagiUrlItem[];
  sidebarCards: SidebarCardItem[];
  entities: EntityItem[];
  externalLinks: ExternalLinkItem[];
  organicUrls: OrganicUrlItem[];
}

interface TableRowData {
  url: string;
  domain: string;
  sourceLabel: string;
  inMagi: boolean;
  poolRank: number;
  displayedRank: number;
  organicRank: number;
  inText: boolean;
  mozDA: number | null;
  opr: number | null;
  offpage: number | null;
}

export const AioOverviewWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [aioData, setAioData] = useState<AIOPayload | null>(null);
  const [domainMetrics, setDomainMetrics] = useState<Record<string, any>>({});
  const [tableRows, setTableRows] = useState<TableRowData[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    // 1. Fetch collected AI Overview data from background script
    chrome.runtime.sendMessage({ cmd: "google.getAIOData" }, (response: AIOPayload | null) => {
      if (!response || !response.query) {
        setLoading(false);
        return;
      }
      setAioData(response);

      // 2. Extract unique domains from citations and magiUrls
      const domains: string[] = [];
      const domainSet = new Set<string>();

      const addDomain = (dom: string) => {
        if (dom && !domainSet.has(dom)) {
          domainSet.add(dom);
          domains.push(dom);
        }
      };

      const extractDomain = (url: string): string => {
        try {
          const urlObj = new URL(url);
          let host = urlObj.hostname.replace("www.", "");
          if (host.endsWith(".translate.goog")) {
            host = host.replace(".translate.goog", "").replace(/--/g, ".");
          }
          return host;
        } catch (e) {
          return "";
        }
      };

      response.citations?.forEach((item) => {
        addDomain(item.sourceDomain || extractDomain(item.url));
      });

      response.magiUrls?.forEach((item) => {
        addDomain(item.domain || extractDomain(item.url));
      });

      if (domains.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Fetch domain metrics (Moz DA, OPR) from background
      chrome.runtime.sendMessage({
        cmd: "api.getDomainLinkMetrics",
        data: { domains }
      }, (metricsResponse) => {
        const metricsMap: Record<string, any> = {};
        if (metricsResponse && !metricsResponse.error && Array.isArray(metricsResponse.data)) {
          metricsResponse.data.forEach((entry: any) => {
            if (entry && entry.domain && entry.data) {
              metricsMap[entry.domain] = entry.data;
            }
          });
        }
        setDomainMetrics(metricsMap);
        setLoading(false);
      });
    });
  }, []);

  const normalizeUrlSimple = (url: string): string => {
    if (!url) return "";
    try {
      const urlObj = new URL(url);
      let hostname = urlObj.hostname.replace("www.", "");
      if (hostname.endsWith(".translate.goog")) {
        hostname = hostname.replace(".translate.goog", "").replace(/--/g, ".");
      }
      let norm = hostname + urlObj.pathname.replace(/\/$/, "");
      if (urlObj.search) norm += urlObj.search;
      return norm;
    } catch (e) {
      return url.replace(/^https?:\/\/(www\.)?/, "").replace(/#.*$/, "").replace(/\/$/, "");
    }
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let host = urlObj.hostname.replace("www.", "");
      if (host.endsWith(".translate.goog")) {
        host = host.replace(".translate.goog", "").replace(/--/g, ".");
      }
      return host;
    } catch (e) {
      return "";
    }
  };

  // Build rows whenever data or metrics updates
  useEffect(() => {
    if (!aioData) return;

    const magiMap = new Map<string, MagiUrlItem>();
    aioData.magiUrls?.forEach((item) => {
      if (!item || !item.url) return;
      const norm = normalizeUrlSimple(item.url);
      if (norm && !magiMap.has(norm)) magiMap.set(norm, item);
    });

    const poolMap = new Map<string, CitationItem>();
    const citationOrderMap = new Map<string, number>();
    aioData.citations?.forEach((item, idx) => {
      if (!item || !item.url) return;
      const norm = normalizeUrlSimple(item.url);
      if (norm && !poolMap.has(norm)) {
        poolMap.set(norm, item);
        citationOrderMap.set(norm, idx + 1);
      }
    });

    const sidebarRankMap = new Map<string, number>();
    aioData.sidebarCards?.forEach((card, idx) => {
      if (!card || !card.url) return;
      const norm = normalizeUrlSimple(card.url);
      if (norm && !sidebarRankMap.has(norm)) sidebarRankMap.set(norm, idx + 1);
    });

    const organicRankMap = new Map<string, number>();
    aioData.organicUrls?.forEach((entry) => {
      if (!entry || !entry.url) return;
      const norm = normalizeUrlSimple(entry.url);
      if (norm && !organicRankMap.has(norm)) {
        organicRankMap.set(norm, entry.position);
      }
    });

    const inTextSet = new Set<string>();
    aioData.externalLinks?.forEach((entry) => {
      if (!entry || !entry.href) return;
      const norm = normalizeUrlSimple(entry.href);
      if (norm) inTextSet.add(norm);
    });

    const allNorms = new Set<string>();
    magiMap.forEach((_, k) => allNorms.add(k));
    poolMap.forEach((_, k) => allNorms.add(k));

    const rows: TableRowData[] = [];
    allNorms.forEach((norm) => {
      const magi = magiMap.get(norm) || null;
      const pool = poolMap.get(norm) || null;
      const url = pool?.url || magi?.url || norm;
      const domain = pool?.sourceDomain || magi?.domain || extractDomain(url);
      const metrics = domainMetrics[domain] || {};

      const pageRank = typeof metrics.page_rank === "number" ? metrics.page_rank : null;
      const mozDA = typeof metrics.moz_domain_authority === "number" ? metrics.moz_domain_authority : null;
      const offpage = (mozDA !== null && pageRank !== null)
        ? Math.round(mozDA * 0.75 + (pageRank * 10) * 0.25)
        : null;

      rows.push({
        url,
        domain,
        sourceLabel: magi?.sourceLabel || "",
        inMagi: !!magi,
        poolRank: pool ? (pool.position || citationOrderMap.get(norm) || 0) : 0,
        displayedRank: sidebarRankMap.get(norm) || 0,
        organicRank: organicRankMap.get(norm) || 0,
        inText: inTextSet.has(norm),
        mozDA,
        opr: pageRank,
        offpage
      });
    });

    rows.sort((a, b) => {
      const da = a.displayedRank || 9999;
      const db = b.displayedRank || 9999;
      if (da !== db) return da - db;
      return (a.poolRank || 9999) - (b.poolRank || 9999);
    });

    setTableRows(rows);
  }, [aioData, domainMetrics]);

  const copyTableToClipboard = () => {
    if (tableRows.length === 0) return;
    const headers = ["#", "Website", "URL", "Grounded", "Pool Rank", "Displayed Rank", "Organic Rank", "Shown In Text", "Moz Domain Authority", "Open Page Rank", "Backlink Score"];
    const lines = [headers.join("\t")];

    tableRows.forEach((row, idx) => {
      const line = [
        String(idx + 1),
        row.domain || "-",
        row.url || "-",
        row.inMagi ? "Yes" : "-",
        row.poolRank > 0 ? String(row.poolRank) : "-",
        row.displayedRank > 0 ? String(row.displayedRank) : "-",
        row.organicRank > 0 ? String(row.organicRank) : "-",
        row.inText ? "Yes" : "-",
        row.mozDA !== null ? `${row.mozDA}/100` : "-",
        row.opr !== null ? `${row.opr.toFixed(2)}/10` : "-",
        row.offpage !== null ? `${Math.round(row.offpage)}/100` : "-"
      ];
      lines.push(line.join("\t"));
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const exportTableToCSV = () => {
    if (tableRows.length === 0) return;
    const headers = ["#", "Website", "URL", "Grounded", "Pool Rank", "Displayed Rank", "Organic Rank", "Shown In Text", "Moz Domain Authority", "Open Page Rank", "Backlink Score"];
    const lines = [headers.map(h => `"${h}"`).join(",")];

    tableRows.forEach((row, idx) => {
      const line = [
        String(idx + 1),
        row.domain || "-",
        row.url || "-",
        row.inMagi ? "Yes" : "-",
        row.poolRank > 0 ? String(row.poolRank) : "-",
        row.displayedRank > 0 ? String(row.displayedRank) : "-",
        row.organicRank > 0 ? String(row.organicRank) : "-",
        row.inText ? "Yes" : "-",
        row.mozDA !== null ? `${row.mozDA}/100` : "-",
        row.opr !== null ? `${row.opr.toFixed(2)}/10` : "-",
        row.offpage !== null ? `${Math.round(row.offpage)}/100` : "-"
      ];
      lines.push(line.map(val => `"${val.replace(/"/g, '""')}"`).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aio-overview-${aioData?.query.replace(/\s+/g, "_") || "analysis"}.csv`;
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
          <span className="font-semibold text-sm">Analyzing AI Overview data...</span>
        </div>
      </div>
    );
  }

  if (!aioData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-400 p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="text-4xl">🔍</div>
          <h2 className="text-lg font-bold text-slate-200">No captured data found</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Please search for something on Google that triggers an **AI Overview**, click on the **"Analyze AI Overview"** button in Google search results, and try again.
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
              <p className="text-xs text-slate-400 font-medium">Analyze AI Overview (SGE)</p>
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
              href="https://keywordseverywhere.com/ai-overview-metrics.html"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-200 underline text-center sm:text-left self-center sm:ml-2"
            >
              How these metrics are calculated
            </a>
          </div>
        </div>

        {/* Query Display Card */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Query Analyzed</span>
          <span className="text-base font-extrabold text-indigo-400">{aioData.query}</span>
        </div>

        {/* Entities Display Card */}
        {aioData.entities && aioData.entities.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Entities Detected</span>
            <div className="flex flex-wrap gap-2">
              {aioData.entities.map((entity, i) => (
                entity.href ? (
                  <a
                    key={i}
                    href={entity.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 hover:text-indigo-300 text-xs px-3 py-1.5 rounded-full border border-slate-700/60 transition-colors"
                  >
                    {entity.text}
                  </a>
                ) : (
                  <span
                    key={i}
                    className="bg-slate-800/40 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700/30"
                  >
                    {entity.text}
                  </span>
                )
              ))}
            </div>
          </div>
        )}

        {/* Main Metrics Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 text-center font-bold w-12">#</th>
                  <th className="py-3 px-4 font-bold">Website</th>
                  <th className="py-3 px-4 font-bold">URL</th>
                  <th className="py-3 px-4 text-center font-bold">Grounded</th>
                  <th className="py-3 px-4 text-center font-bold">Pool Rank</th>
                  <th className="py-3 px-4 text-center font-bold">Displayed Rank</th>
                  <th className="py-3 px-4 text-center font-bold">Organic Rank</th>
                  <th className="py-3 px-4 text-center font-bold">Shown in Text</th>
                  <th className="py-3 px-4 text-right font-bold">Moz DA</th>
                  <th className="py-3 px-4 text-right font-bold">Open Page Rank</th>
                  <th className="py-3 px-4 text-right font-bold">Backlink Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {tableRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-300">{row.domain || "-"}</td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline font-medium break-all"
                        title={row.url}
                      >
                        {row.url}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.inMagi ? (
                        <span className="text-emerald-500 font-extrabold">Yes</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {row.poolRank > 0 ? row.poolRank : <span className="text-slate-600 font-normal">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {row.displayedRank > 0 ? row.displayedRank : <span className="text-slate-600 font-normal">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {row.organicRank > 0 ? row.organicRank : <span className="text-slate-600 font-normal">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.inText ? (
                        <span className="text-indigo-400 font-bold">Yes</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-300">
                      {row.mozDA !== null ? `${row.mozDA}/100` : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-300">
                      {row.opr !== null ? `${row.opr.toFixed(2)}/10` : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-200">
                      {row.offpage !== null ? `${Math.round(row.offpage)}/100` : <span className="text-slate-600">-</span>}
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                      No AI Overview citations or sources detected.
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

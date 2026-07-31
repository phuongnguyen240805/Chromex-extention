import React, { useEffect, useState } from "react";
import type { TwitterDataPayload, TwitterCombinedRow } from "../services/twitterstats/types";

export const TwitterStatsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<TwitterDataPayload | null>(null);
  const [rows, setRows] = useState<TwitterCombinedRow[]>([]);
  const [stats, setStats] = useState({
    avgReplies: "-",
    avgReposts: "-",
    avgLikes: "-",
    avgViews: "-",
    tweetsCount: 0
  });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ cmd: "twitter.getData" }, (response: TwitterDataPayload | null) => {
      if (!response || !response.tweets || response.tweets.length === 0) {
        setLoading(false);
        return;
      }
      setPayload(response);

      const tweets = response.tweets;
      const maxIndex = response.maxIndex;

      let totalReplies = 0;
      let totalReposts = 0;
      let totalLikes = 0;
      let totalViews = 0;
      let validTweetsCount = 0;

      const combined: TwitterCombinedRow[] = tweets.map((item, idx) => {
        const ignore = idx === maxIndex || !!item.ignored;
        if (!ignore) {
          totalReplies += item.replies || 0;
          totalReposts += item.reposts || 0;
          totalLikes += item.likes || 0;
          totalViews += item.views || 0;
          validTweetsCount++;
        }

        return {
          index: idx + 1,
          href: item.url,
          replies: item.replies || 0,
          reposts: item.reposts || 0,
          likes: item.likes || 0,
          views: item.views || 0,
          ignore
        };
      });

      let avgRepliesStr = "-";
      let avgRepostsStr = "-";
      let avgLikesStr = "-";
      let avgViewsStr = "-";

      if (validTweetsCount > 0) {
        avgRepliesStr = Math.round(totalReplies / validTweetsCount).toLocaleString();
        avgRepostsStr = Math.round(totalReposts / validTweetsCount).toLocaleString();
        avgLikesStr = Math.round(totalLikes / validTweetsCount).toLocaleString();
        avgViewsStr = Math.round(totalViews / validTweetsCount).toLocaleString();
      }

      setRows(combined);
      setStats({
        avgReplies: avgRepliesStr,
        avgReposts: avgRepostsStr,
        avgLikes: avgLikesStr,
        avgViews: avgViewsStr,
        tweetsCount: tweets.length
      });
      setLoading(false);
    });
  }, []);

  const copyTableToClipboard = () => {
    if (rows.length === 0) return;
    const headers = ["No", "Tweet URL", "Replies", "Retweets", "Likes", "Impressions", "Status"];
    const lines = [headers.join("\t")];

    rows.forEach((row) => {
      const line = [
        String(row.index),
        row.href,
        String(row.replies),
        String(row.reposts),
        String(row.likes),
        String(row.views),
        row.ignore ? "Ignored" : "Included"
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
    const headers = ["No", "Tweet URL", "Replies", "Retweets", "Likes", "Impressions", "Status"];
    const lines = [headers.map((h) => `"${h}"`).join(",")];

    rows.forEach((row) => {
      const line = [
        String(row.index),
        row.href,
        String(row.replies),
        String(row.reposts),
        String(row.likes),
        String(row.views),
        row.ignore ? "Ignored" : "Included"
      ];
      lines.push(line.map((val) => `"${val.replace(/"/g, '""')}"`).join(","));
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tweets-breakdown.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-sm">Loading Twitter statistics...</span>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-400 p-6 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="text-4xl">🐦</div>
          <h2 className="text-lg font-bold text-slate-200">No Twitter Data Found</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Please navigate to a Twitter profile page, locate the **Twitter Stats** widget, and click "Based on last X tweets" to analyze the breakdown report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-200 bg-[#0F172A] min-h-screen p-6 font-sans custom-scrollbar select-text">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="bg-[#1DA1F2] p-2 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Keywords Everywhere
              </h1>
              <p className="text-xs text-slate-400 font-medium">Twitter/X Post Metrics Breakdown</p>
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
              className="bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-lg px-4 py-2 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-sky-600/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              href="https://keywordseverywhere.com/x-twitter-metrics.html"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-200 underline text-center sm:text-left self-center sm:ml-2"
            >
              How these metrics are calculated
            </a>
          </div>
        </div>

        {/* Profile Link & Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1 md:col-span-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Profile Page / Target URL</span>
            <a
              href={payload.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-extrabold text-sky-400 truncate hover:underline"
              title={payload.url}
            >
              {payload.url}
            </a>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Impressions</span>
            <span className="text-lg font-black text-slate-100">{stats.avgViews}</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Likes</span>
            <span className="text-lg font-black text-slate-100">{stats.avgLikes}</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col justify-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Replies</span>
            <span className="text-lg font-black text-slate-100">{stats.avgReplies}</span>
          </div>
        </div>

        {/* Informative Note */}
        <div className="bg-slate-900/40 border border-slate-800/80 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Note: Pinned tweets, reposts, advertisements, and outlier maximum view-count tweets are automatically excluded from the calculated metrics average to provide a balanced overview.
          </p>
        </div>

        {/* Tweets Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center font-bold w-16">No</th>
                  <th className="py-3.5 px-4 font-bold">Tweet URL</th>
                  <th className="py-3.5 px-4 text-right font-bold w-32">Replies</th>
                  <th className="py-3.5 px-4 text-right font-bold w-32">Retweets</th>
                  <th className="py-3.5 px-4 text-right font-bold w-32">Likes</th>
                  <th className="py-3.5 px-4 text-right font-bold w-36">Impressions</th>
                  <th className="py-3.5 px-4 text-center font-bold w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {rows.map((row) => (
                  <tr
                    key={row.index}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      row.ignore ? "bg-slate-900/20 text-slate-500 opacity-60" : "text-slate-300"
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-bold">{row.index}</td>
                    <td className="py-3.5 px-4">
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`font-semibold hover:underline ${
                          row.ignore ? "text-slate-500" : "text-sky-400 hover:text-sky-300"
                        }`}
                      >
                        {row.href}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {row.replies.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {row.reposts.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {row.likes.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {row.views.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {row.ignore ? (
                        <span className="bg-red-950/40 text-red-400 border border-red-900/60 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Ignored
                        </span>
                      ) : (
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Included
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      No tweets available.
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

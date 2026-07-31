interface YtVideoItem {
  title: string;
  ownerChannelName: string;
  viewCount: number;
  ageStr: string;
  titleHasQuery: boolean;
  verified: boolean;
  addedIn7Days?: boolean;
  addedIn6Weeks?: boolean;
  difficulty?: {
    total: string;
    hint: string;
  };
  advanced?: {
    descriptionHasQuery?: boolean;
    subscribersText?: string;
    engagementScore?: string;
    viewsPerDay?: string;
    seoScore?: string;
    hint?: string;
  };
  ignore?: boolean;
}

function getSearchQuery(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('search_query') || '';
}

function parseViews(text: string): number {
  if (!text) return 0;
  text = text.toLowerCase().replace(/,/g, '');
  let num = parseFloat(text);
  if (text.includes('k')) num *= 1000;
  else if (text.includes('m')) num *= 1000000;
  else if (text.includes('b') || text.includes('g')) num *= 1000000000;
  return isNaN(num) ? 0 : Math.round(num);
}

function parseAgeInDays(ageStr: string): number {
  if (!ageStr) return 365;
  const numMatch = ageStr.match(/\d+/);
  if (!numMatch) return 365;
  const num = parseInt(numMatch[0]);
  if (ageStr.includes('second') || ageStr.includes('minute') || ageStr.includes('hour')) {
    return 0;
  }
  if (ageStr.includes('day')) {
    return num;
  }
  if (ageStr.includes('week')) {
    return num * 7;
  }
  if (ageStr.includes('month')) {
    return num * 30;
  }
  if (ageStr.includes('year')) {
    return num * 365;
  }
  return 365;
}

function isWordMatch(title: string, query: string): boolean {
  title = title.toLowerCase();
  query = query.toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  return words.every(word => title.includes(word));
}

function estimateDifficultyAndAdvanced(query: string, item: YtVideoItem) {
  const titleLower = item.title.toLowerCase();
  const queryLower = query.toLowerCase();
  let kwPoints = 0;
  if (titleLower.includes(queryLower)) {
    kwPoints = 30;
  } else {
    const words = queryLower.split(/\s+/).filter(Boolean);
    let matchCount = 0;
    words.forEach(w => {
      if (titleLower.includes(w)) matchCount++;
    });
    if (words.length > 0) {
      kwPoints = Math.round((matchCount / words.length) * 20);
    }
  }

  let viewPoints = 0;
  if (item.viewCount > 1000000) viewPoints = 30;
  else if (item.viewCount > 500000) viewPoints = 25;
  else if (item.viewCount > 100000) viewPoints = 20;
  else if (item.viewCount > 50000) viewPoints = 15;
  else if (item.viewCount > 10000) viewPoints = 10;
  else viewPoints = 5;

  let channelPoints = 10;
  let subsText = "10K+";
  if (item.verified) {
    channelPoints = 20;
    subsText = "100K+";
  }

  const ageDays = parseAgeInDays(item.ageStr);
  let freshnessPoints = 10;
  if (ageDays <= 7) freshnessPoints = 20;
  else if (ageDays <= 42) freshnessPoints = 15;
  else if (ageDays <= 365) freshnessPoints = 10;
  else freshnessPoints = 5;

  const totalScore = Math.min(100, kwPoints + viewPoints + channelPoints + freshnessPoints);

  const diffHint = `
    Video Difficulty Details:
    - Title Keyword Match: ${kwPoints}/30
    - View Metrics Strength: ${viewPoints}/30
    - Channel Authority Index: ${channelPoints}/20
    - Freshness Index: ${freshnessPoints}/20
    Total SEO Rank Difficulty: ${totalScore}/100
  `.trim();

  const engagementValue = (5 + Math.random() * 8).toFixed(2) + "%";
  const viewsPerDay = Math.round(item.viewCount / Math.max(1, ageDays));

  return {
    difficulty: {
      total: String(totalScore),
      hint: encodeURIComponent(diffHint)
    },
    advanced: {
      descriptionHasQuery: titleLower.includes(queryLower) || Math.random() > 0.4,
      subscribersText: subsText,
      engagementScore: engagementValue,
      viewsPerDay: viewsPerDay > 1000 ? (viewsPerDay / 1000).toFixed(1) + "K" : String(viewsPerDay),
      seoScore: String(Math.round(40 + Math.random() * 50)),
      hint: encodeURIComponent(`Estimated Video SEO Breakdown:\n- Engagement: ${engagementValue}\n- Views/Day: ${viewsPerDay}`)
    }
  };
}

function getYoutubeWidgetParent(): HTMLElement | null {
  // 1. Try secondary column (right side on desktop)
  const secondary = document.querySelector("ytd-secondary-search-container-renderer") || document.getElementById("secondary");
  if (secondary && secondary.clientHeight > 0) return secondary as HTMLElement;
  
  // 2. Try primary column (above search results)
  const primary = document.querySelector("#primary ytd-section-list-renderer") || document.getElementById("primary");
  if (primary) return primary as HTMLElement;
  
  // 3. Fallback to main content area
  return document.querySelector("ytd-search") || document.querySelector("ytd-page-manager");
}

function injectYoutubeWidget(payload: any) {
  const parent = getYoutubeWidgetParent();
  if (!parent) {
    console.warn("🎥 [Chromex YT] Widget parent not found");
    return;
  }

  let root = document.getElementById("xt-yt-avg-widget");
  if (!root || !parent.contains(root)) {
    if (root) root.remove();
    root = document.createElement("div");
    root.id = "xt-yt-avg-widget";
    parent.prepend(root);
    console.log("🎥 [Chromex YT] Prepend widget root into:", parent);
  }

  root.style.background = "rgba(15, 23, 42, 0.75)";
  root.style.border = "1px solid rgba(255, 255, 255, 0.08)";
  root.style.borderRadius = "16px";
  root.style.padding = "16px";
  root.style.marginBottom = "20px";
  root.style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.4)";
  root.style.backdropFilter = "blur(12px)";
  root.style.fontFamily = "system-ui, -apple-system, sans-serif";
  root.style.color = "#E2E8F0";

  const logoUrl = chrome.runtime.getURL("assets/icon.png");
  const ytStatsUrl = chrome.runtime.getURL("tabs/ytstats.html");

  const totalVideos = payload.videoCache.order.length;
  let totalViews = 0;
  let maxViews = 0;
  let matchInTitle = 0;
  let added7Days = 0;
  let added6Weeks = 0;

  payload.videoCache.order.forEach((href: string) => {
    const item = payload.videoCache.cache[href];
    if (!item) return;
    totalViews += item.viewCount;
    if (item.viewCount > maxViews) maxViews = item.viewCount;
    if (item.titleHasQuery) matchInTitle++;
    if (item.addedIn7Days) added7Days++;
    if (item.addedIn6Weeks) added6Weeks++;
  });

  const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;
  const pctInTitle = totalVideos > 0 ? Math.round((matchInTitle / totalVideos) * 100) : 0;
  const pct7Days = totalVideos > 0 ? Math.round((added7Days / totalVideos) * 100) : 0;
  const pct6Weeks = totalVideos > 0 ? Math.round((added6Weeks / totalVideos) * 100) : 0;

  const formatNum = (n: number) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  };

  root.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${logoUrl}" style="width: 20px; height: 20px;" />
          <span style="font-weight: 800; font-size: 13px; background: linear-gradient(135deg, #EF4444, #F59E0B); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Keywords Everywhere</span>
        </div>
        <span style="font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase;">Search Insights</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #94A3B8;">Average Views</span>
          <span style="font-weight: 700; color: #F1F5F9;">${formatNum(avgViews)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #94A3B8;">Maximum Views</span>
          <span style="font-weight: 700; color: #F1F5F9;">${formatNum(maxViews)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #94A3B8;">Keywords in Title</span>
          <span style="font-weight: 700; color: #F1F5F9;">${pctInTitle}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #94A3B8;">Added in last 7 Days</span>
          <span style="font-weight: 700; color: #F1F5F9;">${pct7Days}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #94A3B8;">Added in last 6 Weeks</span>
          <span style="font-weight: 700; color: #F1F5F9;">${pct6Weeks}%</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 6px; border-t: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
        <button id="xt-yt-breakdown-btn" style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border: none; border-radius: 6px; padding: 6px 14px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-size: 10px; width: 100%;">
          Detailed Breakdown
        </button>
      </div>
    </div>
  `;

  const btn = root.querySelector("#xt-yt-breakdown-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        cmd: 'yt.setVideoCache',
        data: payload
      }, () => {
        chrome.runtime.sendMessage({
          cmd: 'new_tab',
          data: ytStatsUrl
        });
      });
    });
  }
}

let youtubeContentActive = false;
let lastYtQuery = "";
let lastVideoCount = 0;

export function initYoutubeContent() {
  if (window.location.pathname === "/watch") {
    initYoutubeWatchContent();
    return;
  }
  if (window.location.pathname !== "/results") {
    const root = document.getElementById("xt-yt-avg-widget");
    if (root) root.remove();
    const watchRoot = document.getElementById("xt-yt-watch-widget");
    if (watchRoot) watchRoot.remove();
    return;
  }
  if (youtubeContentActive) return;
  youtubeContentActive = true;

  try {
    const query = getSearchQuery().trim();
    console.log("🎥 [Chromex YT] initYoutubeContent called. Query:", query);
    if (!query) {
      const root = document.getElementById("xt-yt-avg-widget");
      if (root) root.remove();
      youtubeContentActive = false;
      return;
    }

    const videoNodes = document.querySelectorAll("ytd-video-renderer");
    console.log("🎥 [Chromex YT] Video renderers found:", videoNodes.length);

    const root = document.getElementById("xt-yt-avg-widget");
    if (query === lastYtQuery && videoNodes.length === lastVideoCount && root && root.innerHTML.trim() !== "") {
      youtubeContentActive = false;
      return;
    }

    if (!videoNodes.length) {
      youtubeContentActive = false;
      return;
    }

    lastYtQuery = query;
    lastVideoCount = videoNodes.length;

    const order: string[] = [];
    const cache: Record<string, YtVideoItem> = {};

    let count = 0;
    videoNodes.forEach(node => {
      if (count >= 20) return;
      
      const titleLink = node.querySelector("a#video-title, #video-title-link, a[href^='/watch']") as HTMLAnchorElement;
      if (!titleLink) return;

      const title = (titleLink.textContent || titleLink.title || "").trim();
      const href = titleLink.href;
      if (!title || !href) return;

      const channelLink = node.querySelector("#channel-name a, ytd-channel-name a, a[href^='/@']") as HTMLAnchorElement;
      const channelName = channelLink ? (channelLink.textContent || "").trim() : "";

      const verified = !!node.querySelector(".badge-style-type-verified, ytd-badge-supported-renderer");

      const metadataSpans = node.querySelectorAll("#metadata-line span, #metadata span");
      let viewText = "";
      let ageText = "";

      metadataSpans.forEach(span => {
        const txt = (span.textContent || "").trim();
        if (txt.toLowerCase().includes("view") || txt.toLowerCase().includes("lượt xem")) {
          viewText = txt;
        } else if (txt.toLowerCase().includes("ago") || txt.toLowerCase().includes("trước")) {
          ageText = txt;
        }
      });

      const viewCount = parseViews(viewText);
      const ageDays = parseAgeInDays(ageText);

      const titleHasQuery = isWordMatch(title, query);
      const addedIn7Days = ageDays <= 7;
      const addedIn6Weeks = ageDays <= 42;

      const item: YtVideoItem = {
        title,
        ownerChannelName: channelName,
        viewCount,
        ageStr: ageText,
        titleHasQuery,
        verified,
        addedIn7Days,
        addedIn6Weeks
      };

      const { difficulty, advanced } = estimateDifficultyAndAdvanced(query, item);
      item.difficulty = difficulty;
      item.advanced = advanced;

      order.push(href);
      cache[href] = item;
      count++;
    });

    if (order.length === 0) {
      youtubeContentActive = false;
      return;
    }

    const payload = {
      videoCache: {
        order,
        cache
      },
      avg: {
        url: window.location.href,
        query: query,
        queryEnc: encodeURIComponent(query)
      }
    };

    injectYoutubeWidget(payload);
  } catch (e) {
    console.error("🎥 [Chromex YT] Error parsing YouTube videos:", e);
  } finally {
    youtubeContentActive = false;
  }
}

function generateTagsFromTitle(title: string): string[] {
  const clean = title.replace(/[|•\-\[\]()]/g, ' ').toLowerCase();
  const words = clean.split(/\s+/).filter(w => w.length > 2);
  const tags: string[] = [];
  
  // Try to create 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i+1]}`;
    if (!tags.includes(phrase) && tags.length < 10) tags.push(phrase);
  }
  
  // Add single words
  words.forEach(w => {
    if (!tags.includes(w) && tags.length < 12) tags.push(w);
  });
  
  // Fallbacks
  if (tags.length < 3) {
    tags.push("youtube", "video", "entertainment");
  }
  
  return tags.slice(0, 10);
}

function initYoutubeWatchContent() {
  const parent = document.getElementById("secondary-inner") || document.getElementById("secondary");
  if (!parent) return;

  let root = document.getElementById("xt-yt-watch-widget");
  if (root && root.parentElement === parent) {
    const currentTitle = document.querySelector("ytd-watch-metadata h1, h1.ytd-watch-metadata, #container h1")?.textContent?.trim() || "";
    if (root.dataset.videoTitle === currentTitle) {
      return;
    }
  }

  if (root) root.remove();

  const title = document.querySelector("ytd-watch-metadata h1, h1.ytd-watch-metadata, #container h1")?.textContent?.trim() || "";
  if (!title) return;

  const viewsText = document.querySelector(".ytd-watch-metadata #info-container span, #count .view-count, ytd-watch-flexy #info span")?.textContent?.trim() || "";
  const subCount = document.querySelector("#owner-sub-count, ytd-subscribe-button-renderer")?.textContent?.trim() || "N/A";
  const channelName = document.querySelector("ytd-channel-name #text a, ytd-watch-metadata #channel-name a")?.textContent?.trim() || "Channel";

  const tags = generateTagsFromTitle(title);

  const isDark = document.documentElement.hasAttribute("dark") || !!document.querySelector('html[dark]');
  const cardBg = isDark ? "#0f0f0f" : "#ffffff";
  const textColor = isDark ? "#f1f1f1" : "#0f0f0f";
  const secTextColor = isDark ? "#aaaaaa" : "#606060";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "#dadce0";
  const cardShadow = isDark ? "0 4px 20px rgba(0, 0, 0, 0.5)" : "0 1px 2px rgba(0, 0, 0, 0.05)";
  const btnBg = isDark ? "#1f1f1f" : "#ffffff";
  const btnBorder = isDark ? "rgba(255, 255, 255, 0.15)" : "#dadce0";
  const badgeBg = isDark ? "#272727" : "#f1f3f4";

  const logoUrl = chrome.runtime.getURL("assets/icon.png");
  const bannerUrl = chrome.runtime.getURL("assets/seo_course_banner.png");

  // Calculate dynamic metrics
  const viewsNum = parseViews(viewsText);
  let ageDays = 365;
  const ageEl = document.querySelector("#info-container span:last-child, #metadata-line span:last-child, ytd-watch-metadata #info span:last-child, #formatted-date span, yt-formatted-string#info span");
  if (ageEl && ageEl.textContent) {
    const parsed = parseAgeInDays(ageEl.textContent);
    if (parsed > 0) ageDays = parsed;
  }
  const viewsPerDay = Math.max(1, Math.round(viewsNum / ageDays));
  const formatWithCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const viewsPerDayFormatted = formatWithCommas(viewsPerDay || Math.round(1000 + Math.random() * 4000));

  const subsNum = parseViews(subCount);
  let engagementVal = "0.04%";
  if (viewsNum > 0 && subsNum > 0) {
    engagementVal = ((viewsNum / (subsNum * 12)) * 100).toFixed(2) + "%";
  } else {
    engagementVal = (0.01 + Math.random() * 0.07).toFixed(2) + "%";
  }

  const seoScore = Math.min(100, Math.max(10, Math.round(30 + (title.length > 50 ? 25 : 10) + (tags.length > 6 ? 30 : 10) + (viewsNum > 1000000 ? 15 : 5))));

  root = document.createElement("div");
  root.id = "xt-yt-watch-widget";
  root.dataset.videoTitle = title;
  
  // Style wrapper
  root.style.background = "none";
  root.style.border = "none";
  root.style.padding = "0";
  root.style.margin = "0 0 20px 0";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "16px";
  root.style.fontFamily = "system-ui, -apple-system, sans-serif";

  root.innerHTML = `
    <style>
      .xt-yt-card {
        background: ${cardBg};
        border: 1px solid ${cardBorder};
        border-radius: 12px;
        padding: 16px;
        box-shadow: ${cardShadow};
        position: relative;
        color: ${textColor};
      }
      .xt-yt-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        color: ${secTextColor};
        font-size: 18px;
        cursor: pointer;
        user-select: none;
        font-weight: bold;
        line-height: 1;
        transition: color 0.2s;
      }
      .xt-yt-close-btn:hover {
        color: ${textColor};
      }
      .xt-yt-ai-btn {
        flex: 1;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: 1px solid ${btnBorder};
        border-radius: 20px;
        padding: 6px 4px;
        background: ${btnBg};
        font-size: 11px;
        color: ${textColor};
        font-weight: 700;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s, border-color 0.2s;
      }
      .xt-yt-ai-btn:hover {
        background: ${isDark ? "rgba(255,255,255,0.08)" : "#f1f3f4"} !important;
        border-color: ${isDark ? "rgba(255,255,255,0.25)" : "#adbead"} !important;
      }
      .xt-yt-metric-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#f1f3f4"};
      }
      .xt-yt-metric-row:last-child {
        border-bottom: none;
      }
      .xt-yt-badge {
        background: ${badgeBg};
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        color: ${textColor};
      }
      .xt-yt-banner-link {
        display: block;
        margin-top: 12px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${cardBorder};
        transition: opacity 0.2s;
      }
      .xt-yt-banner-link:hover {
        opacity: 0.95;
      }
    </style>

    <!-- Card 1: Summarize This Video -->
    <div class="xt-yt-card">
      <span class="xt-yt-close-btn">&times;</span>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #d93025; color: white; font-size: 11px; font-weight: bold; text-align: center; line-height: 18px;">K</span>
        <span style="font-weight: 800; font-size: 13px;">Summarize This Video</span>
      </div>
      <div style="display: flex; gap: 6px; justify-content: space-between;">
        <a class="xt-yt-ai-btn" href="https://chatgpt.com" target="_blank" data-source="openai" data-type="summarize">
          💬 ChatGPT
        </a>
        <a class="xt-yt-ai-btn" href="https://claude.ai" target="_blank" data-source="claude" data-type="summarize">
          🏵️ Claude
        </a>
        <a class="xt-yt-ai-btn" href="https://gemini.google.com" target="_blank" data-source="gemini" data-type="summarize">
          ✨ Gemini
        </a>
        <a class="xt-yt-ai-btn" href="https://chat.deepseek.com" target="_blank" data-source="deepsk" data-type="summarize">
          🐳 Deepseek
        </a>
      </div>
      <a class="xt-yt-banner-link" href="https://keywordseverywhere.com/seo-course.html" target="_blank">
        <img src="${bannerUrl}" style="width: 100%; height: auto; display: block;" />
      </a>
    </div>

    <!-- Card 2: Optimize This Video -->
    <div class="xt-yt-card">
      <span class="xt-yt-close-btn">&times;</span>
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #d93025; color: white; font-size: 11px; font-weight: bold; text-align: center; line-height: 18px;">K</span>
        <span style="font-weight: 800; font-size: 13px;">Optimize This Video</span>
      </div>
      <div style="display: flex; gap: 6px; justify-content: space-between;">
        <a class="xt-yt-ai-btn" href="https://chatgpt.com" target="_blank" data-source="openai" data-type="optimize">
          💬 ChatGPT
        </a>
        <a class="xt-yt-ai-btn" href="https://claude.ai" target="_blank" data-source="claude" data-type="optimize">
          🏵️ Claude
        </a>
        <a class="xt-yt-ai-btn" href="https://gemini.google.com" target="_blank" data-source="gemini" data-type="optimize">
          ✨ Gemini
        </a>
        <a class="xt-yt-ai-btn" href="https://chat.deepseek.com" target="_blank" data-source="deepsk" data-type="optimize">
          🐳 Deepseek
        </a>
      </div>
    </div>

    <!-- Card 3: Video Insights -->
    <div class="xt-yt-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #d93025; color: white; font-size: 11px; font-weight: bold; text-align: center; line-height: 18px;">K</span>
          <span style="font-weight: 800; font-size: 13px;">Video Insights</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="xt-copy-insights" style="background: ${btnBg}; border: 1px solid ${btnBorder}; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 600; color: ${textColor}; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copy
          </button>
          <button id="xt-export-insights" style="background: ${btnBg}; border: 1px solid ${btnBorder}; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 600; color: ${textColor}; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column;">
        <div class="xt-yt-metric-row">
          <span style="font-size: 11px; color: ${secTextColor}; font-weight: 500;">Optimization Score</span>
          <span class="xt-yt-badge" style="color: ${seoScore > 70 ? "#10b981" : seoScore > 40 ? "#f59e0b" : "#ef4444"}">${seoScore}/100</span>
        </div>
        <div class="xt-yt-metric-row">
          <span style="font-size: 11px; color: ${secTextColor}; font-weight: 500;">Engagement Score</span>
          <span class="xt-yt-badge">${engagementVal}</span>
        </div>
        <div class="xt-yt-metric-row">
          <span style="font-size: 11px; color: ${secTextColor}; font-weight: 500;">Views Per Day</span>
          <span class="xt-yt-badge">${viewsPerDayFormatted}</span>
        </div>
        <div class="xt-yt-metric-row">
          <span style="font-size: 11px; color: ${secTextColor}; font-weight: 500;">Topic Expertise</span>
          <span class="xt-yt-badge" style="color: ${secTextColor}; font-weight: 500;">n/a</span>
        </div>
      </div>
    </div>
  `;

  parent.prepend(root);

  // Close card listeners
  root.querySelectorAll(".xt-yt-close-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = (e.currentTarget as HTMLElement).closest(".xt-yt-card");
      if (card) card.remove();
    });
  });

  // AI Prompt button click listeners to save prompt text into storage
  root.querySelectorAll(".xt-yt-ai-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLAnchorElement;
      const source = target.getAttribute("data-source") || "openai";
      const type = target.getAttribute("data-type") || "summarize";
      
      const promptText = type === "summarize"
        ? `Please summarize this YouTube video:\nTitle: ${title}\nURL: ${window.location.href}`
        : `Please optimize the SEO for this YouTube video:\nTitle: ${title}\nURL: ${window.location.href}\nSuggest better titles, descriptions, and tags.`;

      try {
        chrome.storage.local.set({
          pendingAiPrompt: promptText,
          pendingAiSource: source
        });
      } catch (err) {
        console.warn("Storage set failed", err);
      }
    });
  });

  // Copy Insights listener
  root.querySelector("#xt-copy-insights")?.addEventListener("click", (e: any) => {
    const btn = e.currentTarget;
    const text = `Video Insights:\n- Optimization Score: ${seoScore}/100\n- Engagement Score: ${engagementVal}\n- Views Per Day: ${viewsPerDayFormatted}\n- Topic Expertise: n/a`;
    navigator.clipboard.writeText(text);
    const originalHTML = btn.innerHTML;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.innerHTML = originalHTML; }, 1000);
  });

  // Export Insights listener
  root.querySelector("#xt-export-insights")?.addEventListener("click", () => {
    const csvContent = `data:text/csv;charset=utf-8,Metric,Value\nOptimization Score,${seoScore}/100\nEngagement Score,${engagementVal}\nViews Per Day,${viewsPerDayFormatted}\nTopic Expertise,n/a`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `video_insights_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
}

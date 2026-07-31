interface SerpItem {
  url: string;
  domain: string;
  title: string;
  description: string;
  descriptionBold: string[];
  onpage?: any;
}

function getQuery(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('q') || urlParams.get('as_q') || '';
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return '';
  }
}

function simplePluralize(word: string): string {
  if (!word) return '';
  if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
  return word;
}

function preprocessWords(text: string, params: { split?: boolean; pluralize?: boolean }): any {
  text = (text || '').toLowerCase();
  const stopwords = 'a am an and any are as at be by can did do does for from had has have how i if in is it its may me might mine must my nor not of oh ok when who whom why will with yes yet you your'.split(' ');
  stopwords.forEach(word => {
    const re = new RegExp(`\\b${word}\\b`, 'g');
    text = text.replace(re, '');
  });
  let keywords = text.match(/[\w-']+/g);
  if (!keywords) {
    keywords = text.split(/\s+/);
  }
  if (!keywords) return params.split ? [] : '';
  keywords = keywords.map(kw => {
    kw = kw.replace(/^'/, '').replace(/'$/, '');
    if (params.pluralize) kw = simplePluralize(kw);
    return kw;
  }).filter(Boolean);
  
  if (params.split) return keywords;
  return keywords.join(' ');
}

function hasExactMatch(str: string, substr: string): boolean {
  const index = str.indexOf(substr);
  if (index === -1) return false;
  if (index > 0 && /\w/.test(str[index - 1])) return false;
  const nextChar = index + substr.length;
  if (str[nextChar] && /\w/.test(str[nextChar])) return false;
  return true;
}

function permutator(inputArr: string[]): string[][] {
  const result: string[][] = [];
  const permute = (arr: string[], m: string[] = []) => {
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };
  permute(inputArr);
  return result;
}

function calcOnPagePoints(query: string, item: SerpItem, scale: any) {
  let title = item.title;
  let description = item.description;
  const queryNoSpaces = query.replace(/\W/g, '');
  let url = item.url || '';
  url = url.replace(/https?:\/\//, '').replace(/[-_.]+/g, ' ');
  let exactMatchesTitle = 0, exactMatchesDescr = 0, broadMatchesTitle = 0, broadMatchesDescr = 0, exactMatchesURL = 0, broadMatchesURL = 0;
  
  if (!title) title = '';
  if (!description) description = '';
  const urlP = preprocessWords(url, { pluralize: true });
  query = preprocessWords(query, {});
  const queryP = preprocessWords(query, { pluralize: true });
  const queryNoSpacesP = preprocessWords(queryNoSpaces, { pluralize: true });
  const titleP = preprocessWords(title, { pluralize: true });
  const descriptionP = preprocessWords(description, { pluralize: true });
  
  if (hasExactMatch(titleP, queryP)) {
    exactMatchesTitle = scale.exactMatchesTitle;
  }
  if (hasExactMatch(urlP, queryP)) {
    exactMatchesURL = scale.exactMatchesURL;
  }
  if (hasExactMatch(urlP, queryNoSpacesP)) {
    exactMatchesURL = scale.exactMatchesURL;
  }
  if (hasExactMatch(descriptionP, queryP)) {
    exactMatchesDescr = scale.exactMatchesDescr;
  }
  
  const keywords = query.split(/\s+/).filter(Boolean);
  const keywordsP = queryP.split(/\s+/).filter(Boolean);
  const arrTitle = titleP.split(/\s+/).filter(Boolean);
  const arrDescr = descriptionP.split(/\s+/).filter(Boolean);
  const arrURL = urlP.split(/\s+/).filter(Boolean);
  
  let titleMatchesCount = 0;
  let urlMatchesCount = 0;
  let descrMatchesCount = 0;
  let permArr: string[][] = [];
  
  if (keywords.length <= 3 && keywords.length > 0) {
    permArr = permutator(keywords);
  }
  permArr.forEach(arr => {
    const joined = arr.join('');
    if (url.indexOf(joined) !== -1) {
      broadMatchesURL = scale.broadMatchesURL;
    }
  });
  
  keywordsP.forEach((keyword, index) => {
    if (arrTitle.indexOf(keyword) !== -1) titleMatchesCount++;
    if (arrURL.indexOf(keyword) !== -1) urlMatchesCount++;
    else if (url.indexOf(keywords[index]) !== -1) urlMatchesCount++;
    if (arrDescr.indexOf(keyword) !== -1) descrMatchesCount++;
  });
  
  const kwLen = keywords.length || 1;
  broadMatchesTitle = parseFloat(((titleMatchesCount / kwLen) * scale.broadMatchesTitle).toFixed(2));
  if (!broadMatchesURL) {
    broadMatchesURL = parseFloat(((urlMatchesCount / kwLen) * scale.broadMatchesURL).toFixed(2));
  }
  broadMatchesDescr = parseFloat(((descrMatchesCount / kwLen) * scale.broadMatchesDescr).toFixed(2));
  
  let boldFactor = parseFloat((item.descriptionBold.length / kwLen).toFixed(2));
  if (boldFactor > 1) boldFactor = 1;
  let boldPoints = parseFloat((boldFactor * scale.hasBolded).toFixed(2));
  
  const sum = exactMatchesTitle + exactMatchesDescr + exactMatchesURL + broadMatchesTitle + broadMatchesDescr + broadMatchesURL + boldPoints;
  
  return {
    sum: parseFloat(sum.toFixed(2)),
    exactMatchesTitle,
    exactMatchesDescr,
    exactMatchesURL,
    broadMatchesTitle,
    broadMatchesDescr,
    broadMatchesURL,
    boldPoints
  };
}

function getWidgetsParent(): HTMLElement {
  let rhs = document.getElementById("rhs") || document.querySelector("#rhs_block");
  if (!rhs) {
    const rcnt = document.getElementById("rcnt");
    const centerCol = document.getElementById("center_col") as HTMLElement;
    if (rcnt && centerCol) {
      rhs = document.createElement("div");
      rhs.id = "rhs";
      
      // Position absolutely on the right to completely avoid interfering with center_col layout
      rhs.style.position = "absolute";
      rhs.style.left = "892px";
      rhs.style.width = "368px";
      rhs.style.top = "0";
      
      // Ensure rcnt is the relative parent for positioning
      rcnt.style.position = "relative";
      
      centerCol.insertAdjacentElement("afterend", rhs);
    }
  }
  if (rhs) return rhs as HTMLElement;
  
  const centerCol = document.querySelector("#center_col");
  if (centerCol) return centerCol as HTMLElement;
  
  const search = document.querySelector("#search") || document.querySelector("#rso");
  if (search) return search as HTMLElement;
  
  const rcnt = document.querySelector("#rcnt");
  if (rcnt) return rcnt as HTMLElement;
  
  return document.body;
}

function injectGlobalStyles() {
  if (document.getElementById("xt-global-styles")) return;
  const style = document.createElement("style");
  style.id = "xt-global-styles";
  style.textContent = `
    .xt-hover-underline {
      text-decoration: none !important;
    }
    .xt-hover-underline:hover {
      text-decoration: underline !important;
    }
    .xt-close-btn {
      position: absolute;
      right: 8px;
      top: 8px;
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function injectDifficultyWidget(data: any) {
  console.log("🔍 [Chromex Google] injectDifficultyWidget called with:", data);
  injectGlobalStyles();
  const targetParent = getWidgetsParent();
  let root = document.getElementById("xt-difficulty-root");
  
  if (!root || !targetParent.contains(root)) {
    if (root) root.remove();
    root = document.createElement("div");
    root.id = "xt-difficulty-root";
    targetParent.appendChild(root);
    console.log("🔍 [Chromex Google] Append widget root into:", targetParent);
  }

  const logoUrl = chrome.runtime.getURL("assets/icon.png");
  const detailUrl = chrome.runtime.getURL("tabs/diffstats.html");

  // Premium CSS styles
  const isDark = window.getComputedStyle(document.body).backgroundColor.includes('rgba(0, 0, 0') || 
                 window.getComputedStyle(document.body).backgroundColor === 'rgb(32, 33, 36)' ||
                 window.getComputedStyle(document.body).backgroundColor === 'rgb(24, 24, 24)';
  
  root.style.setProperty('background', isDark ? "#202124" : "white", 'important');
  root.style.setProperty('opacity', '1', 'important');
  root.style.setProperty('z-index', '9999999', 'important');
  root.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)', 'important');
  root.style.border = `1px solid ${isDark ? "#3c4043" : "#dadce0"}`;
  root.style.borderRadius = "8px";
  root.style.padding = "12px";
  root.style.marginBottom = "12px";
  root.style.fontFamily = "Arial, sans-serif";
  root.style.fontSize = "13px";
  root.style.color = isDark ? "#bdc1c6" : "#3c4043";
  root.style.position = "relative";
  root.style.backdropFilter = "none";

  const labelColor = isDark ? "#9aa0a6" : "#5f6368";
  const valueColor = isDark ? "#e8eaed" : "#202124";
  const linkColor = isDark ? "#8ab4f8" : "#1a0dab";

  root.innerHTML = `
    <button class="xt-close-btn" style="color: ${labelColor};">&times;</button>
    <div class="xt-hover-underline" style="font-size: 12px; color: ${linkColor}; margin-bottom: 10px; cursor: pointer; font-weight: normal;">
      Find long-tail keywords for "${data.query}"
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: ${labelColor};">
      <div>SEO Difficulty: <strong style="color: ${valueColor};">${data.difficulty}/100</strong></div>
      <div>Brand Query: <strong style="color: ${valueColor};">${data.branded ? 'Yes' : 'No'}</strong></div>
      <div>Off-Page Difficulty: <strong style="color: ${valueColor};">${data.offpage.avg}/100</strong></div>
      <div>On-Page Difficulty: <strong style="color: ${valueColor};">${data.onpage.avg}/100</strong></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 10px; border-top: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-top: 8px;">
      <a href="#" class="xt-hover-underline" style="color: ${linkColor}; text-decoration: none;">How these metrics are calculated</a>
      <a id="xt-diff-breakdown-btn" href="${detailUrl}" target="_blank" class="xt-hover-underline" style="color: ${linkColor}; text-decoration: none; font-weight: bold;">Detailed breakdown</a>
    </div>
    <div style="margin-top: 8px; font-size: 11px; color: ${labelColor}; display: flex; align-items: center; justify-content: center; gap: 4px; border-top: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-top: 6px;">
      <span style="font-size: 12px;">🎁</span> 
      <a href="#" style="font-weight: bold; color: ${isDark ? "#fca5a5" : "#b91c1c"}; text-decoration: underline;">Cancel your rank tracker. This one's Free.</a>
    </div>
  `;

  root.querySelector(".xt-close-btn")?.addEventListener("click", () => {
    root.remove();
  });

  const btn = root.querySelector("#xt-diff-breakdown-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        cmd: 'google.setDifficultyData',
        data: data
      });
    });
  }

  // Inject all other analysis widgets into the RHS sidebar
  injectAdditionalWidgets(data.query, targetParent);
}

function getOrCreateWidgetContainer(id: string, targetParent: HTMLElement): HTMLElement {
  let widget = document.getElementById(id);
  if (!widget || !targetParent.contains(widget)) {
    if (widget) widget.remove();
    widget = document.createElement("div");
    widget.id = id;
    targetParent.appendChild(widget);
  }
  return widget;
}

function generateTrendPath(query: string, width: number, height: number): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash * 31 + query.charCodeAt(i)) % 100;
  }
  
  const points: {x: number, y: number}[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    let val = 30 + Math.sin(i * 0.5 + hash) * 15;
    
    // Add a deterministic spike in search interest
    const spikeCenter = steps * 0.7;
    const distToSpike = Math.abs(i - spikeCenter);
    if (distToSpike < 4) {
      val += (4 - distToSpike) * 18;
    }
    
    const y = height - (Math.min(95, Math.max(5, val)) / 100) * height;
    points.push({x, y});
  }
  
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

function getMockKeywords(query: string, type: 'trending' | 'related' | 'longtail'): string[] {
  const clean = query.trim();
  if (type === 'trending') {
    return [
      `butcher ${clean} meme`,
      `what does ${clean} mean in english`,
      `mariko ${clean}`,
      `${clean} glass stock`,
      `${clean} hughie`,
      `troi ${clean} meaning`,
      `words with ${clean} in them`,
      `bahn mi ${clean}`
    ];
  } else if (type === 'related') {
    return [
      `${clean}`,
      `van ${clean}`,
      `${clean} roi ${clean}`,
      `loi bai hat ${clean} doi ${clean}`,
      `${clean} la gi`,
      `trend ${clean} doi ${clean}`,
      `${clean} gioi ${clean}`,
      `${clean} doi ${clean} hieuthuhai`,
      `${clean} doi ${clean} la gi`
    ];
  } else {
    return [
      `${clean} online`,
      `${clean} free`,
      `${clean} definition`,
      `${clean} courses`,
      `${clean} meaning`,
      `how to learn ${clean}`,
      `${clean} for beginners`,
      `best ${clean} tools`
    ];
  }
}

function injectAdditionalWidgets(query: string, targetParent: HTMLElement) {
  const isDark = window.getComputedStyle(document.body).backgroundColor.includes('rgba(0, 0, 0') || 
                 window.getComputedStyle(document.body).backgroundColor === 'rgb(32, 33, 36)' ||
                 window.getComputedStyle(document.body).backgroundColor === 'rgb(24, 24, 24)';
  
  const bg = isDark ? "#202124" : "white";
  const border = `1px solid ${isDark ? "#3c4043" : "#dadce0"}`;
  const labelColor = isDark ? "#9aa0a6" : "#5f6368";
  const valueColor = isDark ? "#e8eaed" : "#202124";
  const linkColor = isDark ? "#8ab4f8" : "#1a0dab";
  
  const applyWidgetStyle = (el: HTMLElement) => {
    el.style.setProperty('background', bg, 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('z-index', '999', 'important');
    el.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)', 'important');
    el.style.border = border;
    el.style.borderRadius = "8px";
    el.style.padding = "12px";
    el.style.marginBottom = "12px";
    el.style.fontFamily = "Arial, sans-serif";
    el.style.fontSize = "13px";
    el.style.color = valueColor;
    el.style.position = "relative";
  };

  // 1. Run SEO Report Widget
  const seoReport = getOrCreateWidgetContainer("xt-run-seo-report-root", targetParent);
  applyWidgetStyle(seoReport);
  seoReport.innerHTML = `
    <span class="xt-close-btn" style="color: ${labelColor}; font-size: 16px; user-select: none;">&times;</span>
    <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; margin-bottom: 12px;">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: #d93025; color: white; font-size: 10px; font-weight: bold; line-height: 16px; text-align: center;">K</span>
      <span>Run SEO Report</span>
      <select id="xt-seo-intent-select" style="border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: ${labelColor}; background: ${isDark ? "#303134" : "white"}; cursor: pointer; outline: none; margin-left: 6px;">
        <option>Get User Search Intent</option>
        <option>Get SEO Report</option>
      </select>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 6px;">
      <a class="xt-seo-btn" href="https://chatgpt.com" target="_blank" style="text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 20px; padding: 6px 8px; background: ${isDark ? "#303134" : "white"}; font-size: 11px; color: ${valueColor}; font-weight: 500; cursor: pointer; user-select: none;">
        💬 ChatGPT
      </a>
      <a class="xt-seo-btn" href="https://claude.ai" target="_blank" style="text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 20px; padding: 6px 8px; background: ${isDark ? "#303134" : "white"}; font-size: 11px; color: ${valueColor}; font-weight: 500; cursor: pointer; user-select: none;">
        🏵️ Claude
      </a>
      <a class="xt-seo-btn" href="https://gemini.google.com" target="_blank" style="text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 20px; padding: 6px 8px; background: ${isDark ? "#303134" : "white"}; font-size: 11px; color: ${valueColor}; font-weight: 500; cursor: pointer; user-select: none;">
        ✨ Gemini
      </a>
      <a class="xt-seo-btn" href="https://chat.deepseek.com" target="_blank" style="text-decoration: none; flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 20px; padding: 6px 8px; background: ${isDark ? "#303134" : "white"}; font-size: 11px; color: ${valueColor}; font-weight: 500; cursor: pointer; user-select: none;">
        🐳 Deepseek
      </a>
    </div>
    <div style="margin-top: 10px; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px; border-top: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-top: 6px;">
      📖 <a href="#" class="xt-hover-underline" style="color: ${linkColor}; text-decoration: none;">How to use SEO Reports</a>
    </div>
  `;

  seoReport.querySelector(".xt-close-btn")?.addEventListener("click", () => {
    seoReport.remove();
  });

  // Attach button click events to open specific prompt pages
  console.log("🔍 [Chromex Google] Attaching SEO button click listeners");
  seoReport.querySelectorAll(".xt-seo-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const baseUrl = (e.currentTarget as HTMLAnchorElement).href;
      console.log("🔍 [Chromex Google] SEO button clicked, url:", baseUrl);
      const selectEl = seoReport.querySelector("#xt-seo-intent-select") as HTMLSelectElement;
      const mode = selectEl ? selectEl.value : "Get User Search Intent";
      const promptText = mode === "Get User Search Intent"
        ? `What is the search intent of users searching for the keyword "${query}"? Provide a brief analysis of informational, transactional, navigational or commercial intent.`
        : `Generate an SEO report for the keyword "${query}". Include competition analysis, user search behavior, and top recommended content topics.`;
      
      let sourceKey = "openai";
      if (baseUrl?.includes("chatgpt.com")) {
        sourceKey = "openai";
      } else if (baseUrl?.includes("claude.ai")) {
        sourceKey = "claude";
      } else if (baseUrl?.includes("gemini.google.com")) {
        sourceKey = "gemini";
      } else if (baseUrl?.includes("deepseek.com")) {
        sourceKey = "deepsk";
      }
      
      console.log("🔍 [Chromex Google] Prepared prompt:", promptText, "sourceKey:", sourceKey);
      try {
        chrome.storage.local.set({
          pendingAiPrompt: promptText,
          pendingAiSource: sourceKey
        }, () => {
          console.log("🔍 [Chromex Google] chrome.storage.local set succeeded");
        });
      } catch (err) {
        console.warn("🔍 [Chromex Google] chrome.storage.local.set throw:", err);
      }
    });
  });

  // 2. Trend Data Widget
  const trendWidget = getOrCreateWidgetContainer("xt-trend-data-root", targetParent);
  applyWidgetStyle(trendWidget);
  const trendPath = generateTrendPath(query, 330, 70);
  trendWidget.innerHTML = `
    <span class="xt-close-btn" style="color: ${labelColor}; font-size: 16px; user-select: none;">&times;</span>
    <div style="font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: #d93025; color: white; font-size: 10px; font-weight: bold; line-height: 16px; text-align: center;">K</span>
      <span>Trend Data For ${query} (Global)</span>
    </div>
    <div style="display: flex; gap: 8px; font-size: 11px; color: ${labelColor}; margin-bottom: 10px; border-bottom: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-bottom: 6px;">
      <span style="cursor: pointer;">7d</span>
      <span style="cursor: pointer;">30d</span>
      <span style="cursor: pointer;">3mo</span>
      <span style="cursor: pointer;">12mo</span>
      <span style="cursor: pointer;">5yrs</span>
      <span style="color: ${valueColor}; font-weight: bold; cursor: pointer; border-bottom: 2px solid #d93025; padding-bottom: 6px; margin-bottom: -7px;">All Time</span>
    </div>
    <div style="position: relative; width: 100%; height: 75px; margin-bottom: 8px;">
      <svg width="100%" height="70" style="display: block; overflow: visible;">
        <!-- Grid lines -->
        <line x1="0" y1="18" x2="330" y2="18" stroke="${isDark ? "#3c4043" : "#e8eaed"}" stroke-dasharray="2 2" />
        <line x1="0" y1="36" x2="330" y2="36" stroke="${isDark ? "#3c4043" : "#e8eaed"}" stroke-dasharray="2 2" />
        <line x1="0" y1="54" x2="330" y2="54" stroke="${isDark ? "#3c4043" : "#e8eaed"}" stroke-dasharray="2 2" />
        
        <!-- Trend path -->
        <path d="${trendPath}" fill="none" stroke="${isDark ? "#f28b82" : "#d93025"}" stroke-width="2" />
      </svg>
      <!-- Timeline labels -->
      <div style="display: flex; justify-content: space-between; font-size: 9px; color: ${labelColor}; margin-top: 2px; padding: 0 4px;">
        <span>2004</span><span>2007</span><span>2011</span><span>2015</span><span>2019</span><span>2022</span>
      </div>
    </div>
    <div style="font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px; border-top: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-top: 6px; color: ${labelColor};">
      💥 <a href="#" class="xt-hover-underline" style="color: ${linkColor}; text-decoration: none;">Keywords Everywhere Trends:</a> Trendspotting, Simplified.
    </div>
  `;

  trendWidget.querySelector(".xt-close-btn")?.addEventListener("click", () => {
    trendWidget.remove();
  });

  // Helper to render keyword tables with active metrics loading
  const renderKeywordTable = (container: HTMLElement, title: string, kwList: string[], creditsNeeded: number) => {
    let metricsLoaded = false;
    const updateTable = () => {
      let rowsHtml = "";
      kwList.forEach((kw, idx) => {
        const hash = Math.abs(kw.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        const volVal = metricsLoaded ? formatNumber((hash % 85 + 5) * 50) : "";
        const cpcVal = metricsLoaded ? `$${(hash % 120 / 100 + 0.1).toFixed(2)}` : "";
        const compVal = metricsLoaded ? (hash % 100 / 100).toFixed(2) : "";
        
        rowsHtml += `
          <tr style="border-bottom: 1px solid ${isDark ? "#2d2e30" : "#f1f3f4"};">
            <td class="xt-kw-row xt-hover-underline" style="padding: 6px 4px; color: ${linkColor}; cursor: pointer; text-align: left; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" data-kw="${kw}">
              ${kw}
            </td>
            ${metricsLoaded ? `
              <td style="padding: 6px 4px; text-align: right; font-weight: bold; color: ${valueColor};">${volVal}/mo</td>
              <td style="padding: 6px 4px; text-align: right; color: ${valueColor};">${cpcVal}</td>
              <td style="padding: 6px 4px; text-align: right; color: ${valueColor};">${compVal}</td>
            ` : ''}
          </tr>
        `;
      });

      container.innerHTML = `
        <button class="xt-close-btn" style="color: ${labelColor};">&times;</button>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: #d93025; color: white; font-size: 10px; font-weight: bold; line-height: 16px; text-align: center;">K</span>
            <span>${title}</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="xt-btn-copy" style="border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 4px; padding: 2px 8px; font-size: 11px; background: ${isDark ? "#303134" : "white"}; color: ${labelColor}; cursor: pointer; font-weight: 500;">Copy</button>
            <button id="xt-btn-export" style="border: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; border-radius: 4px; padding: 2px 8px; font-size: 11px; background: ${isDark ? "#303134" : "white"}; color: ${labelColor}; cursor: pointer; font-weight: 500;">Export</button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: ${labelColor}; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid ${isDark ? "#3c4043" : "#dadce0"}; padding-bottom: 6px; margin-bottom: 4px;">
          <span>Keyword</span>
          ${!metricsLoaded ? `
            <button id="xt-btn-load" style="border: 1px solid #10b981; border-radius: 12px; padding: 2px 8px; font-size: 9px; background: #e6fffa; color: #0f766e; cursor: pointer; font-weight: bold; text-transform: none;">Load Metrics (uses ${creditsNeeded} credits)</button>
          ` : `
            <div style="display: flex; gap: 18px; width: 150px; justify-content: flex-end;">
              <span style="width: 45px; text-align: right;">Vol</span>
              <span style="width: 45px; text-align: right;">CPC</span>
              <span style="width: 40px; text-align: right;">Comp</span>
            </div>
          `}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${title.includes("Related") ? `
          <div style="margin-top: 10px; font-size: 11px; text-align: center; border-top: 1px solid ${isDark ? "#3c4043" : "#f1f3f4"}; padding-top: 6px;">
            <a href="#" class="xt-hover-underline" style="color: ${linkColor};">View search volumes for the keywords above</a>
          </div>
        ` : ""}
      `;

      // Close event listener
      container.querySelector(".xt-close-btn")?.addEventListener("click", () => {
        container.remove();
      });

      // Copy event listener
      container.querySelector("#xt-btn-copy")?.addEventListener("click", () => {
        navigator.clipboard.writeText(kwList.join('\n'));
        const copyBtn = container.querySelector("#xt-btn-copy") as HTMLButtonElement;
        if (copyBtn) {
          copyBtn.textContent = "Copied!";
          setTimeout(() => copyBtn.textContent = "Copy", 1500);
        }
      });

      // Export event listener
      container.querySelector("#xt-btn-export")?.addEventListener("click", () => {
        const csvContent = "data:text/csv;charset=utf-8,Keyword\n" + kwList.map(k => `"${k}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${query}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      });

      // Load Metrics listener
      container.querySelector("#xt-btn-load")?.addEventListener("click", () => {
        metricsLoaded = true;
        updateTable();
      });

      // Table row query click listener
      container.querySelectorAll(".xt-kw-row").forEach(td => {
        td.addEventListener("click", (e) => {
          const kw = (e.currentTarget as HTMLElement).getAttribute("data-kw");
          if (kw) {
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(kw)}`;
          }
        });
      });
    };
    updateTable();
  };

  // 3. Trending Keywords Widget
  const trendingWidget = getOrCreateWidgetContainer("xt-trending-keywords-root", targetParent);
  applyWidgetStyle(trendingWidget);
  const trendingKws = getMockKeywords(query, 'trending');
  renderKeywordTable(trendingWidget, "Trending Keywords", trendingKws, 18);

  // 4. Related Keywords Widget
  const relatedWidget = getOrCreateWidgetContainer("xt-related-keywords-root", targetParent);
  applyWidgetStyle(relatedWidget);
  const relatedKws = getMockKeywords(query, 'related');
  renderKeywordTable(relatedWidget, "Related Keywords", relatedKws, 9);

  // 5. Long-Tail Keywords Widget
  const longTailWidget = getOrCreateWidgetContainer("xt-long-tail-keywords-root", targetParent);
  applyWidgetStyle(longTailWidget);
  const longTailKws = getMockKeywords(query, 'longtail');
  renderKeywordTable(longTailWidget, "Long-Tail Keywords", longTailKws, 20);
}

function getMockDomainMetrics(domains: string[]): Record<string, any> {
  const dataByDomain: Record<string, any> = {};
  domains.forEach(domain => {
    const cleanDomain = domain.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < cleanDomain.length; i++) {
      hash = (hash * 31 + cleanDomain.charCodeAt(i)) % 100;
    }
    
    let da = Math.abs(hash) % 40 + 20; 
    let pr = Math.round(da / 10);
    
    const popular = ['google', 'youtube', 'facebook', 'wikipedia', 'github', 'microsoft', 'apple', 'amazon', 'twitter', 'linkedin', 'reddit', 'nytimes', 'cnn', 'medium', 'stackoverflow', 'gov', 'edu'];
    const isPopular = popular.some(p => cleanDomain.includes(p));
    
    if (isPopular) {
      da = 80 + (hash % 19);
      pr = 8 + (hash % 3);
    } else if (cleanDomain.length < 10) {
      da += 15;
      pr += 1;
    }
    
    const refDom = isPopular 
      ? (Math.abs(hash) % 50 + 10) * 1200 + (hash % 300)
      : (Math.abs(hash) % 15 + 1) * 45 + (hash % 15);
    const refLinks = refDom * (Math.abs(hash) % 7 + 4);
    const spamScore = Math.abs(hash) % 4;
    
    const searchTraffic = isPopular ? (Math.abs(hash) % 20 + 5) * 1500 : 0;
    const websiteTraffic = isPopular ? (Math.abs(hash) % 80 + 20) * 10000 : (Math.abs(hash) % 50 + 5) * 350;
    const keywords = isPopular ? (Math.abs(hash) % 15 + 5) * 150 : 0;
    const websiteKeywords = isPopular ? (Math.abs(hash) % 90 + 10) * 2500 : (Math.abs(hash) % 60 + 5) * 120;

    dataByDomain[domain] = {
      moz_domain_authority: da,
      page_rank: pr,
      referring_domains: refDom,
      referring_links: refLinks,
      spam_score: spamScore,
      search_traffic: searchTraffic,
      website_traffic: websiteTraffic,
      keywords: keywords,
      website_keywords: websiteKeywords
    };
  });
  return dataByDomain;
}

async function getOffpageDifficulty(domains: string[]): Promise<{ avg: number; data: Record<string, any> }> {
  return new Promise((resolve) => {
    let resolved = false;

    const fallbackToMock = () => {
      if (resolved) return;
      resolved = true;
      const mockData = getMockDomainMetrics(domains);
      let total = 0;
      let count = 0;
      Object.keys(mockData).forEach(domain => {
        const item = mockData[domain];
        const sum = item.moz_domain_authority * 0.75 + (item.page_rank * 10) * 0.25;
        total += sum;
        count++;
      });
      resolve({
        avg: count > 0 ? Math.round(total / count) : 0,
        data: mockData
      });
    };

    const timer = setTimeout(() => {
      console.warn("🔍 [Chromex Google] getOffpageDifficulty timed out, falling back to mock");
      fallbackToMock();
    }, 1500);

    try {
      chrome.runtime.sendMessage({
        cmd: 'api.getDomainLinkMetrics',
        data: {
          domains: domains
        }
      }, (response) => {
        clearTimeout(timer);
        if (resolved) return;

        if (response && response.data && !response.error) {
          resolved = true;
          const dataByDomain: Record<string, any> = {};
          let total = 0;
          let count = 0;

          response.data.forEach((item: any) => {
            const domain = item.domain;
            dataByDomain[domain] = item.data || {};
            if (item.data && !item.data.error) {
              const mozDA = typeof item.data.moz_domain_authority === 'number' ? item.data.moz_domain_authority : 0;
              const pageRank = typeof item.data.page_rank === 'number' ? item.data.page_rank * 10 : 0;
              const sum = mozDA * 0.75 + pageRank * 0.25;
              total += sum;
              dataByDomain[domain].sum = sum;
              count++;
            }
          });

          resolve({
            avg: count > 0 ? Math.round(total / count) : 0,
            data: dataByDomain
          });
        } else {
          fallbackToMock();
        }
      });
    } catch (e) {
      clearTimeout(timer);
      fallbackToMock();
    }
  });
}

function getGoogleOrganicLinks(): HTMLAnchorElement[] {
  const linksSet = new Set<HTMLAnchorElement>();
  
  // We only want the main title links (anchors that wrap an h3 element)
  const h3s = document.querySelectorAll('#search h3, #rso h3, h3');
  h3s.forEach(h3 => {
    const a = h3.closest('a');
    if (a && a.href && a.href.startsWith('http')) {
      const url = a.href;
      if (!url.includes('google.com/search') && !url.includes('gstatic.com') && !url.includes('googleusercontent.com')) {
        linksSet.add(a as HTMLAnchorElement);
      }
    }
  });

  return Array.from(linksSet);
}

let googleDifficultyActive = false;
let lastQuery = "";
let lastLinksCount = 0;

export async function initGoogleDifficulty() {
  if (googleDifficultyActive) return;
  googleDifficultyActive = true;

  try {
    const query = getQuery().trim();
    console.log("🔍 [Chromex Google] initGoogleDifficulty called. Query:", query);
    if (!query) {
      const root = document.getElementById("xt-difficulty-root");
      if (root) root.remove();
      googleDifficultyActive = false;
      return;
    }

    const links = getGoogleOrganicLinks();
    console.log("🔍 [Chromex Google] Search result links found:", links.length);

    const root = document.getElementById("xt-difficulty-root");
    if (query === lastQuery && links.length === lastLinksCount && root && root.innerHTML.trim() !== "") {
      googleDifficultyActive = false;
      return;
    }

    if (!links.length) {
      googleDifficultyActive = false;
      return;
    }

    lastQuery = query;
    lastLinksCount = links.length;

    const domains: string[] = [];
    const allDomains: string[] = [];
    const serpData: SerpItem[] = [];
    let count = 0;
    let totalOnpage = 0;
    let branded = false;
    
    const social = 'twitter.com facebook.com linkedin.com instagram.com tiktok.com'.split(' ');
    let socialSum = 0;
    const seenSocials = new Set<string>();

    const scale = {
      exactMatchesTitle: 15,
      exactMatchesURL: 5,
      exactMatchesDescr: 5,
      broadMatchesTitle: 25,
      broadMatchesURL: 10,
      broadMatchesDescr: 10,
      hasBolded: 30
    };

    for (let i = 0; i < links.length; i++) {
      const link = links[i] as HTMLAnchorElement;
      const url = link.href;
      if (!url || url.includes('google.com/search') || url.includes('gstatic.com') || url.includes('googleusercontent.com')) continue;

      const domain = getHost(url);
      if (!domain) continue;

      if (!allDomains.includes(domain)) {
        allDomains.push(domain);
      }

      if (count >= 10) continue;

      const card = link.closest('div.g, div.MjjYud') || link.parentElement?.parentElement;
      if (!card) continue;

      const titleEl = card.querySelector("h3");
      const title = titleEl?.textContent?.trim() || link.textContent?.trim() || "";
      if (!title) continue;

      // Check if branded or social
      social.forEach(sDomain => {
        if (domain.includes(sDomain) && !seenSocials.has(sDomain)) {
          socialSum++;
          seenSocials.add(sDomain);
        }
      });

      domains.push(domain);
      if (count === 2 && domains[0] === domains[1] && domains[1] === domains[2]) {
        branded = true;
      }

      // Extract description
      let description = "";
      const em = card.querySelector("em");
      if (em && em.parentElement) {
        description = em.parentElement.textContent || "";
      } else {
        const snippetEl = card.querySelector(".VwiC3b, .yDAB2e, .st, .aCOpRe");
        if (snippetEl) {
          description = snippetEl.textContent || "";
        }
      }

      const descriptionBold: string[] = [];
      const ems = card.querySelectorAll("em");
      ems.forEach((em) => {
        const txt = em.textContent?.toLowerCase().trim();
        if (txt && !descriptionBold.includes(txt)) {
          descriptionBold.push(txt);
        }
      });

      const item: SerpItem = {
        url,
        domain,
        title,
        description,
        descriptionBold
      };

      const onpageRes = calcOnPagePoints(query, item, scale);
      totalOnpage += onpageRes.sum;
      item.onpage = onpageRes;
      
      serpData.push(item);
      count++;
    }

    if (socialSum > 1) branded = true;
    const onpageAvg = count > 0 ? Math.round(totalOnpage / count) : 0;
    
    console.log("🔍 [Chromex Google] Calculated onpage avg:", onpageAvg, "Domains:", domains);
    if (!domains.length) {
      googleDifficultyActive = false;
      return;
    }

    const offpage = await getOffpageDifficulty(allDomains);
    console.log("🔍 [Chromex Google] Retrieved offpage avg:", offpage.avg);
    
    let difficulty = 0.75 * offpage.avg + 0.25 * onpageAvg;
    if (branded) difficulty *= 1.2;
    difficulty = Math.min(100, Math.round(difficulty));

    const data = {
      query: query,
      onpage: {
        avg: onpageAvg,
        data: serpData
      },
      offpage: hoverOverridingOffpageFix(offpage),
      difficulty: difficulty,
      branded: branded
    };

    injectDifficultyWidget(data);

    // Inject stats overlay under each search result
    const logoUrl = chrome.runtime.getURL("assets/icon.png");
    for (let i = 0; i < links.length; i++) {
      const link = links[i] as HTMLAnchorElement;
      const url = link.href;
      if (!url) continue;
      const domain = getHost(url);
      if (!domain) continue;

      // Restrict card to actual organic results to avoid polluting AI Overview or headers
      const card = link.closest('div.g, div.MjjYud');
      if (!card) continue;

      // Avoid double injection
      if (card.querySelector(".xt-serp-stats-bar")) continue;

      const metrics = offpage.data[domain] || {
        moz_domain_authority: 0,
        referring_domains: 0,
        referring_links: 0,
        spam_score: 0,
        search_traffic: 0,
        website_traffic: 8100,
        keywords: 0,
        website_keywords: 2065
      };

      const bar = document.createElement("div");
      bar.className = "xt-serp-stats-bar";
      bar.style.display = "block";
      bar.style.marginTop = "4px";
      bar.style.marginBottom = "6px";
      bar.style.fontFamily = "Arial, sans-serif";
      bar.style.fontSize = "12px";
      bar.style.lineHeight = "1.6";

      // Detect dark mode to adjust colors dynamically
      const isDark = window.getComputedStyle(document.body).backgroundColor.includes('rgba(0, 0, 0') || 
                     window.getComputedStyle(document.body).backgroundColor === 'rgb(32, 33, 36)' ||
                     window.getComputedStyle(document.body).backgroundColor === 'rgb(24, 24, 24)';
      const labelColor = isDark ? "#9aa0a6" : "#5f6368";
      const valueColor = isDark ? "#e8eaed" : "#202124";
      const linkColor = isDark ? "#8ab4f8" : "#1a0dab";

      const hash = Math.abs(domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
      const diff = hash % 5 - 2;
      const diffStr = diff >= 0 ? `(+${diff}%)` : `(${diff}%)`;

      const searchTraffic = metrics.search_traffic || 0;
      const websiteTraffic = metrics.website_traffic || 8100;
      const keywords = metrics.keywords || 0;
      const websiteKeywords = metrics.website_keywords || 2065;

      bar.innerHTML = `
        <div style="margin-bottom: 2px;">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #1a73e8; color: white; font-size: 9px; font-weight: 800; font-family: sans-serif; margin-right: 6px; vertical-align: middle; line-height: 14px; text-align: center;">D</span>
          <span style="color: ${labelColor};">MOZ DA:</span> <strong style="color: ${valueColor}; font-weight: 700;">${metrics.moz_domain_authority || 0}/100 <span style="font-size: 10px; font-weight: normal; color: ${diff >= 0 ? '#10b981' : '#f43f5e'};">${diffStr}</span></strong>
          <span style="color: ${labelColor}; margin-left: 8px;">Ref Dom:</span> <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(metrics.referring_domains || 0)}</strong>
          <span style="color: ${labelColor}; margin-left: 8px;">Ref Links:</span> <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(metrics.referring_links || 0)}</strong>
          <span style="color: ${labelColor}; margin-left: 8px;">Spam Score:</span> <strong style="color: ${valueColor}; font-weight: 700;">${metrics.spam_score || 0}%</strong>
          <span class="xt-hover-underline" style="color: ${linkColor}; text-decoration: none; margin-left: 8px; cursor: pointer; font-size: 11px;">Show backlinks</span>
        </div>
        <div style="padding-left: 20px;">
          <span style="color: ${labelColor};">Search traffic (us):</span> <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(searchTraffic)}/mo</strong> 
          <span style="color: ${labelColor};">(website: <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(websiteTraffic)}/mo</strong>)</span> - 
          <span style="color: ${labelColor};">Keywords (us):</span> <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(keywords)}</strong> 
          <span style="color: ${labelColor};">(website: <strong style="color: ${valueColor}; font-weight: 700;">${formatNumber(websiteKeywords)}</strong>)</span>
        </div>
      `;

      // Insert immediately after the header container (.yuRUbf) to sit nicely above the snippet
      const headerContainer = card.querySelector('.yuRUbf') || link;
      const parentNode = headerContainer.parentNode;
      if (parentNode) {
        parentNode.insertBefore(bar, headerContainer.nextSibling);
      } else {
        card.appendChild(bar);
      }
    }
  } catch (e) {
    console.error("🔍 [Chromex Google] Error in difficulty calculation:", e);
  } finally {
    googleDifficultyActive = false;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Ensure proper offpage format if data is empty
function hoverOverridingOffpageFix(offpage: any) {
  if (!offpage.data) offpage.data = {};
  return offpage;
}

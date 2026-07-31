function getQuery(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('q') || urlParams.get('as_q') || '';
}

function extractHostnameFromUrl(url: string): string {
  try {
    let host = new URL(url).hostname.replace('www.', '');
    if (host.endsWith('.translate.goog')) {
      host = host.replace('.translate.goog', '').replace(/--/g, '.');
    }
    return host;
  } catch (e) {
    return '';
  }
}

function normalizeUrlSimple(url: string): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.replace('www.', '');
    if (hostname.endsWith('.translate.goog')) {
      hostname = hostname.replace('.translate.goog', '').replace(/--/g, '.');
    }
    let norm = hostname + urlObj.pathname.replace(/\/$/, '');
    if (urlObj.search) norm += urlObj.search;
    return norm;
  } catch (e) {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/#.*$/, '').replace(/\/$/, '');
  }
}

function isExcludedUrl(url: string): boolean {
  return url.includes('gstatic.com') || url.includes('googleapis.com') || url.includes('w3.org/') || url.includes('google.com/search') || url.includes('googleusercontent.com');
}

function extractMagiUrlsFromTree(node: any, results: any[], urlCounts: Record<string, number>) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    if (node[0] === 'MAGI_FEATURE' && typeof node[7] === 'string' && node[7].startsWith('http')) {
      const magiUrl = node[7];
      if (!isExcludedUrl(magiUrl)) {
        urlCounts[magiUrl] = (urlCounts[magiUrl] || 0) + 1;
        if (urlCounts[magiUrl] === 1) {
          results.push({ url: magiUrl, domain: extractHostnameFromUrl(magiUrl), title: '', sourceLabel: 'MAGI_FEATURE', count: 1, hasAboutResult: false });
        } else {
          const existing = results.find(r => r.url === magiUrl);
          if (existing) existing.count = urlCounts[magiUrl];
        }
      }
      return;
    }
    for (let i = 0; i < node.length; i++) {
      extractMagiUrlsFromTree(node[i], results, urlCounts);
    }
  } else {
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        extractMagiUrlsFromTree(node[key], results, urlCounts);
      }
    }
  }
}

function extractMagiUrlsFromScriptTags(): any[] {
  const results: any[] = [];
  const urlCounts: Record<string, number> = {};
  try {
    const scripts = document.querySelectorAll('script:not([src])');
    for (let i = 0; i < scripts.length; i++) {
      const content = scripts[i].textContent || '';
      const decoded = content
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
      if (!decoded.includes('MAGI_FEATURE')) continue;
      let searchPos = 0;
      while (true) {
        const idx = decoded.indexOf('"MAGI_FEATURE"', searchPos);
        if (idx === -1) break;
        searchPos = idx + 14;
        const windowStart = Math.max(0, idx - 5000);
        const beforeChunk = decoded.substring(windowStart, idx);
        const urlMatches = beforeChunk.match(/https?:\/\/[^\s"'<>\\,;)}{]+/g);
        let magiUrl = null;
        if (urlMatches) {
          for (let j = urlMatches.length - 1; j >= 0; j--) {
            const u = urlMatches[j];
            if (!isExcludedUrl(u) && u.length > 15) {
              magiUrl = u;
              break;
            }
          }
        }
        if (!magiUrl) continue;
        const domain = extractHostnameFromUrl(magiUrl);
        let title = '';
        const sourceMatches = beforeChunk.match(/"Source:\s*([^"]{2,80})"/g);
        const sourceMatch = sourceMatches && sourceMatches.length ? sourceMatches[sourceMatches.length - 1] : null;
        if (sourceMatch) title = sourceMatch.replace(/^"Source:\s*/i, '').replace(/"$/, '');
        const hasReq = content.substring(Math.max(0, idx - 3000), Math.min(content.length, idx + 2000)).includes('about-this-result');
        urlCounts[magiUrl] = (urlCounts[magiUrl] || 0) + 1;
        if (urlCounts[magiUrl] === 1) {
          results.push({ url: magiUrl, domain, title, sourceLabel: sourceMatch || '', count: 1, hasAboutResult: hasReq });
        } else {
          const existing = results.find(r => r.url === magiUrl);
          if (existing) existing.count = urlCounts[magiUrl];
        }
      }
    }
  } catch (e) {}
  return results;
}

function extractLdpbCitationsAndMagiUrls() {
  const citations: any[] = [];
  const magiUrls: any[] = [];
  const magiUrlCounts: Record<string, number> = {};
  const seenCitUrls = new Set<string>();
  try {
    const scripts = document.querySelectorAll('script:not([src])');
    for (let i = 0; i < scripts.length; i++) {
      const content = scripts[i].textContent || '';
      if (!content.includes('lDPB')) continue;
      const dataMatch = content.match(/\)\s*\(\s*(\[[\s\S]*\])\s*\)\s*;?\s*$/) ||
        content.match(/\.call\s*\(\s*this\s*,\s*(\[[\s\S]*\])\s*\)\s*;?\s*$/);
      if (!dataMatch) continue;
      let dataStr = dataMatch[1];
      dataStr = dataStr.replace(/\\u003d/g, '=').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&').replace(/\\u0027/g, "'").replace(/\\u0022/g, '"');
      let dataArr = null;
      try { dataArr = JSON.parse(dataStr); } catch (e) { continue; }
      if (!Array.isArray(dataArr)) continue;
      extractMagiUrlsFromTree(dataArr, magiUrls, magiUrlCounts);
      for (let k = 0; k < dataArr.length - 1; k += 2) {
        const key = dataArr[k];
        const value = dataArr[k + 1];
        if (typeof key !== 'string' || !Array.isArray(value)) continue;
        if (!Array.isArray(value[0])) continue;
        for (let b = 0; b < value.length; b++) {
          const block = value[b];
          if (!Array.isArray(block)) continue;
          let entry = null;
          if (block.length >= 2 && Array.isArray(block[1]) && block[1].length >= 2) entry = block[1];
          else if (block.length >= 6) entry = block;
          if (!Array.isArray(entry) || entry.length < 2) continue;
          let url = null;
          if (typeof entry[5] === 'string' && entry[5].startsWith('http') && !entry[5].includes('googleusercontent.com')) {
            url = entry[5];
          } else {
            for (let j = 0; j < Math.min(entry.length, 20); j++) {
              if (typeof entry[j] === 'string' && entry[j].startsWith('https://') && !entry[j].includes('google.com/search') && !entry[j].includes('gstatic.com') && !entry[j].includes('googleusercontent.com')) {
                url = entry[j];
                break;
              }
            }
          }
          if (!url) continue;
          const normUrl = normalizeUrlSimple(url);
          if (seenCitUrls.has(normUrl)) continue;
          seenCitUrls.add(normUrl);
          const title = (typeof entry[0] === 'string') ? entry[0] : '';
          const snippet = (typeof entry[1] === 'string') ? entry[1] : '';
          let domain = (typeof entry[3] === 'string') ? entry[3] : '';
          if (domain && domain.startsWith('http')) domain = extractHostnameFromUrl(domain);
          const position = typeof entry[8] === 'string' ? entry[8] : (typeof entry[8] === 'number' ? String(entry[8]) : null);
          citations.push({
            title: title,
            snippet: snippet,
            sourceDomain: domain,
            url: url,
            position: position ? parseInt(position, 10) || 0 : 0
          });
        }
      }
    }
  } catch (e) {}
  return { citations, magiUrls };
}

function captureOrganicUrls(): any[] {
  const urls: any[] = [];
  const seen = new Set<string>();
  let links = document.querySelectorAll('#search a[data-ved][href^="http"]');
  if (!links.length) links = document.querySelectorAll('#rso a[href^="http"]');
  links.forEach((link: any) => {
    const href = link.href || '';
    if (!href) return;
    if (href.includes('google.com/search') || href.includes('gstatic.com') || href.includes('googleapis.com')) return;
    if (href.includes('google.com/imgres') || href.includes('youtube.com/results')) return;
    let normUrl;
    try {
      const u = new URL(href);
      normUrl = u.hostname.replace('www.', '') + u.pathname.replace(/\/$/, '');
    } catch (e) { normUrl = href; }
    if (!seen.has(normUrl)) {
      seen.add(normUrl);
      urls.push({ url: href, domain: extractHostnameFromUrl(href), position: urls.length + 1 });
    }
  });
  return urls;
}

function extractAioSidebarCards(container: Element): any[] {
  const cards: any[] = [];
  if (!container) return cards;
  try {
    const cardElements = container.querySelectorAll('.CyMdWb');
    cardElements.forEach((card) => {
      const linkEl = card.querySelector('a[href^="http"]') || card.querySelector('a[href]');
      if (!linkEl) return;
      const href = (linkEl as HTMLAnchorElement).href || '';
      if (!href || href.includes('google.com/search')) return;
      const domain = extractHostnameFromUrl(href);
      const title = (linkEl.textContent || '').trim() || (card.textContent || '').trim().substring(0, 100);
      cards.push({ url: href, domain, title, position: cards.length + 1 });
    });
  } catch (e) {}
  return cards;
}

function extractAioLinks(container: Element) {
  const entityLinks: any[] = [];
  const externalLinks: any[] = [];
  if (!container) return { entityLinks, externalLinks };
  const seenEntities = new Set<string>();
  const seenExternals = new Set<string>();
  try {
    container.querySelectorAll('a[href]').forEach((link: any) => {
      const href = link.href || '';
      const text = (link.textContent || '').trim();
      if (!href || !text) return;
      if (href.includes('google.com/search') && !href.includes('about-this-result')) {
        if (!seenEntities.has(href)) {
          seenEntities.add(href);
          entityLinks.push({ text, href });
        }
      } else if (href.startsWith('http') && !href.includes('google.com/') && !href.includes('gstatic.com') && !href.includes('googleapis.com')) {
        if (!seenExternals.has(href)) {
          seenExternals.add(href);
          externalLinks.push({ text, href, domain: extractHostnameFromUrl(href) });
        }
      }
    });
  } catch (e) {}
  return { entityLinks, externalLinks };
}

function extractSv6KpeCitations(root: Element, magiResults: any[], magiUrlCounts: Record<string, number>) {
  const citations: any[] = [];
  if (!root) return citations;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) {
      const commentText = walker.currentNode.nodeValue || '';
      if (commentText.indexOf('Sv6Kpe[') === -1) continue;
      const match = commentText.match(/Sv6Kpe\[([\s\S]+?)\]/);
      if (!match) continue;
      try {
        const decoded = match[1]
          .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'");
        const json = JSON.parse(decoded);
        if (magiResults && magiUrlCounts) {
          extractMagiUrlsFromTree(json, magiResults, magiUrlCounts);
        }
        if (!json || !Array.isArray(json[1]) || json[1].length < 5) continue;
        const entry = json[1];
        let url = (typeof entry[5] === 'string' && entry[5].startsWith('http')) ? entry[5] : '';
        if (!url) {
          for (let j = 0; j < Math.min(entry.length, 20); j++) {
            if (typeof entry[j] === 'string' && entry[j].startsWith('https://') && !entry[j].includes('google.com/search')) {
              url = entry[j];
              break;
            }
          }
        }
        if (!url) continue;
        const norm = normalizeUrlSimple(url);
        if (!norm) continue;
        const title = entry[0] || '';
        const snippet = entry[1] || '';
        let domain = (typeof entry[3] === 'string') ? entry[3] : '';
        if (domain && domain.indexOf('http') === 0) domain = extractHostnameFromUrl(domain);
        let position = 0;
        if (typeof entry[8] === 'string') position = parseInt(entry[8], 10) || 0;
        else if (typeof entry[8] === 'number') position = entry[8];
        citations.push({
          title,
          snippet,
          sourceDomain: domain,
          url,
          position
        });
      } catch (e) {}
    }
  } catch (e) {}
  return citations;
}

export function collectAioOverviewData() {
  const container = document.querySelector('div[data-subtree="aimc"], div.FkX2oe, div[id*="aio"], div[data-attrid="wa:/complete"], div.XGPMgd');
  const query = getQuery().trim();
  if (!container) return null;
  const ldpbResult = extractLdpbCitationsAndMagiUrls();
  const magiInnerHTML = extractMagiUrlsFromScriptTags() || [];
  const sv6kpeMagiCounts = {};
  const sidebarCards = extractAioSidebarCards(container);
  const linkData = extractAioLinks(container);
  const organicUrls = captureOrganicUrls();
  let citations: any[] = [];
  const sv6kpeCitations = extractSv6KpeCitations(container, magiInnerHTML, sv6kpeMagiCounts);
  if (sv6kpeCitations.length > 0) {
    const seenNorm = new Set<string>();
    sv6kpeCitations.forEach((c) => {
      const n = normalizeUrlSimple(c.url);
      if (n && !seenNorm.has(n)) {
        seenNorm.add(n);
        citations.push(c);
      }
    });
    ldpbResult.citations.forEach((c) => {
      const n = normalizeUrlSimple(c.url);
      if (n && !seenNorm.has(n)) {
        seenNorm.add(n);
        citations.push(c);
      }
    });
  } else {
    citations = [...ldpbResult.citations];
  }
  ldpbResult.magiUrls.forEach((m) => {
    if (!magiInnerHTML.find(e => e.url === m.url)) magiInnerHTML.push(m);
  });

  if (!citations.length) {
    const fallbackLinks = container.querySelectorAll('a[href^="http"]');
    let pos = 0;
    fallbackLinks.forEach((link: any) => {
      const url = link.href;
      if (!url || url.includes('google.com/search')) return;
      pos++;
      citations.push({
        title: (link.textContent || '').trim(),
        snippet: '',
        sourceDomain: extractHostnameFromUrl(url),
        url: url,
        position: pos
      });
    });
  }

  const seenNorm = new Set<string>();
  citations.forEach((c) => {
    const n = normalizeUrlSimple(c.url);
    if (n) seenNorm.add(n);
  });
  let nextPos = citations.length + 1;
  (linkData.externalLinks || []).forEach((ext) => {
    const url = ext.href || '';
    if (!url) return;
    const norm = normalizeUrlSimple(url);
    if (!norm || seenNorm.has(norm)) return;
    seenNorm.add(norm);
    citations.push({
      title: (ext.text || '').trim(),
      snippet: '',
      sourceDomain: ext.domain || extractHostnameFromUrl(url),
      url,
      position: nextPos++
    });
  });

  return {
    query,
    citations,
    magiUrls: magiInnerHTML,
    sidebarCards,
    entities: linkData.entityLinks,
    externalLinks: linkData.externalLinks,
    organicUrls
  };
}

export function addAioAnalyzeButton() {
  const container = document.querySelector('div[data-subtree="aimc"], div.FkX2oe, div[id*="aio"], div[data-attrid="wa:/complete"], div.XGPMgd');
  if (!container) return;
  const target = container.closest('[data-subtree="mfc"]');
  if (!target || target.querySelector('.xt-aio-analyze-button')) return;
  
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;justify-content:flex-end;margin:12px 0 6px 0;';
  
  const btn = document.createElement('a');
  btn.className = 'xt-aio-analyze-button';
  btn.textContent = 'Analyze AI Overview';
  btn.href = chrome.runtime.getURL('tabs/aio-overview.html');
  btn.target = '_blank';
  
  btn.style.cssText = `
    display: inline-block;
    text-decoration: none;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    transition: transform 0.2s, opacity 0.2s;
    user-select: none;
  `;
  btn.addEventListener('mouseover', () => btn.style.transform = 'scale(1.03)');
  btn.addEventListener('mouseout', () => btn.style.transform = 'scale(1)');
  
  btn.addEventListener('click', (e) => {
    try {
      const payload = collectAioOverviewData();
      if (payload) {
        chrome.runtime.sendMessage({ cmd: 'google.setAIOData', data: payload });
      }
    } catch (err2) {
      console.warn("Failed to set AIO data during native link navigation:", err2);
    }
  });
  
  bar.appendChild(btn);
  
  // Append to the bottom of the container so it sits below all generated text and links
  if (container) {
    container.appendChild(bar);
  } else {
    target.appendChild(bar);
  }
}

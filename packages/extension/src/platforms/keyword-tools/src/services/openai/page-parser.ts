import { clearText, cleanHTML } from "./page-parser-utils";

export interface PageParsedData {
  title: string;
  cleanTitle: string;
  description: string;
  cleanDescription: string;
  allHeaders: string;
  headers: string[][];
  cleanHeaders: string[][];
  fullText: string;
  cleanFullText: string;
  cleanTitleText: string;
  wordsTotal: number;
  results?: { url: string; title: string; description: string }[];
  relatedKeywords?: string[];
  pasfKeywords?: string[];
  tags?: string;
}

export function googlePreprocessing(html: string): string {
  const matches = html.match(/window\.jsl\.dh\('eob_\d','([^']+)/g);
  if (matches && matches[0]) {
    let text = matches[0].replace(/window\.jsl\.dh\('eob_\d','/, '');
    text = text.replace(/\\x3d/g, '=');
    text = text.replace(/\\x3c/g, '<');
    text = text.replace(/\\x3e/g, '>');
    text = text.replace(/\\x22/g, '"');
    return text;
  }
  return '';
}

export function processGoogleSERP(dom: Document) {
  const serpData: { url: string; title: string; description: string }[] = [];
  const gItems = dom.querySelectorAll('#ires div.g, #res div.g');
  
  gItems.forEach(node => {
    if (node.closest('.related-question-pair')) return;
    if (node.querySelector('#kp-wp-tab-cont-overview')) return;
    if (node.querySelector('g-section-with-header')) return;
    if (node.closest('.g-blk')) return;

    const linkEl = node.querySelector('a[href]');
    const h3El = node.querySelector('h3');
    if (linkEl && h3El) {
      const url = linkEl.getAttribute('href') || '';
      const title = h3El.textContent?.trim() || '';
      // Simple description logic
      const descEl = node.querySelector('span, em')?.parentElement;
      const description = descEl?.textContent?.trim() || '';
      serpData.push({ url, title, description });
    }
  });
  return serpData;
}

export function getGoogleRelatedSearch(dom: Document): string[] {
  const keywords: string[] = [];
  const selectors = ['#botstuff a', '#brs a', '.card-section a'];
  selectors.forEach(sel => {
    dom.querySelectorAll(sel).forEach(node => {
      const txt = node.textContent?.trim();
      if (txt) keywords.push(txt.toLowerCase());
    });
  });
  return Array.from(new Set(keywords));
}

export function getPeopleAlsoSearch(extraHTML: string): string[] {
  const keywords: string[] = [];
  const parser = new DOMParser();
  const domExtra = parser.parseFromString(extraHTML, "text/html");
  domExtra.querySelectorAll("div[jsname=d3PE6e] div[data-ved]").forEach(node => {
    const txt = node.textContent?.trim();
    if (txt) keywords.push(txt);
  });
  return keywords;
}

export function processYoutubePage(html: string) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  let title = dom.querySelector('title')?.textContent || '';
  title = title.replace(/ - YouTube$/, '');
  let description = dom.querySelector('meta[name=description]')?.getAttribute('content') || '';
  
  return {
    title,
    description,
    tags: [] as string[]
  };
}

export async function processPageHTML(type: string, origHTML: string): Promise<PageParsedData> {
  let extraHTML = '';
  if (type === 'serp') {
    extraHTML = googlePreprocessing(origHTML);
  }
  const html = cleanHTML(origHTML, { form: true });
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  
  const title = dom.querySelector('title')?.textContent || '';
  const description = dom.querySelector('meta[name=description]')?.getAttribute('content') || '';

  const headers: string[][] = [];
  const cleanHeaders: string[][] = [];
  for (let i = 0; i < 6; i++) {
    headers[i] = [];
    cleanHeaders[i] = [];
    dom.querySelectorAll('h' + (i + 1)).forEach(node => {
      const text = node.textContent || '';
      headers[i].push(text.replace(/\s+/g, ' '));
      cleanHeaders[i].push(clearText(text));
    });
  }

  const allHeaders = headers.map(arr => arr.join('\n')).join('\n');
  
  let text = dom.body?.innerHTML || '';
  text = text.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/ig, '');
  text = text.replace(/<nav\W[\s\S]*?<\/nav>/, '');
  text = text.replace(/<header[\s\S]*?<\/header>/, '');
  text = text.replace(/<footer[\s\S]*?<\/footer>/, '');
  text = text.replace(/<[^>]*>/g, " ");

  const textContainer = dom.createElement('div');
  textContainer.innerHTML = text;
  const fullText = textContainer.textContent || '';
  const cleanTitleText = clearText([title, fullText].join(' '));

  const pageData: PageParsedData = {
    title,
    cleanTitle: clearText(title),
    description,
    cleanDescription: clearText(description),
    allHeaders,
    headers,
    cleanHeaders,
    fullText,
    cleanFullText: clearText(fullText),
    cleanTitleText,
    wordsTotal: cleanTitleText.split(/\s+/).filter(Boolean).length
  };

  if (type === 'serp') {
    pageData.results = processGoogleSERP(dom);
    pageData.relatedKeywords = getGoogleRelatedSearch(dom);
    pageData.pasfKeywords = getPeopleAlsoSearch(extraHTML);
  } else if (type === 'youtube_video_url') {
    const ytData = processYoutubePage(origHTML);
    pageData.title = ytData.title;
    pageData.description = ytData.description;
    pageData.tags = ytData.tags.join(', ');
  }

  return pageData;
}

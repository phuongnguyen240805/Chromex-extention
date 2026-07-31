export function clearText(text: string): string {
  if (!text) return '';
  const punctRE = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\/:;<=>?@\[\]^_`{|}~]/g;
  return text
    .replace(punctRE, '')
    .replace(/\.(\s|$)/g, ' ')
    .replace(/ - /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanHTML(html: string, filter?: { form?: boolean }): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style[\s\S]*?\/style>/ig, '')
    .replace(/<noscript[\s\S]*?\/noscript>/ig, '')
    .replace(/onload=".*?"/ig, '')
    .replace(/<img[^>]*>/ig, '');
  if (!filter?.form) {
    cleaned = cleaned.replace(/<form [\s\S]+?<\/form>/ig, '');
  }
  return cleaned;
}

export const DEFAULT_LADIPAGE_WEB_ORIGIN = "http://localhost:3000";

/**
 * Route thật của Facebook Ads trong Ladipage FE.
 * Không dùng extension-preview làm nguồn chính nữa để extension luôn nhận đúng
 * shell AdsMeta, AD/BM/PAGE/CAMP và logic mới nhất của web app.
 */
export const FACEBOOK_ADS_APP_ROUTE = "/facebook-ads/manager";

/** Route cũ vẫn được cho phép để rollback trong lúc migration. */
export const LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE =
  "/extension-preview/facebook-ads";

export const FACEBOOK_ADS_FRAME_PATH = "tabs/facebook-ads-frame.html";
export const FACEBOOK_ADS_CATALOG_ID = "10";
export const FACEBOOK_ADS_SIDEPANEL_ID = "facebook-ads";

export const FACEBOOK_ADS_EMBED_ALLOWED_PATHS = new Set([
  FACEBOOK_ADS_APP_ROUTE,
  LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE,
]);

export function normalizeLadipageWebOrigin(value?: string): string {
  const candidate = value?.trim() || DEFAULT_LADIPAGE_WEB_ORIGIN;

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fallback bên dưới.
  }

  return DEFAULT_LADIPAGE_WEB_ORIGIN;
}

export function createFacebookAdsEmbedUrl(options: {
  webOrigin?: string;
  appId?: string;
  route?: string;
} = {}): string {
  const origin = normalizeLadipageWebOrigin(options.webOrigin);
  const route = options.route || FACEBOOK_ADS_APP_ROUTE;
  const url = new URL(route, origin);

  url.searchParams.set("embedded", "1");
  // Giữ source cũ để Ladipage FE hiện tại không mất compatibility.
  url.searchParams.set("source", "extensionpromax");
  url.searchParams.set("client", "chromex");
  url.searchParams.set("shell", "adsmeta");
  url.searchParams.set("theme", "dark");

  if (options.appId) {
    url.searchParams.set("appId", options.appId);
  }

  return url.toString();
}

export function isAllowedFacebookAdsEmbedUrl(
  value: string,
  configuredWebOrigin?: string,
): boolean {
  try {
    const url = new URL(value);
    const configuredOrigin = normalizeLadipageWebOrigin(configuredWebOrigin);
    const isConfiguredOrigin = url.origin === configuredOrigin;
    const isLocalOrigin =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

    return (
      FACEBOOK_ADS_EMBED_ALLOWED_PATHS.has(url.pathname) &&
      (isConfiguredOrigin || isLocalOrigin)
    );
  } catch {
    return false;
  }
}

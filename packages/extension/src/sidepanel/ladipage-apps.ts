export const DEFAULT_LADIPAGE_WEB_ORIGIN = "http://localhost:3000";

export type LadipageAppId = "facebook-ads";

export type LadipageEmbeddedApp = {
  id: LadipageAppId;
  name: string;
  description: string;
  previewPath: string;
  badge: string;
};

export const LADIPAGE_EMBEDDED_APPS: readonly LadipageEmbeddedApp[] = [
  {
    id: "facebook-ads",
    name: "Facebook Ads",
    description: "Quản lý chiến dịch Meta Ads ngay trong extension.",
    previewPath: "/extension-preview/facebook-ads",
    badge: "Preview",
  },
];

export function getLadipageEmbeddedApp(
  appId: LadipageAppId,
): LadipageEmbeddedApp {
  const app = LADIPAGE_EMBEDDED_APPS.find((candidate) => candidate.id === appId);
  if (!app) {
    throw new Error(`Unknown Ladipage app: ${appId}`);
  }
  return app;
}

export function createLadipageEmbeddedAppUrl(
  appId: LadipageAppId,
  webOrigin = DEFAULT_LADIPAGE_WEB_ORIGIN,
): string {
  const app = getLadipageEmbeddedApp(appId);
  const url = new URL(app.previewPath, normalizeWebOrigin(webOrigin));
  url.searchParams.set("embedded", "1");
  url.searchParams.set("source", "extensionpromax");
  return url.toString();
}

function normalizeWebOrigin(value: string): string {
  try {
    const url = new URL(value.trim());
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    // Fall back to the local Ladipage preview below.
  }
  return DEFAULT_LADIPAGE_WEB_ORIGIN;
}

import {
  createFacebookAdsEmbedUrl,
  DEFAULT_LADIPAGE_WEB_ORIGIN as DEFAULT_WEB_ORIGIN,
  FACEBOOK_ADS_APP_ROUTE,
  FACEBOOK_ADS_SIDEPANEL_ID,
} from "../mini-apps/facebook-ads/config";

export const DEFAULT_LADIPAGE_WEB_ORIGIN = DEFAULT_WEB_ORIGIN;

export type LadipageAppId = typeof FACEBOOK_ADS_SIDEPANEL_ID;

export type LadipageEmbeddedApp = {
  id: LadipageAppId;
  name: string;
  description: string;
  previewPath: string;
  badge: string;
  status: string;
  modules: readonly string[];
};

export const LADIPAGE_EMBEDDED_APPS: readonly LadipageEmbeddedApp[] = [
  {
    id: FACEBOOK_ADS_SIDEPANEL_ID,
    name: "Facebook Ads",
    description:
      "Quản lý AD, BM, PAGE, CAMP, quy tắc, báo cáo và phân quyền Meta Ads.",
    previewPath: FACEBOOK_ADS_APP_ROUTE,
    badge: "ĐÃ ĐỒNG BỘ",
    status: "AdsMeta UI",
    modules: ["AD", "BM", "PAGE", "CAMP"],
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
  getLadipageEmbeddedApp(appId);
  return createFacebookAdsEmbedUrl({ webOrigin });
}

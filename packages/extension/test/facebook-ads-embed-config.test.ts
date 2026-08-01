import { describe, expect, it } from "vitest";

import {
  createFacebookAdsEmbedUrl,
  FACEBOOK_ADS_APP_ROUTE,
  LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE,
  isAllowedFacebookAdsEmbedUrl,
  normalizeLadipageWebOrigin,
} from "../src/mini-apps/facebook-ads/config";


describe("Facebook Ads embed config", () => {
  it("targets the real manager route and adds extension context", () => {
    const url = new URL(
      createFacebookAdsEmbedUrl({
        webOrigin: "https://app.example.com/base/path",
        appId: "10",
      }),
    );

    expect(url.origin).toBe("https://app.example.com");
    expect(url.pathname).toBe(FACEBOOK_ADS_APP_ROUTE);
    expect(url.searchParams.get("embedded")).toBe("1");
    expect(url.searchParams.get("source")).toBe("extensionpromax");
    expect(url.searchParams.get("client")).toBe("chromex");
    expect(url.searchParams.get("shell")).toBe("adsmeta");
    expect(url.searchParams.get("theme")).toBe("dark");
    expect(url.searchParams.get("appId")).toBe("10");
  });

  it("only accepts local or configured origins on approved routes", () => {
    expect(
      isAllowedFacebookAdsEmbedUrl(
        "https://app.example.com/facebook-ads/manager?embedded=1",
        "https://app.example.com",
      ),
    ).toBe(true);
    expect(
      isAllowedFacebookAdsEmbedUrl(
        `https://app.example.com${LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE}?embedded=1&appId=10`,
        "https://app.example.com",
      ),
    ).toBe(true);
    expect(
      isAllowedFacebookAdsEmbedUrl(
        "https://evil.example/facebook-ads/manager?embedded=1",
        "https://app.example.com",
      ),
    ).toBe(false);
    expect(
      isAllowedFacebookAdsEmbedUrl(
        "https://app.example.com/settings",
        "https://app.example.com",
      ),
    ).toBe(false);
  });

  it("normalizes invalid origins to localhost", () => {
    expect(normalizeLadipageWebOrigin("javascript:alert(1)")).toBe(
      "http://localhost:3000",
    );
  });
});

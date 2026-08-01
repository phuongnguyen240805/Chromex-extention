import { describe, expect, it } from "vitest";

import {
  createLadipageEmbeddedAppUrl,
  getLadipageEmbeddedApp,
} from "../src/sidepanel/ladipage-apps";


describe("Ladipage embedded apps", () => {
  it("builds the real Facebook Ads manager URL", () => {
    expect(createLadipageEmbeddedAppUrl("facebook-ads")).toBe(
      "http://localhost:3000/facebook-ads/manager?embedded=1&source=extensionpromax&client=chromex&shell=adsmeta&theme=dark",
    );
  });

  it("keeps AdsMeta metadata in one registry", () => {
    expect(getLadipageEmbeddedApp("facebook-ads")).toMatchObject({
      name: "Facebook Ads",
      badge: "ĐÃ ĐỒNG BỘ",
      status: "AdsMeta UI",
      modules: ["AD", "BM", "PAGE", "CAMP"],
    });
  });

  it("falls back when a configured origin is invalid", () => {
    expect(
      createLadipageEmbeddedAppUrl("facebook-ads", "javascript:alert(1)"),
    ).toMatch(/^http:\/\/localhost:3000\/facebook-ads\/manager/);
  });
});

import { describe, expect, it } from "vitest";

import {
  createLadipageEmbeddedAppUrl,
  getLadipageEmbeddedApp,
} from "../src/sidepanel/ladipage-apps";

describe("Ladipage embedded apps", () => {
  it("builds the Facebook Ads extension preview URL", () => {
    expect(createLadipageEmbeddedAppUrl("facebook-ads")).toBe(
      "http://localhost:3000/extension-preview/facebook-ads?embedded=1&source=extensionpromax",
    );
  });

  it("keeps the app metadata in one registry", () => {
    expect(getLadipageEmbeddedApp("facebook-ads")).toMatchObject({
      name: "Facebook Ads",
      badge: "Preview",
    });
  });

  it("falls back when a configured origin is invalid", () => {
    expect(createLadipageEmbeddedAppUrl("facebook-ads", "javascript:alert(1)")).toMatch(
      /^http:\/\/localhost:3000\//,
    );
  });
});

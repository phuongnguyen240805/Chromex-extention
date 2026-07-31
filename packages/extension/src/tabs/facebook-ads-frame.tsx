import React, { useEffect, useMemo, useState } from "react";
import { LADIPAGE_EMBED_ALLOWED_PATHS } from "../mini-apps/ladipage/app-catalog";

const DEFAULT_FACEBOOK_ADS_PREVIEW_URL =
  "http://localhost:3000/extension-preview/facebook-ads?embedded=1&source=extensionpromax";

function resolveFacebookAdsPreviewUrl(search: string): string {
  const requestedTarget = new URLSearchParams(search).get("target");
  if (!requestedTarget) {
    return DEFAULT_FACEBOOK_ADS_PREVIEW_URL;
  }

  try {
    const url = new URL(requestedTarget);
    const isLocalPreview =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const configuredOrigin = new URL(
      process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL ||
        DEFAULT_FACEBOOK_ADS_PREVIEW_URL,
    ).origin;
    const isSecureDeployment =
      url.protocol === "https:" && url.origin === configuredOrigin;
    const isAllowedPath = LADIPAGE_EMBED_ALLOWED_PATHS.includes(url.pathname);
    if (
      isAllowedPath &&
      (isLocalPreview || isSecureDeployment)
    ) {
      return url.toString();
    }
  } catch {
    // Use the local preview fallback below.
  }

  return DEFAULT_FACEBOOK_ADS_PREVIEW_URL;
}

export default function FacebookAdsFrameTab() {
  const previewUrl = useMemo(
    () => resolveFacebookAdsPreviewUrl(window.location.search),
    [],
  );
  const [loaded, setLoaded] = useState(false);
  const appId = useMemo(() => {
    try {
      return new URL(previewUrl).searchParams.get("appId");
    } catch {
      return null;
    }
  }, [previewUrl]);

  useEffect(() => {
    document.documentElement.style.cssText =
      "width:100%;height:100%;margin:0;background:#f8fafc;color-scheme:light";
    document.body.style.cssText =
      "width:100%;height:100%;margin:0;overflow:hidden;background:#f8fafc";
  }, []);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#f8fafc",
      }}
    >
      {!loaded && (
        <div
          role="status"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            background: "#f8fafc",
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 13,
          }}
        >
          Đang kết nối Ladipage Facebook Ads…
        </div>
      )}
      <iframe
        src={previewUrl}
        title="Ladipage Facebook Ads preview"
        allow="clipboard-read; clipboard-write; local-network-access; local-network; loopback-network"
        onLoad={() => {
          setLoaded(true);
          window.parent.postMessage(
            {
              source: "extensionpromax",
              type: "ladipage-app-ready",
              appId,
            },
            "*",
          );
          window.parent.postMessage(
            {
              source: "extensionpromax",
              type: "ladipage-facebook-ads-ready",
            },
            "*",
          );
        }}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: "#f8fafc",
        }}
      />
    </main>
  );
}

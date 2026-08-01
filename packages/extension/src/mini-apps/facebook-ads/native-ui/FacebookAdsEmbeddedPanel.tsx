import React, { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, LoaderCircle } from "lucide-react";
import {
  createFacebookAdsEmbedUrl,
  FACEBOOK_ADS_CATALOG_ID,
  FACEBOOK_ADS_FRAME_PATH,
  LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE,
} from "../config";

export const FACEBOOK_ADS_PANEL_SIZE = {
  width: 1280,
  height: 700,
} as const;

function resolvePreviewUrl(): string {
  return createFacebookAdsEmbedUrl({
    webOrigin: process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL,
    route: LEGACY_FACEBOOK_ADS_PREVIEW_ROUTE,
    appId: FACEBOOK_ADS_CATALOG_ID,
  });
}

export const FacebookAdsEmbeddedPanel = () => {
  const previewUrl = useMemo(resolvePreviewUrl, []);
  const frameUrl = useMemo(
    () => {
      const url = new URL(chrome.runtime.getURL(FACEBOOK_ADS_FRAME_PATH));
      url.searchParams.set("target", previewUrl);
      url.searchParams.set("app", "Facebook Ads");
      return url.toString();
    },
    [previewUrl],
  );
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      if (
        event.source === frameRef.current?.contentWindow &&
        event.data?.source === "extensionpromax" &&
        (event.data?.type === "ladipage-facebook-ads-ready" ||
          (event.data?.type === "ladipage-app-ready" &&
            event.data?.appId === FACEBOOK_ADS_CATALOG_ID))
      ) {
        setIsLoading(false);
      }
    };
    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, []);

  return (
    <div
      className="relative flex w-full flex-col overflow-hidden bg-[rgb(var(--bg-main))]"
      style={{ height: "100%", minHeight: 0 }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[rgba(var(--border-main),var(--border-opacity))] bg-[rgb(var(--bg-card))] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <span className="truncate text-xs font-medium text-[rgb(var(--text-muted))]">
            Mock preview từ Ladipage FE
          </span>
        </div>
        <button
          type="button"
          onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
          className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-blue-500 transition-colors hover:bg-blue-500/10"
        >
          <ExternalLink size={13} />
          Mở riêng
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--bg-main))]">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
              <LoaderCircle size={18} className="animate-spin" />
              Đang tải Facebook Ads…
            </div>
          </div>
        )}

        <iframe
          ref={frameRef}
          src={frameUrl}
          title="Ladipage Facebook Ads mock preview"
          className="h-full w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          allow="clipboard-read; clipboard-write; local-network-access; local-network; loopback-network"
        />
      </div>
    </div>
  );
};

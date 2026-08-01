// import React, { useEffect, useMemo, useState } from "react";
// import { LADIPAGE_EMBED_ALLOWED_PATHS } from "../mini-apps/ladipage/app-catalog";

// const DEFAULT_FACEBOOK_ADS_PREVIEW_URL =
//   "http://localhost:3000/extension-preview/facebook-ads?embedded=1&source=extensionpromax";

// function resolveFacebookAdsPreviewUrl(search: string): string {
//   const requestedTarget = new URLSearchParams(search).get("target");
//   if (!requestedTarget) {
//     return DEFAULT_FACEBOOK_ADS_PREVIEW_URL;
//   }

//   try {
//     const url = new URL(requestedTarget);
//     const isLocalPreview =
//       url.protocol === "http:" &&
//       ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
//     const configuredOrigin = new URL(
//       process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL ||
//         DEFAULT_FACEBOOK_ADS_PREVIEW_URL,
//     ).origin;
//     const isSecureDeployment =
//       url.protocol === "https:" && url.origin === configuredOrigin;
//     const isAllowedPath = LADIPAGE_EMBED_ALLOWED_PATHS.includes(url.pathname);
//     if (
//       isAllowedPath &&
//       (isLocalPreview || isSecureDeployment)
//     ) {
//       return url.toString();
//     }
//   } catch {
//     // Use the local preview fallback below.
//   }

//   return DEFAULT_FACEBOOK_ADS_PREVIEW_URL;
// }

// export default function FacebookAdsFrameTab() {
//   const previewUrl = useMemo(
//     () => resolveFacebookAdsPreviewUrl(window.location.search),
//     [],
//   );
//   const [loaded, setLoaded] = useState(false);
//   const appId = useMemo(() => {
//     try {
//       return new URL(previewUrl).searchParams.get("appId");
//     } catch {
//       return null;
//     }
//   }, [previewUrl]);

//   useEffect(() => {
//     document.documentElement.style.cssText =
//       "width:100%;height:100%;margin:0;background:#f8fafc;color-scheme:light";
//     document.body.style.cssText =
//       "width:100%;height:100%;margin:0;overflow:hidden;background:#f8fafc";
//   }, []);

//   return (
//     <main
//       style={{
//         position: "relative",
//         width: "100vw",
//         height: "100vh",
//         overflow: "hidden",
//         background: "#f8fafc",
//       }}
//     >
//       {!loaded && (
//         <div
//           role="status"
//           style={{
//             position: "absolute",
//             inset: 0,
//             zIndex: 1,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             color: "#64748b",
//             background: "#f8fafc",
//             fontFamily:
//               'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
//             fontSize: 13,
//           }}
//         >
//           Đang kết nối Ladipage Facebook Ads…
//         </div>
//       )}
//       <iframe
//         src={previewUrl}
//         title="Ladipage Facebook Ads preview"
//         allow="clipboard-read; clipboard-write; local-network-access; local-network; loopback-network"
//         onLoad={() => {
//           setLoaded(true);
//           window.parent.postMessage(
//             {
//               source: "extensionpromax",
//               type: "ladipage-app-ready",
//               appId,
//             },
//             "*",
//           );
//           window.parent.postMessage(
//             {
//               source: "extensionpromax",
//               type: "ladipage-facebook-ads-ready",
//             },
//             "*",
//           );
//         }}
//         style={{
//           display: "block",
//           width: "100%",
//           height: "100%",
//           border: 0,
//           background: "#f8fafc",
//         }}
//       />
//     </main>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { LADIPAGE_EMBED_ALLOWED_PATHS } from "../mini-apps/ladipage/app-catalog";
import {
  createFacebookAdsEmbedUrl,
  isAllowedFacebookAdsEmbedUrl,
  normalizeLadipageWebOrigin,
} from "../mini-apps/facebook-ads/config";

const FRAME_LOAD_TIMEOUT_MS = 20_000;
const DEFAULT_FACEBOOK_ADS_URL = createFacebookAdsEmbedUrl({
  webOrigin: process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL || "http://localhost:3000",
});

export function resolveFacebookAdsPreviewUrl(search: string): string {
  const requestedTarget = new URLSearchParams(search).get("target");
  if (!requestedTarget) {
    return DEFAULT_FACEBOOK_ADS_URL;
  }

  try {
    const url = new URL(requestedTarget);
    const configuredOrigin = normalizeLadipageWebOrigin(
      process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL || "http://localhost:3000",
    );
    const isConfiguredOrigin = url.origin === configuredOrigin;
    const isLocalPreview =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const isAllowedPath = LADIPAGE_EMBED_ALLOWED_PATHS.includes(url.pathname);

    if (isAllowedPath && (isLocalPreview || isConfiguredOrigin)) {
      return url.toString();
    }
  } catch {
    // Dùng Facebook Ads URL mặc định bên dưới.
  }

  return DEFAULT_FACEBOOK_ADS_URL;
}

function LoadingScreen({
  appName,
  isFacebookAds,
  timedOut,
  onRetry,
}: {
  appName: string;
  isFacebookAds: boolean;
  timedOut: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        display: "grid",
        placeItems: "center",
        color: isFacebookAds ? "#e2e8f0" : "#0f172a",
        background: isFacebookAds
          ? "linear-gradient(135deg, #020617 0%, #0f172a 56%, #172554 100%)"
          : "#f8fafc",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: "min(360px, calc(100vw - 32px))",
          padding: 20,
          border: isFacebookAds
            ? "1px solid rgba(255,255,255,.1)"
            : "1px solid rgba(15,23,42,.1)",
          borderRadius: 18,
          background: isFacebookAds ? "rgba(15,23,42,.92)" : "#ffffff",
          boxShadow: "0 24px 80px rgba(0,0,0,.42)",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            margin: "0 auto 12px",
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            color: "white",
            background: isFacebookAds
              ? "linear-gradient(135deg, rgb(44,73,241), rgb(24,119,242))"
              : "linear-gradient(135deg, #4f46e5, #7c3aed)",
            fontWeight: 800,
            fontSize: 17,
          }}
        >
          {isFacebookAds ? "AD" : appName.slice(0, 2).toUpperCase()}
        </div>
        <strong style={{ display: "block", fontSize: 14 }}>
          {timedOut
            ? "Không kết nối được Ladipage FE"
            : `Đang kết nối ${appName}…`}
        </strong>
        <span
          style={{
            display: "block",
            marginTop: 6,
            color: isFacebookAds ? "#94a3b8" : "#64748b",
            fontSize: 12,
            lineHeight: 1.55,
          }}
        >
          {timedOut
            ? "Kiểm tra web app và PLASMO_PUBLIC_LADIPAGE_WEB_URL."
            : isFacebookAds
              ? "Đang tải giao diện AD · BM · PAGE · CAMP"
              : "Đang tải ứng dụng Ladipage"}
        </span>
        {timedOut && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: 14,
              padding: "8px 12px",
              border: 0,
              borderRadius: 9,
              color: "white",
              background: "#2563eb",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}

export default function FacebookAdsFrameTab() {
  const previewUrl = useMemo(
    () => resolveFacebookAdsPreviewUrl(window.location.search),
    [],
  );
  const appName = useMemo(
    () => new URLSearchParams(window.location.search).get("app") || "Facebook Ads",
    [],
  );
  const isFacebookAds = useMemo(() => {
    return isAllowedFacebookAdsEmbedUrl(
      previewUrl,
      process.env.PLASMO_PUBLIC_LADIPAGE_WEB_URL || "http://localhost:3000",
    );
  }, [previewUrl]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const appId = useMemo(() => {
    try {
      return new URL(previewUrl).searchParams.get("appId");
    } catch {
      return null;
    }
  }, [previewUrl]);

  useEffect(() => {
    const background = isFacebookAds ? "#020617" : "#f8fafc";
    const colorScheme = isFacebookAds ? "dark" : "light";
    document.documentElement.style.cssText =
      `width:100%;height:100%;margin:0;background:${background};color-scheme:${colorScheme}`;
    document.body.style.cssText =
      `width:100%;height:100%;margin:0;overflow:hidden;background:${background}`;
  }, [isFacebookAds]);

  useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timeoutId = window.setTimeout(
      () => setTimedOut(true),
      FRAME_LOAD_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [reloadKey]);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: isFacebookAds ? "#020617" : "#f8fafc",
      }}
    >
      {!loaded && (
        <LoadingScreen
          appName={appName}
          isFacebookAds={isFacebookAds}
          timedOut={timedOut}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      )}
      <iframe
        key={reloadKey}
        src={previewUrl}
        title={`${appName} · Ladipage`}
        allow="clipboard-read; clipboard-write; local-network-access; local-network; loopback-network"
        onLoad={() => {
          setLoaded(true);
          setTimedOut(false);
          window.parent.postMessage(
            {
              source: "extensionpromax",
              type: "ladipage-app-ready",
              appId,
            },
            "*",
          );
          if (isFacebookAds) {
            window.parent.postMessage(
              {
                source: "extensionpromax",
                type: "ladipage-facebook-ads-ready",
              },
              "*",
            );
          }
        }}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: isFacebookAds ? "#020617" : "#f8fafc",
        }}
      />
    </main>
  );
}

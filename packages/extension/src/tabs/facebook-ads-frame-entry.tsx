import React from "react";
import { createRoot } from "react-dom/client";
import FacebookAdsFrameTab from "./facebook-ads-frame";

const container = document.querySelector<HTMLDivElement>("#app");

if (!container) {
  throw new Error("Facebook Ads frame root was not found.");
}

createRoot(container).render(
  <React.StrictMode>
    <FacebookAdsFrameTab />
  </React.StrictMode>,
);

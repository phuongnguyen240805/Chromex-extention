// @ts-nocheck
import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect, useState } from "react";
// Import file style CSS/SCSS gốc của app e-commer
import styleText from "data-text:../platforms/e-commmer/src/contentScript/contentApp/index.css";
import "../platforms/e-commmer/src/contentScript/contentApp/index.css";
import AppContent from "../platforms/e-commmer/src/contentScript/contentApp/app";
import "../platforms/e-commmer/src/contentScript/contentApp/i18n";

export const config: PlasmoCSConfig = {
  matches: [
    "*://*.taobao.com/*",
    "*://*.tmall.com/*",
    "*://*.tmall.hk/*",
    "*://*.1688.com/*",
    "*://*.aliexpress.com/*",
    "*://*.aliexpress.us/*",
    "*://*.aliexpress.ru/*",
    "*://shopee.vn/*",
    "*://shopee.com/*",
    "*://shopee.com.my/*",
    "*://shopee.co.id/*",
    "*://shopee.co.th/*",
    "*://shopee.ph/*",
    "*://shopee.com.ph/*",
    "*://shopee.sg/*",
    "*://shopee.com.sg/*",
    "*://shopee.tw/*",
    "*://shopee.com.tw/*",
    "*://seller.shopee.cn/*",
    "*://seller.shopee.vn/*",
    "*://banhang.shopee.vn/*",
    "*://*.lazada.vn/*",
    "*://*.lazada.sg/*",
    "*://*.lazada.com.my/*",
    "*://*.lazada.co.th/*",
    "*://*.lazada.co.id/*",
    "*://*.lazada.com.ph/*",
    "*://www.tiktok.com/*",
    "*://shop.tiktok.com/*",
    "*://shop-vn.tiktok.com/*",
    "*://shop-sg.tiktok.com/*",
    "*://shop-my.tiktok.com/*",
    "*://shop-th.tiktok.com/*",
    "*://shop-ph.tiktok.com/*",
    "*://tiki.vn/*",
    "*://*.pinduoduo.com/*",
    "*://*.yangkeduo.com/*"
  ],
  all_frames: true,
  run_at: "document_start"
};

// Consolidated regex patterns for better performance
const SITE_PATTERNS = {
  TAOBAO:
    /^(item\.taobao\.com|world\.taobao\.com|detail\.tmall\..*|detail\.1688\.com)/,
  LAZADA: /^(www\.)?lazada\..*/,
  SHOPEE: /^shopee\..*/,
  TIKTOK: /^(www\.|shop\.)?tiktok(v)?\..*/,
  TIKI: /^tiki\.vn\/.*/,
  SELLY: /^selly\.vn\/.*/,
  ALIEXPRESS: /.*aliexpress\.(com|us)\/item\/\d+\.html.*/,
  SELLER_SHOPEE: /(seller|banhang)\.shopee\..*/,
  SELLER_TIKTOK: /seller-[a-z]{2}\.tiktok\..*/,
  KIOTVIET: /^[^.]+\.kiotviet\..*/,
  VIETTELPOST: /^viettelpost\.vn\/.*/,
  PINDUODUO: /^(mobile\.)?(yangkeduo|pinduoduo)\.com\/.*/,
};

function shouldInjectContent(url = window.location.href) {
  if (url.includes("account.seller.shopee.com")) {
    return false;
  }
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  return Object.values(SITE_PATTERNS).some((pattern) => {
    return pattern.test(hostname + new URL(url).pathname);
  });
}

async function injectScript(src: string) {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = function () {
      resolve(null);
    };
    (document.head || document.documentElement).appendChild(s);
  });
}

// Gắn thẳng giao diện ShipXanh vào DOM gốc của trang web giống hệt kiến trúc gốc
export const getRootContainer = () => {
  let root = document.querySelector("#sx-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "sx-root";
    if (window.location.hostname.includes("kiotviet")) {
      root.classList.add("kiotviet");
    }
    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(root);
    }
  }

  // Tự động nhúng file CSS tĩnh của ShipXanh trực tiếp vào document.head
  if (!document.querySelector("#sx-custom-style")) {
    const style = document.createElement("style");
    style.id = "sx-custom-style";
    style.textContent = styleText;
    (document.head || document.documentElement).appendChild(style);
  }

  return root;
};

const EcommerContentApp = () => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!shouldInjectContent()) return;

    setShouldRender(true);
    const hostname = window.location.hostname;

    // Only inject needed scripts based on the current site
    if (hostname.includes("lazada")) {
      injectScript(chrome.runtime.getURL("scripts/lazada-inject.js")).catch(() => { });
    } else if (hostname.includes("1688")) {
      injectScript(chrome.runtime.getURL("scripts/1688-inject.js")).catch(() => { });
    } else if (hostname.includes("aliexpress")) {
      injectScript(chrome.runtime.getURL("scripts/aliexpress-inject.js")).catch(() => { });
    } else if (hostname.includes("shopee") && !hostname.includes("seller")) {
      injectScript(chrome.runtime.getURL("scripts/shopee-inject.js")).catch(() => { });
    }
  }, []);

  if (!shouldRender) return null;

  return <AppContent />;
};

export default EcommerContentApp;

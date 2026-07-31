import ReactDOM from "react-dom/client";
import "./index.css";
import AppContent from "./app";
import "./i18n";

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

// More efficient URL checking
function shouldInjectContent(url = window.location.href) {
  // Exclude specific URLs
  if (url.includes("account.seller.shopee.com")) {
    return false;
  }

  const hostname = new URL(url).hostname.replace(/^www\./, "");

  // Check against our consolidated patterns
  return Object.values(SITE_PATTERNS).some((pattern) => {
    return pattern.test(hostname + new URL(url).pathname);
  });
}

async function inject(src: string) {
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = function () {
      resolve(null);
    };
    (document.head || document.documentElement).appendChild(s);
  });
}

// More efficient DOM management
function createAppRoot() {
  if (document.querySelector("#sx-root")) return;

  const root = document.createElement("div");
  if (SITE_PATTERNS.KIOTVIET.test(window.location.hostname)) {
    root.classList.add("kiotviet");
  }
  root.id = "sx-root";
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<AppContent />);
}

// Main initialization function with better resource management
async function init() {
  console.log("shipxanh init");

  if (!shouldInjectContent()) return;

  const hostname = window.location.hostname;

  // Only inject needed scripts based on the current site
  if (hostname.includes("lazada")) {
    await inject(chrome.runtime.getURL("scripts/lazada-inject.js"));
  } else if (hostname.includes("1688")) {
    await inject(chrome.runtime.getURL("scripts/1688-inject.js"));
  }

  // Wait for document to be fully loaded to reduce performance impact
  if (document.readyState === "complete") {
    createAppRoot();
  } else {
    // Use one-time event listener instead of continuous observation
    window.addEventListener("load", createAppRoot, { once: true });

    // Fallback if load event already fired
    setTimeout(createAppRoot, 1500);
  }
}

init();

import type { PlasmoCSConfig } from "plasmo"
import messengerHookUrl from "url:~platforms/facebook/hooks/fb-ws-hook.ts"
import { initGlobalFeatures } from "./global"
import { initFacebookFeatures } from "../platforms/facebook/content"
import { initInstagramHide } from "../platforms/instagram/content/instagram-hide"
import { initMediumFontFix } from "../platforms/medium/content/medium-font-fix"
import { initKeywordToolsContent } from "../platforms/keyword-tools/src"
import igAjaxHookUrl from "url:~platforms/instagram/hooks/ig-ajax-hook.ts"
import { initInstagramWidget } from "../platforms/keyword-tools/src/content/instagram"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_start"
}

const initializeLoader = async () => {
  console.log('🚀 Social AIO - Loader Initialized');
  const host = window.location.hostname;
  
  let settings: any = {};
  try {
    const rawStorage = await chrome.storage.local.get(null);
    const rawWskState = rawStorage?.["wsk-state"];
    const parsedWskState = typeof rawWskState === "string" ? JSON.parse(rawWskState) : rawWskState;
    settings = parsedWskState?.state || {};
  } catch (e) {
    console.error("Loader: Failed to retrieve settings", e);
  }

  // Helper to inject scripts into the page context (MAIN world)
  const injectScript = (url: string) => {
    try {
      const script = document.createElement('script');
      script.src = url;
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(script);
        script.onload = () => script.remove();
      } else {
        const observer = new MutationObserver((_, obs) => {
          const t = document.head || document.documentElement;
          if (t) {
            obs.disconnect();
            t.appendChild(script);
            script.onload = () => script.remove();
          }
        });
        observer.observe(document, { childList: true, subtree: true });
      }
    } catch (e) {
      console.error("Loader: Failed to inject script", url, e);
    }
  };

  // Set config for MAIN world scripts
  try {
    const setConfig = () => {
      document.documentElement.setAttribute('data-social-aio-config', JSON.stringify({
        blockSeenChat: settings.blockSeenChat !== false,
        blockTyping: settings.blockTyping !== false,
        antiPhishing: settings.antiPhishing === true,
        stopNewFeed: settings.stopNewFeed !== false,
        showReactions: settings.showReactions !== false,
        fbVideoDownload: settings.fbVideoDownload !== false
      }));
    };
    if (document.documentElement) {
      setConfig();
    } else {
      const observer = new MutationObserver((_, obs) => {
        if (document.documentElement) {
          obs.disconnect();
          setConfig();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  } catch (e) {
    console.error("Loader: Failed to set data-social-aio-config attribute", e);
  }

  // 1. GLOBAL FEATURES
  try {
    initGlobalFeatures();
  } catch (e) {
    console.error("Loader: Failed to initialize global features", e);
  }

  // 2. FACEBOOK FEATURES
  if (host.includes('facebook.com') || host.includes('fb.com')) {
    try {
      injectScript(messengerHookUrl);
      initFacebookFeatures(settings);
    } catch (e) {
      console.error("Loader: Failed to initialize Facebook features", e);
    }
  }

  // 3. INSTAGRAM FEATURES
  if (host.includes('instagram.com')) {
    try {
      injectScript(igAjaxHookUrl);
      initInstagramHide();
      initInstagramWidget();
    } catch (e) {
      console.error("Loader: Failed to initialize Instagram features", e);
    }
  }

  // 4. MEDIUM FEATURES
  if (host.includes('medium.com')) {
    try {
      initMediumFontFix();
    } catch (e) {
      console.error("Loader: Failed to initialize Medium features", e);
    }
  }

  // 5. KEYWORD EVERYWHERE FEATURES
  if (
    host.includes('chatgpt.com') ||
    host.includes('openai.com') ||
    host.includes('gemini.google.com') ||
    host.includes('claude.ai') ||
    host.includes('deepseek.com') ||
    host.includes('youtube.com') ||
    host.split('.').some(part => part === 'google')
  ) {
    try {
      initKeywordToolsContent(host);
    } catch (e) {
      console.error("Loader: Failed to initialize Keyword Everywhere features", e);
    }
  }
};

initializeLoader();



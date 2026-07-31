import { initWidgetController, toggleWidget } from "../services/widget-controller";
import { addAioAnalyzeButton } from "./google-aio";
import { initGoogleDifficulty } from "./google-difficulty";
import { initYoutubeContent } from "./youtube";

let activeSource = "openai";

const getHostSource = (host: string): string => {
  if (host.includes("chatgpt.com") || host.includes("openai.com")) return "openai";
  if (host.includes("gemini.google.com")) return "gemini";
  if (host.includes("claude.ai")) return "claude";
  if (host.includes("deepseek.com")) return "deepsk";
  return "openai";
};

const isGoogleSearch = (host: string): boolean => {
  return host.split('.').some(part => part === 'google') && !host.includes('gemini.google.com');
};

const isDarkTheme = (): boolean => {
  if (activeSource === "openai") {
    return document.documentElement.classList.contains("dark");
  } else if (activeSource === "gemini") {
    return document.body.classList.contains("dark-theme");
  } else if (activeSource === "claude") {
    return document.documentElement.dataset.mode === "dark";
  } else if (activeSource === "deepsk") {
    return document.body.classList.contains("dark");
  }
  return true;
};

// Injects the prompt text into the active AI editor
const injectPrompt = (promptText: string) => {
  if (activeSource === "openai") {
    const form = document.querySelector("main form");
    if (form) {
      const textarea = form.querySelector("textarea") as HTMLTextAreaElement;
      if (textarea && textarea.offsetParent !== null) {
        textarea.value = promptText.replace(/\n/g, "\r\n");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        const promptDiv = form.querySelector("#prompt-textarea") as HTMLElement;
        if (promptDiv) {
          promptDiv.innerHTML = "<p>" + promptText.replace(/\n/g, "</p><p>") + "</p>";
          promptDiv.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      setTimeout(() => {
        const sendBtn = form.querySelector('button[data-testid="send-button"], button:not([disabled])') as HTMLButtonElement;
        sendBtn?.click();
      }, 300);
    }
  } else if (activeSource === "gemini") {
    const editor = document.querySelector("input-area-v2 .ql-editor.textarea p, input-area-v2 div[contenteditable=true]") as HTMLElement;
    if (editor) {
      editor.focus();
      editor.innerHTML = promptText.replace(/\n/g, "<br>");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      setTimeout(() => {
        const sendBtn = document.querySelector("input-area-v2 button.send-button") as HTMLButtonElement;
        sendBtn?.click();
      }, 300);
    }
  } else if (activeSource === "claude") {
    const editor = document.querySelector('fieldset div[contenteditable="true"]') as HTMLElement;
    if (editor) {
      editor.innerHTML = "<p>" + promptText.replace(/\n/g, "</p><p>") + "</p>";
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => {
        const sendBtn = document.querySelector('fieldset button[aria-label="Send message"]') as HTMLButtonElement;
        sendBtn?.removeAttribute("disabled");
        sendBtn?.click();
      }, 300);
    }
  } else if (activeSource === "deepsk") {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.value = promptText;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));
      setTimeout(() => {
        const form = textarea.closest("form") || textarea.parentElement?.parentElement;
        const buttons = form?.querySelectorAll("button, [role=button]");
        if (buttons && buttons.length > 0) {
          const sendBtn = buttons[buttons.length - 1] as HTMLElement;
          sendBtn?.click();
        }
      }, 300);
    }
  }
};

// Creates a premium templates floating button
const injectFloatingButton = () => {
  if (document.getElementById("xt-openai-templates-floating-btn")) return;

  const btn = document.createElement("button");
  btn.id = "xt-openai-templates-floating-btn";
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
      <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
      <path d="M3.277 10.9a.75.75 0 00-.75.75v3.15c0 .356.242.668.585.748l8.25 1.944a.75.75 0 00.338 0l8.25-1.944a.75.75 0 00.585-.748v-3.15a.75.75 0 00-.75-.75h-16.5z" />
    </svg>
    <span>Templates</span>
  `;

  // Apply premium glassmorphism styling
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = "99999";
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.gap = "8px";
  btn.style.padding = "10px 16px";
  btn.style.borderRadius = "20px";
  btn.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  btn.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%)";
  btn.style.backdropFilter = "blur(8px)";
  btn.style.color = "#FFFFFF";
  btn.style.fontFamily = "system-ui, -apple-system, sans-serif";
  btn.style.fontSize = "12px";
  btn.style.fontWeight = "600";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37)";
  btn.style.transition = "transform 0.2s, opacity 0.2s";

  btn.addEventListener("mouseover", () => {
    btn.style.transform = "scale(1.05)";
  });
  btn.addEventListener("mouseout", () => {
    btn.style.transform = "scale(1)";
  });
  btn.addEventListener("click", () => {
    toggleWidget({
      darkMode: isDarkTheme(),
      source: activeSource
    });
  });

  document.body.appendChild(btn);
};

let ytDebounceTimer: any = null;
const triggerYt = () => {
  if (ytDebounceTimer) clearTimeout(ytDebounceTimer);
  ytDebounceTimer = setTimeout(initYoutubeContent, 400);
};

let googleDebounceTimer: any = null;
const triggerGoogle = () => {
  if (googleDebounceTimer) clearTimeout(googleDebounceTimer);
  googleDebounceTimer = setTimeout(() => {
    addAioAnalyzeButton();
    initGoogleDifficulty();
  }, 400);
};

export const initKeywordToolsContent = (host: string) => {
  if (window !== window.top) return;

  if (host.includes("youtube.com")) {
    console.log("🎥 YouTube host detected for Search Insights injection:", host);
    const startYt = () => {
      initYoutubeContent();
      const observer = new MutationObserver((mutations) => {
        const isSelfMutation = mutations.every(m => {
          const target = m.target as HTMLElement;
          return target.closest && (target.closest("#xt-yt-avg-widget") || target.closest("#xt-yt-watch-widget"));
        });
        if (!isSelfMutation) {
          triggerYt();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startYt);
    } else {
      startYt();
    }
    return;
  }

  if (isGoogleSearch(host)) {
    console.log("🔍 Google search host detected for AIO button and SEO Difficulty injection:", host);
    
    const startGoogleFeatures = () => {
      addAioAnalyzeButton();
      initGoogleDifficulty();
      
      const observer = new MutationObserver((mutations) => {
        const isSelfMutation = mutations.every(m => {
          const target = m.target as HTMLElement;
          return target.closest && (
            target.closest("#xt-difficulty-root") || 
            target.closest(".xt-aio-analyze-button") || 
            target.closest(".xt-serp-stats-bar")
          );
        });
        if (!isSelfMutation) {
          triggerGoogle();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startGoogleFeatures);
    } else {
      startGoogleFeatures();
    }
    return;
  }

  activeSource = getHostSource(host);
  
  // Auto-inject pending prompt from Google Search SEO widgets
  try {
    chrome.storage.local.get(['pendingAiPrompt', 'pendingAiSource'], (obj) => {
      try {
        if (obj?.pendingAiPrompt && obj?.pendingAiSource === activeSource) {
          chrome.storage.local.remove(['pendingAiPrompt', 'pendingAiSource'], () => {
            const startInject = () => {
              setTimeout(() => {
                try {
                  injectPrompt(obj.pendingAiPrompt);
                } catch (e) {
                  console.error("injectPrompt failed", e);
                }
              }, 1500);
            };
            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", startInject);
            } else {
              startInject();
            }
          });
        }
      } catch (innerErr) {
        console.error("Error checking/removing pending prompt", innerErr);
      }
    });
  } catch (err) {
    console.error("Storage get failed", err);
  }
  
  // 1. Initialize widget overlay window controllers
  initWidgetController();

  // 2. Listen to custom messages to execute chosen template prompts
  window.addEventListener("message", (event) => {
    const payload = event.data;
    if (typeof payload !== "object" || !payload) return;
    const { cmd, data } = payload;
    if (cmd === "xt-openai-choose-template" && data?.prompt) {
      injectPrompt(data.prompt);
    }
  });

  const startFloatingBtnObserver = () => {
    if (!document.body) return;
    
    // Safety: disconnect before inject, reconnect after
    const observer = new MutationObserver(() => {
      const isButtonStillHere = document.getElementById("xt-openai-templates-floating-btn");
      if (!isButtonStillHere) {
        observer.disconnect();
        injectFloatingButton();
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
    
    injectFloatingButton();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // 3. Inject floating template button on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startFloatingBtnObserver);
  } else {
    startFloatingBtnObserver();
  }
};

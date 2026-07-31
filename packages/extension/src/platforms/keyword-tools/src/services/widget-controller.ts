export interface WidgetConfig {
  darkMode: boolean;
  source: string;
  position?: { left: number; top: number } | null;
}

let activeIframe: HTMLIFrameElement | null = null;
let activeWidgetContainer: HTMLDivElement | null = null;

const getWidgetTitle = (source: string): string => {
  switch (source) {
    case "openai": return "ChatGPT Templates";
    case "claude": return "Claude Templates";
    case "gemini": return "Gemini Templates";
    case "deepsk": return "Deepseek Templates";
    default: return "AI Templates";
  }
};

export const initWidgetController = () => {
  // Listen to postMessages from the widget iframe
  window.addEventListener("message", (event) => {
    const payload = event.data;
    if (typeof payload !== "object" || !payload) return;
    const { cmd, data } = payload;
    if (!cmd) return;

    // Resize command
    if (cmd === "xt.resize" && activeIframe) {
      const height = data?.height;
      if (height && height > 0) {
        activeIframe.style.height = `${height}px`;
      }
    }

    // Close command
    if (cmd === "xt-openai-widget.close" || cmd === "xt-openai-widget.hide") {
      hideWidget();
    }
  });
};

export const showWidget = async (config: WidgetConfig) => {
  if (activeWidgetContainer) {
    activeWidgetContainer.style.display = "flex";
    return;
  }

  // Load last position
  const storage = await chrome.storage.local.get("openaiPosition");
  const lastPos = storage?.openaiPosition || config.position || { left: window.innerWidth - 440, top: 80 };

  // Create Container
  const container = document.createElement("div");
  container.id = "xt-openai-widget";
  container.style.position = "fixed";
  container.style.zIndex = "999999";
  container.style.width = "400px";
  container.style.left = `${lastPos.left}px`;
  container.style.top = `${lastPos.top}px`;
  container.style.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)";
  container.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  container.style.borderRadius = "12px";
  container.style.overflow = "hidden";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.backgroundColor = "#0F172A";

  // Create Handle (Drag Area)
  const handle = document.createElement("div");
  handle.style.cursor = "move";
  handle.style.padding = "8px 12px";
  handle.style.backgroundColor = "#1E293B";
  handle.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
  handle.style.display = "flex";
  handle.style.alignItems = "center";
  handle.style.justifyContent = "space-between";
  handle.style.color = "#F8FAFC";
  handle.style.fontFamily = "system-ui, -apple-system, sans-serif";
  handle.style.fontSize = "11px";
  handle.style.fontWeight = "600";
  handle.style.userSelect = "none";

  const titleSpan = document.createElement("span");
  titleSpan.textContent = `🔑 ${getWidgetTitle(config.source)}`;
  handle.appendChild(titleSpan);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "#94A3B8";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "12px";
  closeBtn.style.padding = "2px 6px";
  closeBtn.style.borderRadius = "4px";
  closeBtn.addEventListener("mouseover", () => {
    closeBtn.style.color = "#F1F5F9";
    closeBtn.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
  });
  closeBtn.addEventListener("mouseout", () => {
    closeBtn.style.color = "#94A3B8";
    closeBtn.style.backgroundColor = "transparent";
  });
  closeBtn.addEventListener("click", () => {
    hideWidget();
  });
  handle.appendChild(closeBtn);
  container.appendChild(handle);

  // Create Iframe
  const iframe = document.createElement("iframe");
  const pageUrl = chrome.runtime.getURL(`tabs/openai.html?darkmode=${config.darkMode}&source=${config.source}`);
  iframe.src = pageUrl;
  iframe.style.width = "100%";
  iframe.style.height = "420px";
  iframe.style.border = "none";
  iframe.style.backgroundColor = "transparent";
  
  container.appendChild(iframe);
  document.body.appendChild(container);

  activeIframe = iframe;
  activeWidgetContainer = container;

  // Setup dragging
  initDragEvents(container, handle);
};

export const hideWidget = () => {
  if (activeWidgetContainer) {
    activeWidgetContainer.style.display = "none";
  }
};

export const toggleWidget = (config: WidgetConfig) => {
  if (activeWidgetContainer && activeWidgetContainer.style.display !== "none") {
    hideWidget();
  } else {
    showWidget(config);
  }
};

// Drag handler helper
const initDragEvents = (rootEl: HTMLDivElement, handleEl: HTMLDivElement) => {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest("button")) return; // Skip if click on close button
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = rootEl.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let left = initialLeft + dx;
    let top = initialTop + dy;
    
    // Bounds check
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const rect = rootEl.getBoundingClientRect();
    
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > winW - rect.width) left = winW - rect.width;
    if (top > winH - rect.height) top = winH - rect.height;
    
    rootEl.style.left = `${left}px`;
    rootEl.style.top = `${top}px`;
    rootEl.style.right = "auto";
    rootEl.style.bottom = "auto";
  };

  const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    
    // Save position
    const rect = rootEl.getBoundingClientRect();
    chrome.storage.local.set({
      openaiPosition: { left: rect.left, top: rect.top }
    });
  };

  handleEl.addEventListener("mousedown", onMouseDown);
};

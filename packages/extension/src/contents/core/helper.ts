export function sendToContentScript(event: string, data: any) {
  return new Promise((resolve) => {
    let uuid = Math.random().toString(36); // uuid to distinguish events
    let listenerKey = "aio-contentscript-sendto-pagescript" + uuid;
    window.addEventListener(listenerKey, (evt: any) => resolve(evt.detail.data), {
      once: true,
    });
    window.dispatchEvent(
      new CustomEvent("aio-pagescript-sendto-contentscript", {
        detail: { event, data, uuid },
      })
    );
  });
}

export function runInContentScript(fnPath: string, params: any) {
  // WARNING: can only transfer serializable data
  return sendToContentScript("aio-runInContentScript", {
    fnPath,
    params,
  });
}

export function runInBackground(fnPath: string, params: any) {
  return sendToContentScript("aio-runInBackground", {
    fnPath,
    params,
  });
}

export function getURL(filePath: string) {
  return runInContentScript("chrome.runtime.getURL", [filePath]);
}

export async function getExtStorage(key: string) {
  return runInContentScript("utils.Storage.get", [key]);
}

export async function setExtStorage(key: string, value: any) {
  return runInContentScript("utils.Storage.set", [key, value]);
}

export function notify({
  msg = "",
  x = window.innerWidth / 2,
  y = window.innerHeight - 100,
  align = "center",
  styleText = "",
  duration = 3000,
  id = "aio_notify_div",
} = {}) {
  let exist = document.getElementById(id);
  if (exist) exist.remove();

  // create notify msg in website at postion, fade out animation, auto clean up
  let div = document.createElement("div");
  div.id = id;
  div.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        padding: 10px;
        background-color: #333;
        color: #fff;
        border-radius: 5px;
        z-index: 2147483647;
        transition: all 1s ease-out;
        ${
          align === "right"
            ? "transform: translateX(-100%);"
            : align === "center"
            ? "transform: translateX(-50%);"
            : ""
        }
        ${styleText || ""}
      `;
  div.innerHTML = createTrustedHtml(msg);
  (document.body || document.documentElement).appendChild(div);

  let timeouts: any[] = [];
  function closeAfter(_time: number) {
    timeouts.forEach((t) => clearTimeout(t));
    timeouts = [
      setTimeout(() => {
        if (div) {
          div.style.opacity = "0";
          div.style.top = `${y - 50}px`;
        }
      }, _time - 1000) as any,
      setTimeout(() => {
        div?.remove();
      }, _time) as any,
    ];
  }

  if (duration > 0) closeAfter(duration);

  return {
    closeAfter: closeAfter,
    remove() {
      if (div) {
        div.remove();
        div = null as any;
        return true;
      }
      return false;
    },
    setText(text: string, duration?: number) {
      if (div) {
        div.innerHTML = createTrustedHtml(text);
        if (duration) closeAfter(duration);
        return true;
      }
      return false;
    },
    setPosition(x: number, y: number) {
      if (div) {
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        return true;
      }
      return false;
    },
  };
}

export function loadingFullScreen(text = "") {
  const noti = notify({
    msg: text,
    styleText: `
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #0006;
    `,
    align: "",
    duration: 0,
    id: "aio_loading_fullscreen",
  });
  return noti;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const numberFormatCached: Record<string, Intl.NumberFormat> = {};
/**
 * Get number formatter
 * @param {string} optionSelect "compactLong", "standard", "compactShort"
 * @param {string|undefined} locale Browser locale
 * @return {Intl.NumberFormat}
 */
export function getNumberFormatter(optionSelect: string, locale?: string) {
  if (!locale) {
    if (document.documentElement.lang) {
      locale = document.documentElement.lang;
    } else if (navigator.language) {
      locale = navigator.language;
    } else {
      try {
        locale = new URL(
          (document.querySelectorAll("head > link[rel='search']")[0] as any)
            ?.getAttribute("href") || ""
        )?.searchParams?.get("locale") || undefined;
      } catch {
        console.log(
          "Cannot find browser locale. Use en as default for number formatting."
        );
        locale = "en";
      }
    }
  }
  let formatterNotation;
  let formatterCompactDisplay;
  switch (optionSelect) {
    case "compactLong":
      formatterNotation = "compact";
      formatterCompactDisplay = "long";
      break;
    case "standard":
      formatterNotation = "standard";
      formatterCompactDisplay = "short";
      break;
    case "compactShort":
    default:
      formatterNotation = "compact";
      formatterCompactDisplay = "short";
  }

  let key = locale + formatterNotation + formatterCompactDisplay;
  if (!numberFormatCached[key]) {
    const formatter = new Intl.NumberFormat(locale, {
      notation: formatterNotation as any,
      compactDisplay: formatterCompactDisplay as any,
    });
    numberFormatCached[key] = formatter;
  }
  return numberFormatCached[key];
}

export function onElementsAdded(selector: string, callback: (nodes: NodeList | Element[]) => void, once = false) {
  let nodes = document.querySelectorAll(selector);
  if (nodes?.length) {
    callback(nodes);
    if (once) return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (!mutation.addedNodes) return;

      for (let node of mutation.addedNodes) {
        if (node.nodeType != 1) continue; // only process Node.ELEMENT_NODE

        let n = (node as Element).matches(selector)
          ? [node as Element]
          : Array.from((node as Element).querySelectorAll(selector));

        if (n?.length) {
          callback(n);
          if (once) observer.disconnect();
        }
      }
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  // return disconnect function
  return () => observer.disconnect();
}

export function onElementRemoved(element: Element, callback: (el: Element) => void) {
  if (!element.parentElement) throw new Error("element must have parent");

  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        if (mutation.removedNodes.length > 0) {
          for (let node of mutation.removedNodes) {
            if (node === element) {
              callback?.(node as Element);
              observer.disconnect();
            }
          }
        }
      }
    });
  });

  observer.observe(element.parentElement, {
    childList: true,
  });

  return () => observer.disconnect();
}

export function closest(element: Element, selector: string) {
  let el = element;
  while (el !== null) {
    if (el.matches(selector)) return el;

    let found = el.querySelector(selector);
    if (found) return found;

    el = el.parentElement as any;
  }
  return el;
}

export function deepFind(obj: any, path: string | string[], once = true, exactPath = false) {
  if (!obj || typeof obj !== "object") return once ? null : [];

  const paths = Array.isArray(path) ? path : path.split("."); // Split path into segments
  const result = [];
  const stack = [
    {
      currentObj: obj,
      currentPathIndex: 0,
      correctPath: false,
    },
  ]; // Stack for traversal

  let foundFirstPath = false;

  while (stack.length) {
    const { currentObj, currentPathIndex, correctPath } = stack.pop()!;
    if (currentPathIndex === paths.length) {
      // Fully matched path, collect the value
      const res = !exactPath ? currentObj : correctPath ? currentObj : null;
      // console.log(path, res, currentObj);
      if (once) return res;
      result.push(res);
      continue;
    }

    const key = paths[currentPathIndex];
    if (typeof currentObj === "object" && currentObj !== null) {
      if (key in currentObj) {
        foundFirstPath = true;
        // Continue matching the next segment
        stack.push({
          currentObj: currentObj[key],
          currentPathIndex: currentPathIndex + 1,
          correctPath: true,
        });
      }

      // Traverse all properties if exactPath is false
      if (!exactPath || !foundFirstPath) {
        Object.entries(currentObj).forEach(([_key, value]) => {
          if (_key !== key && typeof value === "object" && value !== null) {
            stack.push({
              currentObj: value,
              currentPathIndex: currentPathIndex,
              correctPath: false,
            });
          }
        });
      }
    }
  }

  return once ? null : result;
}

export function parseSafe(str = "", defaultValue = {}) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("Cannot parse JSON", e, str);
    return defaultValue;
  }
}

export function downloadUrl(url: string, filename: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    a.click();
    a.remove();
  } catch (e) {
    window.open(url, "_blank");
  }
}

export function downloadData(data: any, filename: string, type = "text/plain") {
  let file = new Blob([data], { type: type });
  if ((window.navigator as any).msSaveOrOpenBlob)
    (window.navigator as any).msSaveOrOpenBlob(file, filename);
  else {
    let a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

export function sanitizeName(name: string, modifyIfPosible = true) {
  if (typeof name !== "string") {
    throw new Error("Input must be string");
  }
  const replacement = "";
  const illegalRe = /[\/\?<>\\:\*\|"]/g;
  const controlRe = /[\x00-\x1f\x80-\x9f]/g;
  const reservedRe = /^\.+$/;
  const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
  const windowsTrailingRe = /[\. ]+$/;
  if (modifyIfPosible) {
    name = name
      .replaceAll("<", "‹")
      .replaceAll(">", "›")
      .replaceAll(":", "∶")
      .replaceAll('"', "″")
      .replaceAll("/", "∕")
      .replaceAll("\\", "∖")
      .replaceAll("|", "¦")
      .replaceAll("?", "¿");
  }
  const sanitized = name
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);
  return sanitized; // TODO truncates to length of 255
}
export function injectCssCode(code: string) {
  let css = document.createElement("style");
  css.textContent = code;
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(css);
  } else {
    const observer = new MutationObserver((_, obs) => {
      const t = document.head || document.documentElement;
      if (t) {
        obs.disconnect();
        t.appendChild(css);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
  return css;
}
export function injectCssFile(filePath: string, id?: string) {
  let css = document.createElement("link");
  css.setAttribute("rel", "stylesheet");
  css.setAttribute("type", "text/css");
  css.setAttribute("href", filePath);
  if (id) css.setAttribute("id", id);
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(css);
  } else {
    const observer = new MutationObserver((_, obs) => {
      const t = document.head || document.documentElement;
      if (t) {
        obs.disconnect();
        t.appendChild(css);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
  return css;
}

export function executeScript(code: string) {
  let script = document.createElement("script");
  script.textContent = createTrustedScript(code);
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(script);
    script.onload = function () {
      script.remove();
    };
  } else {
    const observer = new MutationObserver((_, obs) => {
      const t = document.head || document.documentElement;
      if (t) {
        obs.disconnect();
        t.appendChild(script);
        script.onload = function () {
          script.remove();
        };
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
}
export function getTrustedPolicy() {
  if (!(window as any).trustedTypes) {
    return {
      createHTML: (string: string) => string,
      createScriptURL: (string: string) => string,
      createScript: (string: string) => string,
    };
  }
  let policy = (window as any).trustedTypes?.ufsTrustedTypesPolicy || null;
  if (!policy) {
    policy = (window as any).trustedTypes.createPolicy("ufsTrustedTypesPolicy", {
      createHTML: (string: string, sink: any) => string,
      createScriptURL: (string: string) => string,
      createScript: (string: string) => string,
    });
  }
  return policy;
}
export function createTrustedHtml(html: string) {
  let policy = getTrustedPolicy();
  return policy.createHTML(html);
}
export function createTrustedScript(code: string) {
  let policy = getTrustedPolicy();
  return policy.createScript(code);
}
export function injectScriptSrc(src: string, callback: (success: boolean, error?: any) => void) {
  let policy = getTrustedPolicy();
  let jsSrc = (policy as any).createScriptURL(src);
  let script = document.createElement("script");
  script.onload = function () {
    callback?.(true);
  };
  script.onerror = function (e) {
    callback?.(false, e);
  };
  script.src = jsSrc as any; // Assigning the TrustedScriptURL to src
  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(script);
  } else {
    const observer = new MutationObserver((_, obs) => {
      const t = document.head || document.documentElement;
      if (t) {
        obs.disconnect();
        t.appendChild(script);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
  return script;
}
export function injectScriptSrcAsync(src: string) {
  return new Promise((resolve) => {
    injectScriptSrc(src, (success: boolean) => {
      resolve(success);
    });
  });
}
export const getFBAIODashboard = () => {
  const isDev = true;
  const localPort = 3000;
  if (isDev) {
    return `http://localhost:${localPort}/dashboard/admin/tools/download-video`;
  }
  return "https://fb-aio.github.io/entry/";
};
// @ts-nocheck
import axios from "axios";
import {
  checkProductCopyIdsExist,
  getHeaders,
  getOrder,
  getShopConnected,
  saveProductCopy,
  cancelAllRequests,
  getProducts,
  getShipXanhOrdersByIds,
  syncPriceBook,
  UpsertCarrierVTP,
  refreshFirebaseToken,
} from "./background.function";
let shopConnected: any[] = [];

function openPanel(tabId?: number) {
  chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
    const activeTab = currentWindow.tabs?.find((tab) => tab.active);

    chrome.sidePanel.open({
      tabId: tabId || (activeTab?.id as number),
      windowId: activeTab?.windowId as number,
    });
  });
}

function controlPanel(tabId?: number) {
  chrome.sidePanel.getOptions({}, (options) => {
    if (options) {
      if (options.enabled) {
        openPanel(tabId);
      } else {
        chrome.sidePanel.setOptions({
          enabled: false,
        });
      }
    }
  });
}
let TOKEN: string = "";
let tiktokCrawlCookie: string = "";

async function getToken() {
  const store = await chrome.storage.local.get("user-store@store");
  const user = store["user-store@store"];

  console.log("user", user);

  if (!user || !user.stsTokenManager) {
    return TOKEN;
  }

  const now = Date.now();
  // If token is still valid (with 5 min buffer), return it
  if (user.stsTokenManager.expirationTime - now > 5 * 60 * 1000) {
    TOKEN = user.stsTokenManager.accessToken;
    return TOKEN;
  }

  // Token expired or near expiration, try to refresh
  try {
    const refreshData = await refreshFirebaseToken(
      user.stsTokenManager.refreshToken,
      user.auth.apiKey,
    );

    if (refreshData && refreshData.id_token) {
      user.stsTokenManager.accessToken = refreshData.id_token;
      user.stsTokenManager.refreshToken = refreshData.refresh_token;
      user.stsTokenManager.expirationTime =
        Date.now() + +refreshData.expires_in * 1000;

      await chrome.storage.local.set({ "user-store@store": user });
      TOKEN = refreshData.id_token;
      return TOKEN;
    }
  } catch (error) {
    console.error("Failed to auto-refresh token:", error);
  }

  return TOKEN;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const data = request.params;
  switch (request.func) {
    case "OPEN_CONTENT_PANEL":
      openPanel();
      break;
    case "GET_TAB_ID":
      sendResponse(sender.tab?.id);
      break;
    case "GET_EXTENSION_VERSION":
      sendResponse(chrome.runtime.getManifest().version);
      break;
    case "OPEN_TAB":
      chrome.tabs
        .create({ url: data?.url, active: data?.active ?? true })
        .then(() => {
          sendResponse(true);
        })
        .catch((err) => {
          console.error("Failed to open tab via background:", err);
          sendResponse(false);
        });
      break;

    case "FOCUS_TAB":
      chrome.tabs
        .update(+data.tabId, {
          active: true,
        })
        .then(() => {
          sendResponse(true);
        });
      break;

    case "SIGN_OUT":
      TOKEN = "";
      chrome.storage.local.set({
        "user-store@store": {},
      });
      break;
    case "SAVE_PRODUCT_COPY":
      getToken().then((token) => {
        saveProductCopy(
          data?.tabID || sender.tab?.id,
          token,
          data?.data,
          data?.marketplaces,
          data?.isGetPriceAfterDiscount,
        ).then((res) => {
          sendResponse(res);
          if (res.code == "TOKEN_EXPIRED") {
            TOKEN = "";
            chrome.storage.local.set({
              "user-store@store": {},
            });
          }
        });
      });

      break;

    case "CHECK_PRODUCT_COPY_EXIST":
      getToken().then((token) => {
        checkProductCopyIdsExist(token, data?.ids).then((res) => {
          sendResponse(res);
        });
      });

      break;

    case "GET_SHOP_CONNECTED":
      if (shopConnected.length) {
        sendResponse(shopConnected);
      } else {
        getToken().then((token) => {
          getShopConnected(token).then((res) => {
            shopConnected = res;
            sendResponse(res);
          });
        });
      }
      break;

    case "GET_ALIEXPRESS_PRODUCT_IDS":
      let check = 0;
      function getProductIds() {
        const product = aliexpressProductIds.find((item) => item.id == data.id);
        if (product) {
          sendResponse(product);
        } else {
          check++;
          if (check < 10) {
            setTimeout(getProductIds, 1000);
          } else {
            sendResponse(null);
          }
        }
      }
      getProductIds();
      break;

    case "GET_ORDER":
      getToken().then((token) => {
        getOrder(token, data.orderSn).then((res) => {
          sendResponse(res);
        });
      });
      break;
    case "GET_PRODUCTS":
      getToken().then((token) => {
        getProducts(token, data.page).then((res) => {
          sendResponse(res);
        });
      });
      break;
    case "GET_SHIPXANH_ORDERS_BY_IDS":
      getToken().then((token) => {
        getShipXanhOrdersByIds(token, data.ids).then((res) => {
          sendResponse(res);
        });
      });
      break;
    case "SYNC_PRICE_BOOK":
      getToken().then((token) => {
        syncPriceBook(token, data.cogsList).then((res) => {
          sendResponse(res);
        });
      });
      break;

    case "GET_SHOPEE_PRODUCT_IDS":
      let checkShopee = 0;
      function getShopeeProductIds() {
        const product = shopeeProductIds.find((item) => item.id == data.id);
        if (product) {
          sendResponse(product);
        } else {
          checkShopee++;
          if (checkShopee < 10) {
            setTimeout(getShopeeProductIds, 1000);
          } else {
            sendResponse(null);
          }
        }
      }
      getShopeeProductIds();
      break;

    case "UPDATE_TOKEN_VTP":
      getToken().then((token) => {
        UpsertCarrierVTP(token, data.token).then((res) => {
          sendResponse(res);
        });
      });

      break;

    // case "GET_SHOPEE_SEARCH_ITEMS":
    //   sendResponse(
    //     shopeeSearchItems.filter((item) => item.tabId === sender.tab?.id),
    //   );
    //   // remove item from shopeeSearchItems
    //   shopeeSearchItems = shopeeSearchItems.filter(
    //     (item) => item.tabId !== sender.tab?.id,
    //   );
    //   break;
    case "SAVE_TIKTOK_COOKIE":
      if (tiktokCrawlCookie) {
        axios
          .post("https://api.shipxanh.com/api/common/set-tiktok-crawl-cookie", {
            cookie: tiktokCrawlCookie,
          })
          .then((res) => {
            sendResponse(res?.data);
          })
          .catch(() => {
            sendResponse(null);
          });
      } else {
        sendResponse(null);
      }
      break;

    default:
      break;
  }
  return true;
});

// listen click icon chrome action
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: "https://app.shipxanh.com",
    active: true,
  });
});

// lắng nghe tab thay đổi để render react content
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url && tab.url?.includes("tiktok.com")) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/contentScript/contentApp/index.tsx-loader.js"],
    });
  }
  if (changeInfo.status === "complete" || changeInfo.url) {
    chrome.tabs
      .sendMessage(tabId, {
        func: "TAB_UPDATED",
      })
      .catch((err) => {
        // Suppress errors about sending messages to tabs that aren't ready
      });
  }
});

// lắng nghe message từ web external
chrome.runtime.onMessageExternal.addListener(async function (request) {
  // if (request?.type == "LOGIN" && request?.token?.token) {
  //   signInWithCustomToken(auth, request.token.token).then(() => {
  //     // set focus to tabid
  // chrome.tabs.update(+request.tabId, {
  //   active: true,
  // });
  // chrome.tabs.reload(+request.tabId);
  //   });
  // }

  if (request?.type === "GET_TOKEN") {
    if (request.stsTokenManager) {
      // New format: full user credential
      const info = {
        "user-store@store": request,
      };
      TOKEN = request.stsTokenManager.accessToken;
      chrome.storage.local.set(info);
    } else if (request.rawToken) {
      // Legacy format (fallback)
      TOKEN = request.rawToken;
      const info = {
        "user-store@store": {
          displayName: request.displayName,
          photoURL: request.photoURL,
          token: TOKEN,
          uid: request.uid,
        },
      };
      chrome.storage.local.set(info);
    }

    chrome.tabs.update(+request.tabId, {
      active: true,
    });
    chrome.tabs.reload(+request.tabId);
  }
});

let timer: NodeJS.Timeout | undefined;

// Clean up timer and cancel all pending requests when extension is unloaded
chrome.runtime.onSuspend.addListener(() => {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
  cancelAllRequests();
  shopeeProductIds = [];
  shopeeSearchItems = [];
  requestDataCache = {};
});

// Memory optimization: Add size limits and cleanup
const MAX_PRODUCT_IDS = 100; // Limit product ID storage
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

let aliexpressProductIds: {
  id: string;
  url: string;
}[] = [];

// lắng nghe webRequest
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const query = details.url.split("?")[1];
    const queryData = new URLSearchParams(query);
    const data = JSON.parse(queryData.get("data") || "{}");
    const id = data?.productId || data?.id;
    if (id) {
      // update or create product id
      const product = aliexpressProductIds.find((item) => item.id == id);
      if (product) {
        product.url = details.url;
      } else {
        aliexpressProductIds.push({
          id,
          url: details.url,
        });

        // Immediate cleanup if array gets too large
        if (aliexpressProductIds.length > MAX_PRODUCT_IDS) {
          aliexpressProductIds = aliexpressProductIds.slice(-MAX_PRODUCT_IDS);
        }
      }
    }
  },
  {
    urls: [
      "*://*.aliexpress.com/h5/mtop.aliexpress.pdp.pc.query/*",
      "*://*.taobao.com/h5/mtop.taobao.pcdetail.data.get/*",
    ],
  },
);

let shopeeProductIds: {
  id: string;
  shopid: string;
  url: string;
  headers: Record<string, string>;
}[] = [];

let shopeeSearchItems: {
  tabId: number;
  url: string;
  headers: Record<string, string>;
}[] = [];

// Add cleanup function for product arrays to prevent memory leaks
function cleanupProductArrays() {
  // Keep only the most recent entries to prevent unlimited growth
  if (aliexpressProductIds.length > MAX_PRODUCT_IDS) {
    aliexpressProductIds = aliexpressProductIds.slice(-MAX_PRODUCT_IDS);
  }

  if (shopeeProductIds.length > MAX_PRODUCT_IDS) {
    shopeeProductIds = shopeeProductIds.slice(-MAX_PRODUCT_IDS);
  }

  if (shopeeSearchItems.length > MAX_PRODUCT_IDS) {
    shopeeSearchItems = shopeeSearchItems.slice(-MAX_PRODUCT_IDS);
  }
}

// Add periodic cleanup to prevent memory accumulation
const cleanupTimer = setInterval(cleanupProductArrays, CLEANUP_INTERVAL);

// Memory monitoring function for debugging (can be removed in production)
function logMemoryUsage() {
  console.log("ShipXanh Extension Memory Usage:", {
    aliexpressProductIds: aliexpressProductIds.length,
    shopeeProductIds: shopeeProductIds.length,
    shopeeSearchItems: shopeeSearchItems.length,
    requestDataCache: Object.keys(requestDataCache).length,
    shopConnected: shopConnected.length,
    cacheKeys: cacheKeys.length,
  });
}

// Log memory usage every 5 minutes for monitoring
const memoryMonitorTimer = setInterval(logMemoryUsage, 5 * 60 * 1000);

function sendDataToTab(data: Object) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, data);
    }
  });
}

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.url.includes("shopee")) {
      // shopee detail product

      if (
        /api\/v4\/pdp\/get_pc?/.test(details.url) ||
        /api\/v4\/pdp\/get_rw?/.test(details.url)
      ) {
        try {
          const url = new URL(details.url);
          const params = new URLSearchParams(url.search);
          const shopid = params.get("shop_id");
          const itemid = params.get("item_id");

          const headers = getHeaders(details.requestHeaders);

          if (shopid && itemid) {
            // Update or create product id
            const product = shopeeProductIds.find(
              (item) => item.id === itemid && item.shopid === shopid,
            );

            if (product) {
              product.url = details.url;
              product.headers = headers;
            } else {
              shopeeProductIds.push({
                id: itemid,
                shopid: shopid,
                url: details.url,
                headers: headers,
              });

              // Immediate cleanup if array gets too large
              if (shopeeProductIds.length > MAX_PRODUCT_IDS) {
                shopeeProductIds = shopeeProductIds.slice(-MAX_PRODUCT_IDS);
              }
            }
          }
        } catch (error) {
          console.error("Error parsing Shopee product details:", error);
        }
      }

      if (details.url.includes("/api/v4/search/search_items")) {
        const headers = getHeaders(details.requestHeaders);
        if (!headers["from-sx"]) {
          const url = details.url;

          // send message to current tab active
          setTimeout(() => {
            sendDataToTab({
              func: "SHOPEE_SEARCH_ITEMS",
              url,
              headers,
              method: details.method,
            });
          }, 3000);
        }
      }
    }
  },
  {
    urls: [
      "*://shopee.vn/api/v4/pdp/*",
      "*://shopee.com/api/v4/pdp/*",
      "*://shopee.com.my/api/v4/pdp/*",
      "*://shopee.co.id/api/v4/pdp/*",
      "*://shopee.co.th/api/v4/pdp/*",
      "*://shopee.ph/api/v4/pdp/*",
      "*://shopee.com.ph/api/v4/pdp/*",
      "*://shopee.sg/api/v4/pdp/*",
      "*://shopee.com.sg/api/v4/pdp/*",
      "*://shopee.tw/api/v4/pdp/*",
      "*://shopee.com.tw/api/v4/pdp/*",
      "*://shopee.vn/api/v4/search/search_items?*",
      "*://shopee.com/api/v4/search/search_items?*",
      "*://shopee.com.my/api/v4/search/search_items?*",
      "*://shopee.co.id/api/v4/search/search_items?*",
      "*://shopee.co.th/api/v4/search/search_items?*",
      "*://shopee.ph/api/v4/search/search_items?*",
      "*://shopee.com.ph/api/v4/search/search_items?*",
      "*://shopee.sg/api/v4/search/search_items?*",
      "*://shopee.com.sg/api/v4/search/search_items?*",
      "*://shopee.tw/api/v4/search/search_items?*",
      "*://shopee.com.tw/api/v4/search/search_items?*",
    ],
    types: ["xmlhttprequest"],
  },
  ["requestHeaders", "extraHeaders"],
);

// Cache to temporarily store request data
interface RequestData {
  url: string;
  headers?: Record<string, string>;
  body?: any;
  method?: string;
  timestamp: number;
}

// Improved cache with size limit and better memory management
const MAX_CACHE_SIZE = 20; // Reduced from 50 to 20 for better memory usage
const MAX_CACHE_AGE_MS = 3000; // Reduced from 5000 to 3000ms for faster cleanup
let requestDataCache: Record<string, RequestData> = {};
let cacheKeys: string[] = []; // Track keys in order of addition for FIFO removal

// Function to generate a unique key for a request
function getRequestKey(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname + urlObj.search;
}

// Add entry to cache with size management
function addToCacheWithSizeLimit(key: string, data: RequestData): void {
  // If key already exists, just update it
  if (requestDataCache[key]) {
    requestDataCache[key] = data;
    return;
  }

  // If cache is full, remove oldest entry
  if (cacheKeys.length >= MAX_CACHE_SIZE) {
    const oldestKey = cacheKeys.shift();
    if (oldestKey) delete requestDataCache[oldestKey];
  }

  // Add new entry
  requestDataCache[key] = data;
  cacheKeys.push(key);
}

// Function to send combined data and clean cache
function processCachedRequest(key: string) {
  const data = requestDataCache[key];
  if (data) {
    // Only send if we have at least headers or body
    if (data.headers || (data.method === "POST" && data.body)) {
      setTimeout(() => {
        sendDataToTab({
          func: "SHOPEE_RCMD_ITEMS",
          url: data.url,
          headers: data.headers,
          body: data.body,
          method: data.method,
        });
      }, 2000);
    }
    // Clean up cache
    deleteCacheEntry(key);
  }
}

// Helper to safely delete cache entry
function deleteCacheEntry(key: string): void {
  delete requestDataCache[key];
  cacheKeys = cacheKeys.filter((k) => k !== key);
}

// Clean all expired cache entries
function cleanExpiredCache(): void {
  const now = Date.now();
  const keysToRemove: string[] = [];

  cacheKeys.forEach((key) => {
    if (now - requestDataCache[key].timestamp > MAX_CACHE_AGE_MS) {
      keysToRemove.push(key);
    }
  });

  // Remove expired entries
  keysToRemove.forEach((key) => {
    deleteCacheEntry(key);
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.includes("/api/v4/shop/rcmd_items")) {
      const key = getRequestKey(details.url);

      // Initialize or update cache entry
      if (!requestDataCache[key]) {
        addToCacheWithSizeLimit(key, {
          url: details.url,
          timestamp: Date.now(),
        });
      }

      if (details.requestBody && details.requestBody.raw) {
        const decoder = new TextDecoder("utf-8");
        const rawData = details.requestBody.raw[0];
        if (rawData) {
          const bodyString = decoder.decode(rawData.bytes);
          try {
            const bodyJson = JSON.parse(bodyString);
            requestDataCache[key].body = bodyJson;
            requestDataCache[key].method = details.method;

            // Schedule processing after a delay to allow headers to be collected
            setTimeout(() => {
              processCachedRequest(key);
            }, 500);
          } catch (e) {
            // Not valid JSON
            deleteCacheEntry(key); // Clean up on error
          }
        }
      }
    }
  },
  {
    urls: [
      "*://shopee.vn/api/v4/shop/rcmd_items",
      "*://shopee.com/api/v4/shop/rcmd_items",
      "*://shopee.com.my/api/v4/shop/rcmd_items",
      "*://shopee.co.id/api/v4/shop/rcmd_items",
      "*://shopee.co.th/api/v4/shop/rcmd_items",
      "*://shopee.ph/api/v4/shop/rcmd_items",
      "*://shopee.com.ph/api/v4/shop/rcmd_items",
      "*://shopee.sg/api/v4/shop/rcmd_items",
      "*://shopee.com.sg/api/v4/shop/rcmd_items",
      "*://shopee.tw/api/v4/shop/rcmd_items",
      "*://shopee.com.tw/api/v4/shop/rcmd_items",
    ],
  },
  ["requestBody"],
);

// Add listener for headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.url.includes("/api/v4/shop/rcmd_items")) {
      // Create a headers object
      const headers: Record<string, string> = {};
      details.requestHeaders?.forEach((header) => {
        if (header.name && header.value) {
          headers[header.name] = header.value;
        }
      });
      if (!headers["from-sx"]) {
        const key = getRequestKey(details.url);

        // Initialize or update cache entry
        if (!requestDataCache[key]) {
          addToCacheWithSizeLimit(key, {
            url: details.url,
            timestamp: Date.now(),
          });
        }
        requestDataCache[key].headers = headers;
        requestDataCache[key].method = details.method;
      }
    }

    if (details.url.includes("/view/product/")) {
      const cookie = details.requestHeaders?.find(
        (item) => item.name === "Cookie",
      );

      if (cookie) {
        tiktokCrawlCookie = cookie.value || "";

        // // Fix: Direct reference to the document in the COMMON_DATA collection
        // const configRef = doc(firestore, "COMMON_DATA", "product-copy-configs");
        // setDoc(
        //   configRef,
        //   {
        //     tiktok_crawl_cookie: cookieData,
        //   },
        //   { merge: true },
        // ).then(() => {});
      }
    }
  },
  {
    urls: [
      "*://shopee.vn/api/v4/shop/rcmd_items",
      "*://shopee.com/api/v4/shop/rcmd_items",
      "*://shopee.com.my/api/v4/shop/rcmd_items",
      "*://shopee.co.id/api/v4/shop/rcmd_items",
      "*://shopee.co.th/api/v4/shop/rcmd_items",
      "*://shopee.ph/api/v4/shop/rcmd_items",
      "*://shopee.com.ph/api/v4/shop/rcmd_items",
      "*://shopee.sg/api/v4/shop/rcmd_items",
      "*://shopee.com.sg/api/v4/shop/rcmd_items",
      "*://shopee.tw/api/v4/shop/rcmd_items",
      "*://shopee.com.tw/api/v4/shop/rcmd_items",
    ],
  },
  ["requestHeaders", "extraHeaders"],
);

// Clean expired cache entries more aggressively for better memory management
const cacheCleanupInterval = setInterval(cleanExpiredCache, 1000);

// Enhanced cleanup when extension is unloaded to prevent memory leaks
chrome.runtime.onSuspend.addListener(() => {
  // Clear all timers
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }

  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  if (memoryMonitorTimer) {
    clearInterval(memoryMonitorTimer);
  }

  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }

  // Clear all arrays to free memory
  aliexpressProductIds = [];
  shopeeProductIds = [];
  shopeeSearchItems = [];
  shopConnected = [];

  // Clear all cache entries
  Object.keys(requestDataCache).forEach((key) => {
    delete requestDataCache[key];
  });
  cacheKeys = [];
  requestDataCache = {};

  cancelAllRequests();
});

try {
  // Import any background scripts here
  import("./background.function");

  // Add error handling for chrome runtime connections
  chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError) {
        console.error("Connection error:", chrome.runtime.lastError);
      }
    });
  });
} catch (error) {
  console.error("Error initializing service worker:", error);
}

export const initializeEcommerBackground = () => {
  console.log("🛡️ E-Commerce Platform: Dedicated Background initialized.");
};

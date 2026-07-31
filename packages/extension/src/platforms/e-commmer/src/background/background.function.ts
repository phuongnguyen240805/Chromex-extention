// @ts-nocheck
import axios, { AxiosRequestConfig, CancelTokenSource } from "axios";
const SHIPXANH_HOST = "https://api.shipxanh.com";
const SHIPXANH_HOST_PROD = "https://prod-api.shipxanh.com";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 15000;

// Store for active request cancellation tokens
const activeCancelTokens: Record<string, CancelTokenSource> = {};

// Helper to create a request with cancellation and timeout
function createRequest(url: string, options: AxiosRequestConfig = {}) {
  // Cancel any existing request to the same URL
  if (activeCancelTokens[url]) {
    activeCancelTokens[url].cancel("Request superseded by newer request");
  }

  // Create a new cancellation token
  const source = axios.CancelToken.source();
  activeCancelTokens[url] = source;

  // Set timeout and cancellation token
  const config: AxiosRequestConfig = {
    ...options,
    timeout: REQUEST_TIMEOUT,
    cancelToken: source.token,
  };

  // Return the request promise and cleanup function
  return {
    request: axios(url, config),
    cleanup: () => {
      delete activeCancelTokens[url];
    },
  };
}

export async function checkProductCopyIdsExist(token: string, ids: string) {
  const url = `${SHIPXANH_HOST}/api/products-copy/check-exist?ids=${ids}`;
  const { request, cleanup } = createRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data || [];
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function getShopConnected(token: string) {
  const url = `${SHIPXANH_HOST_PROD}/inventory/shops/connected`;
  const { request, cleanup } = createRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data?.items || [];
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function getOrder(token: string, orderSn: string) {
  const orderUrl = `${SHIPXANH_HOST_PROD}/inventory/orders/find?orderSn=${orderSn}`;
  const { request: orderRequest, cleanup: cleanupOrder } = createRequest(
    orderUrl,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  try {
    const res = await orderRequest;
    cleanupOrder();

    const order = res?.data?.data;

    if (order.id) {
      const financeUrl = `${SHIPXANH_HOST_PROD}/inventory/order_finance/${order.id}`;
      const { request: financeRequest, cleanup: cleanupFinance } =
        createRequest(financeUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      try {
        const resFinance = await financeRequest;
        cleanupFinance();
        order.finance = resFinance?.data?.data || {};
      } catch (financeError) {
        cleanupFinance();
        console.error("Failed to get finance data:", financeError);
        order.finance = {};
      }
    }

    return order;
  } catch (error: any) {
    cleanupOrder();
    console.error(error);
    return "";
  }
}

export async function saveProductCopy(
  tabID: string,
  token: string,
  product: any,
  copy_to: string[],
  is_sale_price: boolean,
) {
  const url = `${SHIPXANH_HOST}/api/products-copy?key=${product.itemid}`;
  const { request, cleanup } = createRequest(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      products: [
        {
          origin_shop: product.origin_shop,
          origin_url: product.origin_url,
          data: {
            errors: [],
            ...product,
          },
          shipxanh_config: {
            division_price: false,
            copy_to,
            is_sale_price,
          },
        } as any,
      ],
    },
  });

  try {
    const res = await request;
    cleanup();
    sendNotification("success", "Product copy saved success", res.data, tabID);

    return {
      success: true,
      data: res.data?.data,
    };
  } catch (error: any) {
    cleanup();
    console.error(error);
    let code = error.response?.data?.code;
    let message =
      error.response?.data?.message || "Failed to save product copy";
    if (message.includes("require authenticated")) {
      message =
        "Hết hạn đăng nhập, hãy bấm đăng xuất ở góc dưới bên trái và đăng nhập lại";
      code = "TOKEN_EXPIRED";
    }
    sendNotification("error", message, error.response?.data, tabID);
    return {
      success: false,
      message,
      code,
    };
  }
}

export async function getShipXanhOrdersByIds(token: string, ids: string) {
  const url = `${SHIPXANH_HOST_PROD}/inventory/orders/list_by_ids?ids=${ids}`;
  const { request, cleanup } = createRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data || [];
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function getProducts(token: string, page: number) {
  const url = `${SHIPXANH_HOST_PROD}/inventory/products?searchTerm=&page=${page}&size=200`;
  const { request, cleanup } = createRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data;
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function syncPriceBook(token: string, cogsList: any[]) {
  const url = `${SHIPXANH_HOST_PROD}/inventory/products/update_cost_of_goods_sold`;
  const { request, cleanup } = createRequest(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      cogsList,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data;
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function UpsertCarrierVTP(token: string, tokenVTP: string) {
  const url = `${SHIPXANH_HOST}/api/shipment-carrier`;
  const { request, cleanup } = createRequest(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      id: "Viettel_Post",
      carrier_name: "Viettel_Post",
      auth: {
        key: tokenVTP,
      },
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data?.data;
  } catch (error: any) {
    cleanup();
    console.error(error);
    return [];
  }
}

export async function refreshFirebaseToken(
  refreshToken: string,
  apiKey: string,
) {
  const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
  const { request, cleanup } = createRequest(url, {
    method: "POST",
    data: {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
  });

  try {
    const res = await request;
    cleanup();
    return res.data;
  } catch (error: any) {
    cleanup();
    console.error("Firebase token refresh failed:", error);
    throw error;
  }
}


// Cleanup function to be called when extension is unloaded
export function cancelAllRequests() {
  Object.values(activeCancelTokens).forEach((source) => {
    source.cancel("Extension unloaded");
  });
}

export function sendNotification(
  type: string,
  message: string,
  response?: any,
  tabID?: string,
) {
  console.log("sendNotification", tabID);

  chrome.runtime.sendMessage({
    func: "NOTI",
    params: {
      type,
      message,
      response,
    },
    tabID,
  });
}

export function sendMessageToCurrentTab(message: any, tabID?: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length) {
      chrome.tabs.sendMessage((tabID ? +tabID : tabs[0].id) as number, message);
    }
  });
}

export function getHeaders(requestHeaders?: chrome.webRequest.HttpHeader[]) {
  // Convert headers array to object for easier access
  const headers: Record<string, string> = {};
  requestHeaders?.forEach((header) => {
    if (header.name && header.value) {
      headers[header.name.toLowerCase()] = header.value;
    }
  });
  return headers;
}

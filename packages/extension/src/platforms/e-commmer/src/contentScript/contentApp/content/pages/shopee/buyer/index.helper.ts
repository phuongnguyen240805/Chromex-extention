import { uniq } from "lodash";
import { sendMessageToBackground } from "../../../../../../SHARED/common/states/common";

export const getItemIdShopId = (pathname: string) => {
  const match =
    pathname.match(/\-i\.(\d+)\.(\d+)/) ||
    pathname.match(/\/product\/(\d+)\/(\d+)/);

  if (match) {
    return {
      shopId: match[1],
      itemId: match[2],
    };
  }
  return {
    shopId: "",
    itemId: "",
  };
};

export const getItemInfo = async (pathname?: string) => {
  pathname = pathname || window.location.pathname;
  const { shopId, itemId } = getItemIdShopId(pathname);
  const id = `${itemId}-${shopId}`;
  const queryString = new URLSearchParams("");
  queryString.set("sx-a", "true");
  queryString.set("sx-cl", "true");
  const url = `https://${`${window.location.host}/${pathname}`.replace("//", "/")}?${queryString.toString()}`;
  console.log("url", url);

  sendMessageToBackground("OPEN_TAB", {
    url,
  });
  console.log("id", id, url);

  const item = await new Promise((r) => {
    const channel = new BroadcastChannel("sx-crx-channel");
    const timer = setTimeout(() => {
      r(null);
      channel.close();
    }, 10000);

    channel.onmessage = (e) => {
      console.log("Received", e.data);
      const { type, data } = e.data;
      if (type == "sx-product-shopee") {
        if (data?.id == id) {
          r(JSON.parse(data.data));
          channel.close();
          clearTimeout(timer);
        }
      }
    };
  });

  // const item = await getDataFromSessionStorage(id);
  if (!item) {
    alert("Không tìm thấy thông tin sản phẩm");
    throw new Error("not found item info");
  }
  return convertRawShopee(item);
};

export function convertRawShopee(raw: any) {
  const categories = raw?.item?.categories || [];
  let cate = categories.length
    ? `${categories[categories.length - 1]?.catid || ""} - ${categories
        .map((x: any) => x.display_name)
        .join(" > ")}`
    : "";
  const divince = 100000;
  const videoId = raw?.product_images?.video?.video_id;
  console.log("convertRawShopee raw payload:", raw);

  let dataRaw = {
    discount: (raw?.item?.raw_discount || 0) + "%",
    ctime: raw?.item?.ctime || Math.floor(Date.now() / 1000),
    itemid: raw?.item?.item_id || "",
    shipxanh_sku: "",
    shipxanh_weight: 100,
    shipxanh_width: 1,
    shipxanh_length: 1,
    shipxanh_height: 1,
    shipxanh_include_video: !!videoId,
    origin_cate: cate,
    current_cate: cate,
    name: raw?.item?.title || "",
    description: raw?.item?.description || "",
    origin_shop: raw?.shop_detailed?.name || "",
    price: +(raw?.item?.price || 0) / divince,
    video_info_list: videoId
      ? [
          {
            ...(raw?.product_images?.video || {}),
            video_id: `https://cvf.${window.location.hostname}/file/${videoId}`,
            video_url: `https://cvf.${window.location.hostname}/file/${videoId}`,
          },
        ]
      : [],
    current_brand: {
      name: raw?.item?.brand || "",
      id: raw?.item?.brand_id || 0,
    },
    stock: raw?.item?.normal_stock || 0,
    shopid: raw?.shop_detailed?.shopid || raw?.item?.shopid || "",

    images: uniq([
      ...(raw?.product_images?.images || []),
      ...(raw?.product_images?.long_images || []),
    ]),
    categories,
    attributes:
      ((raw?.item?.attributes || [])
        ?.filter((x: any) => x?.id)
        ?.map((x: any) => {
          return {
            id: x.id,
            value: [
              {
                id: x.val_id,
                name: x.value,
              },
            ],
          };
        }) as any) || [],
    targets: ["0"],
    tier_variations: raw?.item?.tier_variations || [],
    models: (raw?.item?.models || []).map((x: any) => ({
      ...x,
      itemid: x.item_id,
      modelid: x.model_id,
      promotionid: x.promotion_id,
      price: +(x.price || 0) / divince,
      price_before_discount: +(x.price_before_discount || x.price || 0) / divince,
      stock: x.stock === null ? 1000 : x.stock || 0,
    })) as any,
    item_rating: raw?.item?.item_rating || null,
    sold: raw?.product_review?.historical_sold || 0,
    liked_count: raw?.product_review?.liked_count || 0,
    rich_text_description: raw?.item?.rich_text_description || "",
    origin_url: "",
  };

  dataRaw.origin_url = `https://${window.location.hostname}/product/${dataRaw.shopid}/${dataRaw.itemid}`;

  return dataRaw;
}

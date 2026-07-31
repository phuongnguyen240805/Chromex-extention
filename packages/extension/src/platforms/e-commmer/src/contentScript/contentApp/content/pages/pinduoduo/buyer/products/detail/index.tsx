import { useDebounceEffect, useUpdateEffect } from "ahooks";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import { useState } from "react";
import {
  mapTiersToModels,
  stripHtmlExceptImg,
} from "../../../../../common/services/helper";
import { checkProductCopyExist } from "../../../../../../../../SHARED/utils/helper";
import { select } from "@ngneat/elf";
import { GlobalConfigsStore } from "../../../../../../../../SHARED/common/states/index.state";
import { useObservable } from "@ngneat/react-rxjs";
import { CopyListingStore } from "../../../../../../../../SHARED/common/components/copy-listing/index.state";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useMessage } from "../../../../../../app";
import { Button, Col, Row, Spin, Tabs } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import CopyListingForm from "../../../../../../../../SHARED/common/components/copy-listing";
import ProductCopyResultExist from "../../../../../../../../SHARED/common/components/copy-listing/ResultExist";
import { useTranslation } from "react-i18next";

function extractPinduoduoData(): any | null {
  // Try to extract from window.rawData (common Pinduoduo pattern)
  if ((window as any).rawData) {
    return (window as any).rawData;
  }

  // Try to extract JSON from <script> tags
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const text = script.textContent || "";

    // Pattern: window.rawData = {...}
    if (text.includes("window.rawData")) {
      const match = text.match(/window\.rawData\s*=\s*(\{[\s\S]*?\});/);
      if (match?.[1]) {
        try {
          return JSON.parse(match[1]);
        } catch (e) {
          console.error("Failed to parse rawData JSON:", e);
        }
      }
    }

    // Pattern: window.__INITIAL_STATE__ or similar
    if (text.includes("__INITIAL_STATE__")) {
      const match = text.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
      if (match?.[1]) {
        try {
          return JSON.parse(match[1]);
        } catch (e) {
          console.error("Failed to parse __INITIAL_STATE__ JSON:", e);
        }
      }
    }
  }

  return null;
}

function convertImageUrl(img: string): string {
  if (img.startsWith("//")) {
    img = "https:" + img;
  }
  return img;
}

async function convertRawToProduct(raw: any) {
  console.log("Pinduoduo raw data:", raw);

  // Extract goods info - Pinduoduo stores data in store.goods or initDataObj.goods
  const goods =
    raw?.store?.initDataObj?.goods ||
    raw?.goods ||
    raw?.initDataObj?.goods ||
    raw?.data?.goods;

  const goodsId =
    goods?.goodsId ||
    goods?.goods_id ||
    new URLSearchParams(window.location.search).get("goods_id") ||
    raw?.store?.initDataObj?.goodsId ||
    "";

  const mallInfo =
    raw?.store?.initDataObj?.mall ||
    raw?.mall ||
    raw?.initDataObj?.mall ||
    raw?.data?.mall;

  const images: string[] = (
    goods?.topGallery ||
    goods?.gallery ||
    goods?.topGalleryV2 ||
    goods?.detailGallery ||
    []
  ).map((img: any) => {
    const url = typeof img === "string" ? img : img?.url || img?.src || "";
    return convertImageUrl(url);
  });

  console.log(goods, mallInfo, images);

  const data: any = {
    itemid: goodsId,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 0,
    shipxanh_length: 0,
    shipxanh_height: 0,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: goods?.goodsName || goods?.goods_name || "",
    description: "",
    short_description: "",
    origin_url: location.href,
    origin_shop:
      mallInfo?.mallName || mallInfo?.mall_name || goods?.mallID || "pindoudou",
    price: 0,
    video_info_list: [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: 0,
    shopid: mallInfo?.mallId || mallInfo?.mall_id || "",
    images,
    categories: [],
    attributes: [],
    targets: ["0"],
    from_seller: true,
    valid_to_copy: false,
    errors: ["yup.current_cate.required"],
    tier_variations: [],
    models: [],
    seller_attributes: [],
    size_chart_image: null,
    size_chart_type: null,
    source: "pinduoduo",
  };

  // Extract SKU / tier variations from skus
  const skus: any[] =
    goods?.skus ||
    goods?.sku ||
    goods?.skuList ||
    goods?.sku_list ||
    raw?.skus ||
    [];

  if (skus.length > 0) {
    // Build tier_variations by grouping spec_key -> unique spec_values from all SKUs
    const tierMap = new Map<
      string,
      { name: string; optionsMap: Map<string, string> }
    >();

    for (const sku of skus) {
      for (const spec of sku.specs || []) {
        const key = spec.spec_key;
        if (!tierMap.has(key)) {
          tierMap.set(key, { name: key, optionsMap: new Map() });
        }
        const tier = tierMap.get(key)!;
        const valueId = String(spec.spec_value_id);
        if (!tier.optionsMap.has(valueId)) {
          tier.optionsMap.set(valueId, spec.spec_value);
        }
      }
    }

    // Convert tierMap to tiers array
    const tiers = Array.from(tierMap.values()).map((tier) => ({
      name: tier.name,
      options: Array.from(tier.optionsMap.values()),
      images: [] as string[],
    }));

    // Attach thumbUrl images to the first tier (one image per unique option)
    if (tiers.length > 0) {
      const firstTierKey = Array.from(tierMap.keys())[0];
      const seenValues = new Set<string>();
      for (const sku of skus) {
        const firstSpec = (sku.specs || []).find(
          (s: any) => s.spec_key === firstTierKey,
        );
        if (
          firstSpec &&
          sku.thumbUrl &&
          !seenValues.has(String(firstSpec.spec_value_id))
        ) {
          seenValues.add(String(firstSpec.spec_value_id));
          tiers[0].images.push(convertImageUrl(sku.thumbUrl));
        }
      }
    }

    if (tiers.length > 2) {
      tiers.length = 2;
    }
    tiers.sort((a: any, b: any) => b.images.length - a.images.length);

    // Build models from each SKU
    const models = skus.map((sku: any) => ({
      price: parseFloat(sku.groupPrice) || parseFloat(sku.normalPrice) || 0,
      price_before_discount: parseFloat(sku.normalPrice) || 0,
      stock: sku.quantity || 0,
      name: (sku.specs || []).map((s: any) => s.spec_value).join(","),
    }));

    data.tier_variations = tiers;
    data.models = models;
  }

  console.log("Pinduoduo converted product:", data);
  return data;
}

function PinduoduoBuyerProductsDetail({ pathname }: { pathname: string }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exist, setExist] = useState<{ id: any; copy_to: any }[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [detailProductActiveTab] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
  );
  const showMessage = useMessage();
  const { t } = useTranslation();

  useUpdateEffect(() => {
    const { itemid, shopid } = product;
    checkProductCopyExist(itemid, shopid).then((res) => {
      setExist(res);
    });
  }, [product]);

  useDebounceEffect(
    () => {
      const raw = extractPinduoduoData();
      if (raw) {
        convertRawToProduct(raw).then((data) => {
          setProduct(data);
        });
      } else {
        console.warn(
          "Pinduoduo: Could not extract product data from page. Check console for available script data.",
        );
        // Log all script contents for debugging
        const scripts = document.querySelectorAll("script");
        scripts.forEach((s, i) => {
          const text = s.textContent || "";
          if (text.length > 100 && text.length < 50000) {
            console.log(`Script[${i}] preview:`, text.substring(0, 300));
          }
        });
      }
    },
    [pathname],
    {
      wait: 1000,
    },
  );

  const onSaveProduct = async () => {
    try {
      setLoading(true);
      const { marketplaces, isGetPriceAfterDiscount } = CopyListingStore.query(
        (s) => s,
      );
      const res = await sendMessageToBackground("SAVE_PRODUCT_COPY", {
        data: product,
        marketplaces,
        isGetPriceAfterDiscount,
      });

      if (res.success) {
        setLoading(false);
        const { itemid, shopid } = product;
        checkProductCopyExist(itemid, shopid, true).then((res) => {
          setExist(res);
        });
        setIsDone(true);
        showMessage({
          type: "success",
          content: t("success_open_pending_list"),
        });
      } else throw new Error(res.message);
    } catch (error) {
      showMessage({
        type: "error",
        content:
          error instanceof Error ? error.message : "Lỗi, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImages = async () => {
    setLoading(true);
    try {
      if (product) {
        const images = product.images;

        let classifies: {
          name: string;
          images: string[];
        }[] = [];

        if (product.tier_variations?.[0]?.images?.length) {
          classifies = product.tier_variations?.[0]?.options?.map(
            (x: any, i: string | number) => {
              const image = product.tier_variations?.[0]?.images?.[i];
              return {
                name: x,
                images: image ? [image] : [],
              };
            },
          );
        }

        // download images and classifies images as zip
        const zip = new JSZip();

        for (const i in images) {
          const url = images[i];
          try {
            const img = await fetch(url);
            const imgBlob = await img.blob();
            const contentType = img.headers.get("content-type");
            let extension = contentType?.split("/")[1];
            if (!["png", "jpg", "jpeg"].includes(extension || "")) {
              extension = "jpg";
            }
            const filename = `${+i + 1}.${extension || "jpg"}`;
            zip.file(filename, imgBlob);
          } catch (error) {
            console.error(`Failed to fetch image at ${url}`, error);
          }
        }

        for (const ii in classifies) {
          const classify = classifies[ii];
          if (!classify.images.length) continue;
          const folder = zip.folder(classify.name);
          for (const j in classify.images) {
            try {
              const url = classify.images[j];

              const img = await fetch(url);
              const imgBlob = await img.blob();
              const contentType = img.headers.get("content-type");
              let extension = contentType?.split("/")[1];
              if (!["png", "jpg", "jpeg"].includes(extension || "")) {
                extension = "jpg";
              }
              const filename = `${+j + 1}.${extension || "jpg"}`;
              folder?.file(filename, imgBlob);
            } catch (error) {
              console.error(`Failed to fetch image at ${j}`, error);
            }
          }
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${product.name || "pinduoduo-product-images"}.zip`);
      }
    } catch (error) {
      showMessage({
        type: "error",
        content:
          error instanceof Error ? error.message : "Lỗi, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {product ? (
        <Tabs
          activeKey={detailProductActiveTab}
          size="small"
          onChange={(key) => {
            GlobalConfigsStore.update((s) => ({
              ...s,
              content: {
                ...s.content,
                detailProductActiveTab: key,
              },
            }));
          }}
          items={[
            {
              key: "copy",
              label: t("copy_product"),
              icon: <CopyOutlined />,
              children: (
                <>
                  <CopyListingForm
                    isDone={isDone}
                    outlineBtn={exist.length > 0}
                    loading={loading}
                    onSave={() => {
                      onSaveProduct();
                    }}
                  />
                  {exist.length > 0 && (
                    <>
                      <ProductCopyResultExist exist={exist} />
                    </>
                  )}
                </>
              ),
            },
            {
              key: "download",
              label: t("download_video_images"),
              icon: <DownloadOutlined />,
              children: (
                <Spin spinning={loading}>
                  <Row gutter={4}>
                    <Col span={24}>
                      <Button
                        block
                        icon={<PictureOutlined />}
                        color="primary"
                        variant="solid"
                        onClick={() => {
                          downloadImages();
                        }}
                      >
                        {t("download_images")}
                      </Button>
                    </Col>
                  </Row>
                </Spin>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}

export default PinduoduoBuyerProductsDetail;

import { useEffect, useState } from "react";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import axios from "axios";
import { Button, Col, Row, Spin } from "antd";
import { GlobalConfigsStore } from "../../../../../../../../SHARED/common/states/index.state";
import { useMessage } from "../../../../../../app";
import { useObservable } from "@ngneat/react-rxjs";
import { select } from "@ngneat/elf";
import { Tabs } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import CopyListingForm from "../../../../../../../../SHARED/common/components/copy-listing";
import ProductCopyResultExist from "../../../../../../../../SHARED/common/components/copy-listing/ResultExist";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getInnerHTMLFromSelector } from "../../../../../common/services/helper";
import { useDebounceEffect, useUpdateEffect } from "ahooks";
import { checkProductCopyExist } from "../../../../../../../../SHARED/utils/helper";
import { CopyListingStore } from "../../../../../../../../SHARED/common/components/copy-listing/index.state";
import { useTranslation } from "react-i18next";

function convertRawToProduct(raw: any) {
  const { subject, productInfo } = raw.GLOBAL_DATA.globalData;
  const desc =
    getInnerHTMLFromSelector(
      "div#product-description .detail-desc-decorate-richtext",
    ) || "";
  const { storeName, sellerInfo } = raw.SHOP_CARD_PC;
  const { imagePathList } = raw.HEADER_IMAGE_PC;
  const { skuProperties, skuPaths } = raw.SKU;
  const data: any = {
    itemid: productInfo.productId,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 1,
    shipxanh_length: 1,
    shipxanh_height: 1,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: subject.replace(" - AliExpress", "").replace("AliExpress", ""),
    description: desc,
    short_description: "",
    origin_url: productInfo.detailUrl,
    origin_shop: storeName,
    price: 0,
    video_info_list: [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: 0,
    shopid: sellerInfo.storeNum,
    images: imagePathList,
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
    source: "aliexpress",
  };
  let tiers: any[] = [];
  skuProperties.forEach((skuProp: any) => {
    const name = skuProp.skuPropertyName;
    const values = skuProp.skuPropertyValues;
    tiers.push({
      name,
      images: values
        .map((x: any) => x.skuPropertyImagePath)
        .filter((x: any) => x?.length),
      options: values.map((x: any) => x.propertyValueName),
    });
  });
  data.tier_variations = tiers;

  let models: any[] = [];

  skuPaths.forEach((item: any) => {
    let name: any = [];
    const path = item.path;
    path.split(";").forEach((x: any) => {
      const [tierId, optionId] = x.split(":");
      const tier = skuProperties.find((y: any) => +y.skuPropertyId === +tierId);
      const option = tier?.skuPropertyValues.find(
        (y: any) => +y.propertyValueIdLong === +optionId,
      );
      if (option) name.push(option.propertyValueName);
    });
    const priceData = raw.PRICE.skuIdStrPriceInfoMap[item.skuIdStr];
    const match = priceData?.salePriceLocal?.match(/\|(\d+)\|/);
    const salePrice = match?.[1] || 0;
    const originalPrice = priceData?.originalPrice?.value || 0;

    const obj = {
      name: name.join(","),
      sku: item.skuIdStr,
      stock: 1000,
      price: +salePrice,
      price_before_discount: +originalPrice,
    };
    models.push(obj);
  });
  data.models = models;

  return data;
}

function AliexpressProductDetail(props: { pathname: string }) {
  const { pathname } = props;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exist, setExist] = useState<{ id: any; copy_to: any }[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [detailProductActiveTab] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
  );
  const { t } = useTranslation();

  useUpdateEffect(() => {
    const { itemid, shopid } = product;
    checkProductCopyExist(itemid, shopid, true).then((res) => {
      setExist(res);
    });
  }, [product]);

  const showMessage = useMessage();
  useDebounceEffect(
    () => {
      setExist([]);
      // Extract product ID using regex
      const match = pathname.match(/\/item\/(\d+)\.html/);
      const productId = match ? match[1] : null;
      sendMessageToBackground("GET_ALIEXPRESS_PRODUCT_IDS", {
        id: productId,
      }).then((data) => {
        if (data?.url) {
          fetch(data.url, {
            headers: {
              accept: "*/*",
              "accept-language":
                "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,fr-FR;q=0.6,fr;q=0.5",
              "sec-ch-ua-mobile": "?0",
              "sec-fetch-dest": "script",
              "sec-fetch-mode": "no-cors",
              "sec-fetch-site": "same-site",
            },
            referrer: `https://${window.location.hostname}`,
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include",
          }).then((res) => {
            res.text().then((text) => {
              const jsonStr = text.match(/mtopjsonp1\((.*)\)/)?.[1] || "{}";
              const json = JSON.parse(jsonStr);
              const result = json?.data?.result;
              setProduct(convertRawToProduct(result));
            });
          });
        }
      });
    },
    [pathname],
    {
      wait: 0,
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
              // get file extension
              const contentType = img.headers.get("content-type");
              let extension = contentType?.split("/")[1];
              ``;
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
        saveAs(content, `${product.name || "aliexpress-product-images"}.zip`);
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

export default AliexpressProductDetail;

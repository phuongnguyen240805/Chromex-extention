import { useDebounceEffect, useUpdateEffect } from "ahooks";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import { useState } from "react";
import {
  mapTiersToModels,
  stripHtmlExceptImg,
  wait,
} from "../../../../../common/services/helper";
import { getInnerHTMLFromSelector } from "../../../../../common/services/helper";
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

const convertImageToOriginSize = (img: string) => {
  if (img.includes("_.webp")) {
    img = img.replace("_.webp", "");
  }

  if (img.startsWith("//")) {
    img = "https:" + img;
  }

  return img.replace("_110x10000Q75.jpg", "").replace("_90x90q30.jpg", "");
};

async function convertRawToProduct(raw: any) {
  const { item, seller } = raw;

  const data: any = {
    itemid: +item.itemId,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 0,
    shipxanh_length: 0,
    shipxanh_height: 0,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: item.title,
    description: "",
    short_description: "",
    origin_url: location.href,
    origin_shop: seller.shopName,
    price: 0,
    video_info_list: [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: 0,
    shopid: seller.sellerId,
    images: item.images,
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
    source: "taobao",
  };
  let tiers = Array.from(
    document.querySelectorAll("div[class*='skuItem']"),
  ).map((node) => {
    const images: any[] = [];
    const options: any[] = [];
    const ids: any[] = [];
    Array.from(node.querySelectorAll("div[class*='valueItem']")).map((c) => {
      const option = c.querySelector("span")?.textContent || "";
      if (option) {
        options.push(option);
        let image =
          c.querySelector("img[class*='valueItemImg']")?.getAttribute("src") ||
          "";

        if (image) {
          image = convertImageToOriginSize(image);
          images.push(image);
        }
      }
    });
    return {
      name: node.querySelector("div[class*='ItemLabel']")?.textContent || "",
      images: images,
      options: options,
      ids,
    };
  });

  if (tiers.length > 2) {
    tiers.length = 2;
  }

  console.log(tiers);

  tiers.sort((a: any, b: any) => b.images.length - a.images.length);
  const models = mapTiersToModels(tiers);
  data.models = models;
  data.tier_variations = tiers;
  console.log(data);

  return data;
}

function TaobaoBuyerProductsDetail({ pathname }: { pathname: string }) {
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
      // // Extract product ID using regex
      // const queryString = window.location.search;
      // const queryData = new URLSearchParams(queryString);
      // const productId = queryData.get("id");
      // sendMessageToBackground("GET_ALIEXPRESS_PRODUCT_IDS", {
      //   id: productId,
      // }).then((data) => {
      //   console.log(data);

      //   if (data?.url) {
      //     fetch(data.url, {
      //       headers: {
      //         accept: "*/*",
      //         "accept-language":
      //           "en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7,fr-FR;q=0.6,fr;q=0.5",
      //         "sec-ch-ua-mobile": "?0",
      //         "sec-fetch-dest": "script",
      //         "sec-fetch-mode": "no-cors",
      //         "sec-fetch-site": "same-site",
      //       },
      //       referrer: `https://${window.location.hostname}`,
      //       referrerPolicy: "strict-origin-when-cross-origin",
      //       body: null,
      //       method: "GET",
      //       mode: "cors",
      //       credentials: "include",
      //     }).then((res) => {
      //       res.text().then((data) => {
      //         const jsonStr = data.replace(/^[^(]+\((.*)\)$/, "$1");
      //         const json = JSON.parse(jsonStr);

      //         convertRawToProduct(json.data).then((data) => {
      //           setProduct(data);
      //         });
      //       });
      //     });
      //   }
      // });

      const scripts = document.querySelectorAll("script");
      for (const script of scripts) {
        const text = script.textContent || "";
        if (text.includes("window.__ICE_APP_CONTEXT__")) {
          const match = text.match(/var\s+b\s*=\s*(\{[\s\S]*?\});/);
          if (match?.[1]) {
            try {
              const json = JSON.parse(match[1]);
              console.log("__ICE_APP_CONTEXT__ data:", json);
              const res =
                json?.loaderData?.home?.data?.res ||
                json?.loaderData?.home?.data;
              if (res) {

                convertRawToProduct(res).then((data) => {
                  setProduct(data);
                });
              }
            } catch (e) {
              console.error("Failed to parse __ICE_APP_CONTEXT__ JSON:", e);
            }
          }
          break;
        }
      }
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
        saveAs(content, `${product.name || "taobao-product-images"}.zip`);
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

export default TaobaoBuyerProductsDetail;

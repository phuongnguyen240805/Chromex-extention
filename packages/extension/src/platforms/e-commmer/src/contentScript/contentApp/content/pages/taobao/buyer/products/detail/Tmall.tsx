import { select } from "@ngneat/elf";
import { useMessage } from "../../../../../../app";
import { GlobalConfigsStore } from "../../../../../../../../SHARED/common/states/index.state";
import { useObservable } from "@ngneat/react-rxjs";
import { useState } from "react";
import { useDebounceEffect, useUpdateEffect } from "ahooks";
import {
  checkProductCopyExist,
  waitForElementToAppear,
} from "../../../../../../../../SHARED/utils/helper";
import { Button, Col, Row, Spin } from "antd";
import { Tabs } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import CopyListingForm from "../../../../../../../../SHARED/common/components/copy-listing";
import ProductCopyResultExist from "../../../../../../../../SHARED/common/components/copy-listing/ResultExist";
import {
  getInnerHTMLFromSelector,
  mapTiersToModels,
  stripHtmlExceptImg,
  wait,
} from "../../../../../common/services/helper";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import { CopyListingStore } from "../../../../../../../../SHARED/common/components/copy-listing/index.state";
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
const convertRawToProduct = async () => {
  const id = new URLSearchParams(location.search).get("id");

  const shopEl = document.querySelector('a[data-spm="dshopinfo"]');
  const shopId =
    shopEl?.getAttribute("href")?.replace("//", "")?.split(".")?.[0] ||
    "shopTmall";

  if (!id) return;

  let images: any = [];
  document
    .querySelectorAll('div[class*="innerWrap"] img[class*="thumbnailPic"]')
    ?.forEach((x) => {
      images.push(convertImageToOriginSize(x.getAttribute("src") || ""));
    });
  const videoUrl = document
    .querySelector("video.lib-video")
    ?.getAttribute("src");

  const data: any = {
    itemid: id,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 0,
    shipxanh_length: 0,
    shipxanh_height: 0,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: document
      .querySelector('span[class*="mainTitle"]')
      ?.textContent?.trim(),
    description: "",
    short_description: "",
    origin_url: location.href,
    origin_shop: shopId,
    stock: 0,
    video_info_list: [
      videoUrl
        ? {
            video: "https:" + videoUrl,
          }
        : null,
    ],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    shopid: shopId,
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
    source: "tmall",
    price: 0,
  };
  let tiers = Array.from(
    document.querySelectorAll("div[class*='skuItem']"),
  ).map((node: Element) => {
    const images: any[] = [];
    const options: any[] = [];
    const ids: any[] = [];
    Array.from(node.querySelectorAll("div[class*='valueItem']")).map(
      (c: Element) => {
        const option = c
          .querySelector("span")
          ?.textContent?.trim()
          ?.replaceAll(",", ".");

        if (option) {
          options.push(option);
          ids.push(option);
          let image = convertImageToOriginSize(
            c
              .querySelector("img[class*='valueItemImg']")
              ?.getAttribute("src") || "",
          );
          if (image) {
            images.push(image);
          }
        }
      },
    );
    return {
      name: node.querySelector("div[class*='ItemLabel']")?.textContent?.trim(),
      images: images,
      options: options,
      ids,
    };
  });
  tiers = tiers.filter((x) => x.options.length > 0);
  if (tiers.length > 2) {
    tiers.length = 2;
  }
  tiers.sort((a: any, b: any) => b.images.length - a.images.length);

  data.tier_variations = tiers;
  data.models = mapTiersToModels(tiers);

  return data;
};

function TmallBuyerProductDetail({ pathname }: { pathname: string }) {
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
      const sub = waitForElementToAppear('div[class*="MainTitle"]').subscribe(
        (e) => {
          if (e.length) {
            wait(1000).then(() => {
              convertRawToProduct().then((data) => {
                setProduct(data);
              });
            });
          }
        },
      );
      return () => {
        sub.unsubscribe();
      };
    },
    [pathname],
    { wait: 500 },
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

export default TmallBuyerProductDetail;

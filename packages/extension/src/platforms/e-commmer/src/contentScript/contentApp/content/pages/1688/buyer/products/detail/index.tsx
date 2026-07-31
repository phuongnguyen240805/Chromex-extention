import { Button, Col, Row, Spin } from "antd";
import { useEffect, useState } from "react";
import { GlobalConfigsStore } from "../../../../../../../../SHARED/common/states/index.state";
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
import { stripHtmlExceptImgAndP } from "../../../../../common/services/helper";
import { getInnerHTMLFromSelector } from "../../../../../common/services/helper";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useMessage } from "../../../../../../app";
import { checkProductCopyExist } from "../../../../../../../../SHARED/utils/helper";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import { useUpdateEffect } from "ahooks";
import { CopyListingStore } from "../../../../../../../../SHARED/common/components/copy-listing/index.state";
import { useTranslation } from "react-i18next";

function convertRawToProduct(raw: any) {
  console.log("raw", raw);

  const urlShop = raw.offerBaseInfo.sellerWinportUrl;
  const hostname = new URL(urlShop).hostname;
  const shopId = hostname.split(".")[0];

  let description = getInnerHTMLFromSelector(".content-detail");

  description = stripHtmlExceptImgAndP(description || "");
  description = description
    ?.replaceAll(`src="//cbu01.alicdn.com/cms/upload/other/lazyload.png"`, "")
    ?.replaceAll("data-lazyload-src", "src");

  console.log(raw);

  const data: any = {
    itemid: raw.offerBaseInfo.offerId,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 0,
    shipxanh_length: 0,
    shipxanh_height: 0,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: raw.tempModel.offerTitle,
    description,
    short_description: "",
    origin_url: location.href,
    origin_shop: shopId,
    price: 0,
    video_info_list: [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: 0,
    shopid: shopId,

    images: [...new Set([...raw.images.map((x: any) => x.fullPathImageURI)])],
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
    source: "1688",
  };

  let tiers: any[] = [];
  console.log(raw);

  raw.skuModel.skuProps?.forEach((skuProp: any) => {
    const name = skuProp.prop;
    const values = skuProp.value;
    tiers.push({
      name,
      images: values.map((x: any) => x.imageUrl).filter((x: any) => x?.length),
      options: values.map((x: any) => x.name),
    });
  }) || [];
  data.tier_variations = tiers;
  let models = [];
  for (const key in raw.skuModel.skuInfoMap) {
    const model = raw.skuModel.skuInfoMap[key];
    const obj = {
      price: model.discountPrice,
      price_before_discount: model.price,
      stock: model.canBookCount,
      name: (model.name || key)?.replaceAll(">", ",") || "",
    };
    models.push(obj);
  }
  data.models = models;

  console.log("data", data);
  return data;
}

function Buyer1688ProductDetail(props: { pathname: string }) {
  const { pathname } = props;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exist, setExist] = useState<{ id: any; copy_to: any }[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [detailProductActiveTab] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
  );
  const showMessage = useMessage();
  const { t } = useTranslation();

  useEffect(() => {
    const productInfo = sessionStorage.getItem("1688-product-info");

    if (productInfo) {
      setProduct(convertRawToProduct(JSON.parse(productInfo)));
    }
  }, []);
  useUpdateEffect(() => {
    const { itemid, shopid } = product;
    checkProductCopyExist(itemid, shopid).then((res) => {
      setExist(res);
    });
  }, [product]);

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
        checkProductCopyExist(itemid, shopid).then((res) => {
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

export default Buyer1688ProductDetail;

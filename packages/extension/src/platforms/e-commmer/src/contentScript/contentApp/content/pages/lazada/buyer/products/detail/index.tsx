import { Spin, Row, Col, Button, Tabs } from "antd";
import { GlobalConfigsStore } from "../../../../../../../../SHARED/common/states/index.state";
import { useObservable } from "@ngneat/react-rxjs";
import { select } from "@ngneat/elf";
import { useEffect, useState } from "react";
import CopyListingForm from "../../../../../../../../SHARED/common/components/copy-listing";
import {
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import ProductCopyResultExist from "../../../../../../../../SHARED/common/components/copy-listing/ResultExist";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  getInnerHTMLFromSelector,
  stripHtmlExceptImg,
  wait,
} from "../../../../../common/services/helper";
import { checkProductCopyExist } from "../../../../../../../../SHARED/utils/helper";
import { sendMessageToBackground } from "../../../../../../../../SHARED/common/states/common";
import { CopyListingStore } from "../../../../../../../../SHARED/common/components/copy-listing/index.state";
import { useMessage } from "../../../../../../app";
import { useTranslation } from "react-i18next";

function LazadaBuyerProductDetail(props: { pathname: string }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [exist, setExist] = useState<{ id: any; copy_to: any }[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [detailProductActiveTab] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
  );
  const showMessage = useMessage();
  const { t } = useTranslation();

  useEffect(() => {
    if (!props.pathname) return;
    checkExist();
  }, [props.pathname]);

  const checkExist = () => {
    setExist([]);
    const raw = sessionStorage.getItem("lazada-product-info");
    if (!raw) return;
    const data = JSON.parse(raw);
    console.log(data);

    const itemId = data?.primaryKey?.itemId;
    const shopId = data?.seller?.sellerId;
    checkProductCopyExist(itemId, shopId).then((res) => {
      setExist(res);
    });
  };

  const onSaveProduct = async () => {
    try {
      setLoading(true);
      let raw = sessionStorage.getItem("lazada-product-info");
      if (!raw) return;
      const data = JSON.parse(raw);
      window.scroll({
        top: 1500,
      });
      await wait(1000);
      const descHTML =
        getInnerHTMLFromSelector(".pdp-product-detail .detail-content") ||
        getInnerHTMLFromSelector("#detail_decorate_root .engine-app");
      if (descHTML?.length) {
        let desc = stripHtmlExceptImg(descHTML);
        desc = desc.replace(/(\n)\1+/g, "$1");
        desc = desc.replaceAll("_.webp", "");
        console.log("desc", data);

        data.product.desc = desc;
      }
      let highlightsHTML = getInnerHTMLFromSelector(
        ".html-content.pdp-product-highlights",
      );
      if (highlightsHTML?.length) {
        // let highlights = stripHtmlExceptImg(highlightsHTML);
        // highlights = highlights.replace(/(\n)\1+/g, "$1");
        highlightsHTML = highlightsHTML.replaceAll("_.webp", "");
        data.product.highlights = highlightsHTML;
      }
      const { marketplaces, isGetPriceAfterDiscount } = CopyListingStore.query(
        (s) => s,
      );

      data.origin_shop = data.seller?.name;
      data.origin_url = window.location.href;
      const res = await sendMessageToBackground("SAVE_PRODUCT_COPY", {
        data,
        marketplaces,
        isGetPriceAfterDiscount,
        // tabID: tabId,
      });

      if (res?.success) {
        checkExist();
        setIsDone(true);
        showMessage({
          type: "success",
          content: t("success_open_pending_list"),
        });
      } else {
        throw new Error(res?.message?.toString());
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Error when save product");
    } finally {
      setLoading(false);
    }
  };

  const downloadImages = async () => {
    try {
      setLoading(true);
      const detailProductElement = sessionStorage.getItem(
        "lazada-product-info",
      );

      if (!detailProductElement) return;
      const data = JSON.parse(detailProductElement);
      if (!data) return;
      const images: string[] = data.skuGalleries[0]
        .filter((x: any) => x.type === "img")
        .map((x: any) => {
          return `https:${x.src}`;
        });
      const classifies: {
        name: string;
        images: string[];
      }[] = [];
      for (const key in data.skuGalleries) {
        if (key !== "0") {
          const element = data.skuGalleries[key];
          classifies.push({
            name: key,
            images: element
              .filter((x: any) => x.type === "img")
              .map((x: any) => `https:${x.src}`),
          });
        }
      }
      // download images and classifies images as zip

      const zip = new JSZip();

      for (const i in images) {
        const url = images[i];

        const img = await fetch(url);
        const imgBlob = await img.blob();

        // get file extension
        const contentType = img.headers.get("content-type");
        const extension = contentType?.split("/")[1];

        const filename = `${+i + 1}.${extension || "jpg"}`;
        zip.file(filename, imgBlob);
      }

      for (const ii in classifies) {
        const classify = classifies[ii];
        if (classify.images.length === 0) continue;
        const folder = zip.folder(classify.name);
        for (const j in classify.images) {
          const url = classify.images[j];
          const img = await fetch(url);
          const imgBlob = await img.blob();
          // get file extension
          const contentType = img.headers.get("content-type");
          const extension = contentType?.split("/")[1];

          const filename = `${+j + 1}.${extension || "jpg"}`;
          folder?.file(filename, imgBlob);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${data.product?.title || "lazada-product-images"}.zip`);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Error when download photos");
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = () => {};

  return (
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
  );
}

export default LazadaBuyerProductDetail;

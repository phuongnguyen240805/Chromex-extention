import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { Alert, Button, Modal, Space, Typography } from "antd";
import SectionHeader from "../../../../../../../SHARED/common/components/SectionHeader";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useState } from "react";
import { wait } from "../../../../common/services/helper";
import BulkCopyProducts from "../../../../common/components/bulk-copy-products";
import { getItemIdShopId } from "../index.helper";

function ShopeeBuyerShop() {
  const [loadingDownloadImages, setLoadingDownloadImages] = useState(false);
  const [loadingCopyProduct, setLoadingCopyProduct] = useState(false);
  const downloadImages = async () => {
    setLoadingDownloadImages(true);
    try {
      const productList = document.querySelector(
        ".shop-page__all-products-section",
      );
      if (productList) {
        productList.scrollIntoView({ behavior: "smooth" });
      }
      await wait(500);
      // download images and classifies images as zip
      const zip = new JSZip();
      const images = document.querySelectorAll(
        ".shop-decoration a:not(.contents) img, .image-carousel__item img",
      );

      try {
        for (const i in images) {
          const url = images[i]?.getAttribute("src");
          if (!url) continue;
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
      } catch (loopError) {
        console.error("Error in the image processing loop:", loopError);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(
        content,
        `${document.querySelector("h1.section-seller-overview-horizontal__portrait-name")?.textContent || "shopee-shop"}-banner.zip`,
      );
    } catch (error) {
    } finally {
      setLoadingDownloadImages(false);
    }
  };
  const [productList, setProductList] = useState<
    {
      id: string;
      name: string;
      image: string;
      link: string;
      shop_type: string;
      status: string;
      error: string;
    }[]
  >([]);

  const copyProduct = async () => {
    // scroll to #product_list in url
    const productList = document.querySelector(
      ".shop-page__all-products-section",
    );
    if (productList) {
      productList.scrollIntoView();
      const productItems = productList.querySelectorAll("a.contents");
      const productListData = Array.from(productItems).map((item) => {
        let id = "";
        const { itemId, shopId } = getItemIdShopId(
          item.getAttribute("href") || "",
        );
        if (itemId && shopId) {
          id = `${itemId}-${shopId}`;
        }

        return {
          id,
          name: item.querySelector(".break-words")?.textContent || "",
          image: item.querySelector("img")?.getAttribute("src") || "",
          link: `https://${window.location.hostname}${item.getAttribute("href")}`,
          shop_type: "shopee",
          status: "",
          error: "",
        };
      });
      setProductList(productListData);
    }
    setOpenModal(true);
  };
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <SectionHeader>
        <Space wrap>
          <Button
            icon={<CopyOutlined />}
            color="primary"
            variant="outlined"
            onClick={copyProduct}
            loading={loadingCopyProduct}
          >
            Copy sản phẩm
          </Button>
          <Button
            icon={<DownloadOutlined />}
            color="primary"
            variant="outlined"
            onClick={downloadImages}
            loading={loadingDownloadImages}
          >
            Tải ảnh banner
          </Button>
        </Space>
      </SectionHeader>
      <Modal
        width={1040}
        title="Copy sản phẩm về ShipXanh"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
        maskClosable={false}
        destroyOnClose={true}
      >
        <Space direction="vertical">
          <Alert
            message={
              <Typography.Paragraph>
                Nếu đây là shop của bạn, vui lòng làm theo hướng dẫn{" "}
                <Typography.Link
                  href="https://app.shipxanh.com/dashboard/home?autoOpen=0,0"
                  target="_blank"
                >
                  tại đây
                </Typography.Link>{" "}
                để cop được đầy đủ thông tin sản phẩm hơn (Cân nặng, kích thước,
                sku,...)
              </Typography.Paragraph>
            }
            closable
            type="warning"
          />
          <BulkCopyProducts productList={productList} />
          <Typography.Text type="warning">
            Trên đây là sản phẩm của trang hiện tại, sang trang tiếp theo sau đó
            bấm nút Copy sản phẩm để cop tiếp
          </Typography.Text>
        </Space>
      </Modal>
    </>
  );
}

export default ShopeeBuyerShop;

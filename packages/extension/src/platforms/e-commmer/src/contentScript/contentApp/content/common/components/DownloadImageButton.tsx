import { useEffect, useState } from "react";
import { waitForElementToAppear } from "../../../../../SHARED/utils/helper";
import { Button, Tooltip } from "antd";
import ReactDOM from "react-dom/client";
import { ArrowDownOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { cleanUrl } from "../services/helper";
import { useTranslation } from "react-i18next";

function DownloadButton(props: { element: HTMLElement; getByClass?: boolean }) {
  const [isHover, setIsHover] = useState(false);
  const { t } = useTranslation();
  const { run, loading } = useRequest(
    async () => {
      // Get the current element by selector to ensure we have the latest version
      const currentElement = props.getByClass
        ? document.querySelector(
            `${Array.from(props.element.classList)
              .map((item) => `.${item}`)
              .join("")}`,
          )
        : props.element;

      let src = currentElement?.getAttribute("src");
      if (currentElement?.tagName !== "IMG") {
        // get src from style background-image
        const style = (currentElement as HTMLElement).style.backgroundImage;
        src = style.replace(/(url\(|\)|")/g, "");
      }

      if (!src) {
        return;
      }
      src = cleanUrl(src);
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = url.split("/").pop() || "image.jpg";
      a.click();
    },
    {
      manual: true,
    },
  );
  return (
    <Tooltip title={t("download_image")}>
      <Button
        size="small"
        icon={<ArrowDownOutlined />}
        color={"primary"}
        variant={"filled"}
        shape="circle"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          run();
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        loading={loading}
      ></Button>
    </Tooltip>
  );
}

function DownloadImageButton() {
  useEffect(() => {
    waitForElementToAppear(
      ".page-product picture img, .image-carousel__item img,.shop-decoration a:not(item-card-special__link) img, .shop-decoration a:not(contents) img, img.pdp-mod-common-image, img.pdp-mod-common-image.item-gallery__thumbnail-image .html-content.detail-content img, .mod-reviews div.image, .pdp-info-left img, .detail-desc-decorate-richtext img, img.preview-img, div.image-box, div.slider-image, img[class*='mainPic'], img[class*='singleImage-image'], div[class*='Comment'] div[class*='album'] img",
    ).subscribe((elements) => {
      for (const element of elements) {
        // Skip if any parent element is an <a> tag
        let currentElement = element;
        let hasAnchorParent = false;
        while (currentElement.parentElement) {
          if (currentElement.parentElement.tagName.toLowerCase() === "a") {
            hasAnchorParent = true;
            break;
          }
          currentElement = currentElement.parentElement;
        }

        if (window.location.hostname.includes("shopee")) {
          const { clientHeight, clientWidth } = element;
          if (clientHeight < 70 || clientWidth < 70) {
            continue;
          }
        }

        let parent = element.parentElement;

        if (parent?.tagName.toLowerCase() === "picture") {
          parent = parent.parentElement;
        }

        if (
          !parent?.querySelector("#sx-inject-download-image") &&
          !hasAnchorParent
        ) {
          const root = document.createElement("div");
          root.id = "sx-inject-download-image";
          root.style.position = "absolute";
          root.style.top = "3px";
          root.style.right = "3px";
          root.style.zIndex = "100";
          parent?.appendChild(root);

          ReactDOM.createRoot(root).render(
            <DownloadButton element={element as HTMLElement} />,
          );
          // element.addEventListener("mouseenter", (e) => {
          // });
          // element.addEventListener("mouseleave", (e) => {
          //   const root = parent?.querySelector("#sx-inject");
          //   if (root) {
          //     root.remove();
          //   }
          // });
        }
      }
    });

    document.querySelector("img")?.addEventListener("mouseenter", (e) => {});
    document.querySelector("img")?.addEventListener("mouseleave", (e) => {});
  }, []);
  return <></>;
}

export default DownloadImageButton;

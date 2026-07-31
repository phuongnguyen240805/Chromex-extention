import { CheckOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Row, Space, Spin, Tag, theme, Typography } from "antd";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { useRequest } from "ahooks";
import { select } from "@ngneat/elf";
import { useObservable } from "@ngneat/react-rxjs";
import { checkProductCopyExist } from "../../../../../../../SHARED/utils/helper";
import { getItemIdShopId } from "../index.helper";
import { GlobalConfigsStore } from "../../../../../../../SHARED/common/states/index.state";
import { sendMessageToBackground } from "../../../../../../../SHARED/common/states/common";
import Marketplace from "../../../../../../../SHARED/common/components/Marketplace";
import { UserStore } from "../../../../../../../SHARED/common/states/user.state";
import { useTranslation } from "react-i18next";
import { ProductCopyStore } from "../../../../common/services/product-copy.state";
import { selectAllEntities } from "@ngneat/elf-entities";

function ShopeeSaveProductInject(props: { href: string; tabID?: any }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [exist, setExist] = useState<{ id: any; copy_to: any }[]>([]);
  const [allowCheck, setAllowCheck] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!props.href) return;
    const timer = setTimeout(() => {
      setAllowCheck(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [props.href]);

  const checkExist = async () => {
    setExist([]);
    if (!allowCheck) return;
    const { shopId, itemId } = getItemIdShopId(props.href);
    const res = await checkProductCopyExist(itemId, shopId);
    setExist(res);
    return res;
  };

  const { loading: loadingCheck } = useRequest(checkExist, {
    refreshDeps: [props.href, allowCheck],
  });

  const onSaveProduct = async () => {
    const openPanel = GlobalConfigsStore.query((s) => s.content?.openPanel);
    if (!openPanel) {
      GlobalConfigsStore.update((s) => ({
        ...s,
        content: {
          ...s.content,
          openPanel: true,
        },
      }));
    }

    const urlProduct = new URL(
      `https://${window.location.hostname}${props.href}`,
    );
    const queryString = new URLSearchParams(urlProduct.search);
    queryString.set("sx-close", "true");
    queryString.set("sx-auto", "true");
    queryString.set("sx-tab", props.tabID?.toString() || "");
    const url = `https://${`${urlProduct.hostname}/${urlProduct.pathname}`.replace("//", "/")}?${queryString.toString()}`;

    sendMessageToBackground("OPEN_TAB", {
      url,
      active: false,
    });
    // setLoading(true);
    // try {
    //   const data = await getItemInfo(props.href);
    //   const { marketplaces, isGetPriceAfterDiscount } = CopyListingStore.query(
    //     (s) => s,
    //   );
    //   await sendMessageToBackground("SAVE_PRODUCT_COPY", {
    //     data,
    //     marketplaces,
    //     isGetPriceAfterDiscount,
    //     tabID,
    //   });
    //   setIsDone(true);
    //   checkExist();
    // } catch (error) {
    // } finally {
    //   setLoading(false);
    // }
  };
  const { token } = theme.useToken();
  return (
    <Space
      direction="vertical"
      size={4}
      style={{
        backgroundColor: token.colorBgLayout,
        padding: 4,
        borderRadius: 4,
      }}
    >
      {exist.length > 0 && (
        <Space wrap size={4}>
          <Typography.Text>{t("saved")}: </Typography.Text>
          {exist.map((e) => (
            <Typography.Link
              key={e.id}
              href={`https://app.shipxanh.com/dashboard/copy-products`}
              target="_blank"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Marketplace text={e.copy_to} hideText />
            </Typography.Link>
          ))}
        </Space>
      )}
      <Space
        size={4}
        align="center"
        wrap
        className={loading || isDone ? "no-hide" : ""}
      >
        {isDone ? (
          <Tag color="success" icon={<CheckOutlined />}>
            {t("completed")}
          </Tag>
        ) : (
          <Button
            loading={loading}
            href="#" // prevent click
            icon={
              <PlusOutlined
                style={{
                  color: "white",
                }}
              />
            }
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSaveProduct();
            }}
          >
            <Typography.Text
              style={{
                color: "white",
              }}
            >
              Copy
            </Typography.Text>
          </Button>
        )}
      </Space>
    </Space>
  );
}

function ShopeeInjectCopy(props: { pathname: string }) {
  //   const inject;

  const [{ uid }] = useObservable(UserStore.pipe(select((s) => s)));
  const currentTabID = GlobalConfigsStore.query((s) => s.content?.tabId);

  const [results] = useObservable(ProductCopyStore.pipe(selectAllEntities()));

  useEffect(() => {
    console.log("results", results);
  }, [results]);

  useEffect(() => {
    if (!uid) return;
    document.addEventListener("mouseover", (event) => {
      if (event.target instanceof HTMLElement) {
        let parent = event.target.closest(
          "a.item-card-special__link, .shopee_ic a.contents",
        ) as HTMLElement;

        let allowInject = true;
        if (parent) {
          const href = parent.getAttribute("href");

          if (!href) return;
          const root = document.createElement("div");
          setTimeout(() => {
            if (allowInject && !parent.querySelector("#sx-inject")) {
              if (parent.classList.contains("contents")) {
                parent = parent.querySelector("div") as HTMLElement;
              }

              parent.style.position = "relative";

              root.id = "sx-inject";
              root.style.position = "absolute";
              root.style.top = "4px";
              root.style.left = "4px";
              root.style.zIndex = "9999";
              root.style.width = (parent.clientWidth || 180) + "px";
              root.style.height = (parent.clientHeight || 180) + "px";

              parent.appendChild(root);

              ReactDOM.createRoot(root).render(
                <ShopeeSaveProductInject href={href!} tabID={currentTabID} />,
              );
            }
          }, 0);

          parent.addEventListener("mouseleave", () => {
            allowInject = false;
            if (!parent.querySelector(".no-hide")) root.remove();
          });
        }
      }
    });

    chrome.runtime.onMessage.addListener(async (request) => {
      console.log("request", request);
    });

    return () => {
      document.removeEventListener("mouseover", () => {});
      document.removeEventListener("mouseleave", () => {});
      chrome.runtime.onMessage.removeListener(async (request) => {});
    };
  }, [props.pathname, uid]);
  return null;
}

export default ShopeeInjectCopy;

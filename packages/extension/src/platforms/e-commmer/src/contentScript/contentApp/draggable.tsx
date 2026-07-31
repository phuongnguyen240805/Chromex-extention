import { useDraggable } from "@dnd-kit/core";
import { Avatar, Button, Layout, Space, Tooltip, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { select } from "@ngneat/elf";
import { useObservable } from "@ngneat/react-rxjs";
import { sendMessageToBackground } from "../../SHARED/common/states/common";
import {
  GlobalConfigsStore,
  controlContentShowPanel,
} from "../../SHARED/common/states/index.state";
import { UserStore } from "../../SHARED/common/states/user.state";
import ControlShowComponent from "./control";
import HeaderContent from "./header";
import { useEffect, useState } from "react";
import ShopeeInjectCopy from "./content/pages/shopee/buyer/products/ShopeeInjectCopy";
import DownloadImageButton from "./content/common/components/DownloadImageButton";
import ShopeeBuyerProductsAnalyticsItem from "./content/pages/shopee/buyer/products/AnalyticsItems";
import OrderStatus from "./content/common/components/OrderStatus";
import { useTranslation } from "react-i18next";
import ShopeeSellerProductsEditCarrier from "./content/pages/shopee/seller/products/editCarrier";

export function AppContentDraggable(props: { id: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const { t } = useTranslation();

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  const [openPanel] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.openPanel)),
  );
  const [uid] = useObservable(UserStore.pipe(select((s) => s?.uid)));
  const [tabId] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.tabId)),
  );
  const loginFromWeb = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const chromeExtensionId = chrome.runtime.id || "";
      const currentTabId = tabId || Date.now();
      const url = `https://app.shipxanh.com/sign-in-crx?chromeExtensionId=${chromeExtensionId}&tabId=${currentTabId}&getRawToken=true`;
      
      // Gửi lệnh cho Background chuyên trách mở tab an toàn (tránh hoàn toàn bị chặn hoặc tải lại trang)
      sendMessageToBackground("OPEN_TAB", { url, active: true })
        .then((success) => {
          if (!success) window.open(url, "_blank");
        })
        .catch(() => {
          window.open(url, "_blank");
        });
    } catch (err) {
      console.error(err);
    }
  };
  const [pathname, setPathname] = useState(
    window.location.pathname + window.location.hash,
  );
  useEffect(() => {
    // listen for popstate (back/forward or internal navigation that triggers popstate)
    const handleUrlChange = () => {
      const fullPath = window.location.pathname + window.location.hash;
      setPathname(fullPath);
    };

    window.addEventListener("popstate", handleUrlChange);

    // listen for messages from background
    const messageListener = (request: any) => {
      if (request.func === "TAB_UPDATED") {
        const fullPath = window.location.pathname + window.location.hash;
        console.log("TAB_UPDATED", fullPath);
        setPathname(fullPath);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);
  const hostname = window.location.hostname;
  return (
    <>
      <div ref={setNodeRef} style={{ ...style }} {...listeners} {...attributes}>
        {openPanel ? (
          <Layout className="root-content">
            <HeaderContent />
            <Layout.Content className="content">
              {(uid || "dev-testing-uid") ? (
                <ControlShowComponent pathname={pathname} />
              ) : (
                <Button
                  iconPosition="end"
                  icon={<ArrowRightOutlined />}
                  type="primary"
                  color="primary"
                  block
                  variant="solid"
                  onClick={loginFromWeb}
                >
                  {t("click_to_start")}
                </Button>
              )}
            </Layout.Content>
          </Layout>
        ) : (
          <Tooltip title={t("expand")}>
            <div
              className="root-content"
              style={{
                cursor: "pointer",
                backgroundColor: "white",
              }}
              onClick={() => {
                controlContentShowPanel(true);
              }}
            >
              <Space align="center" size={4}>
                <Avatar
                  src="https://app.shipxanh.com/images/logo.png"
                  size={30}
                />
                <Typography.Text strong>ShipXanh</Typography.Text>
              </Space>
            </div>
          </Tooltip>
        )}
      </div>
      <DownloadImageButton />
      <ShopeeInjectCopy pathname={pathname} />
      <ShopeeBuyerProductsAnalyticsItem pathname={pathname} />
      {hostname.includes("shopee") ? <OrderStatus pathname={pathname} /> : null}
      {hostname.includes("shopee") ? (
        <ShopeeSellerProductsEditCarrier pathname={pathname} />
      ) : null}
    </>
  );
}

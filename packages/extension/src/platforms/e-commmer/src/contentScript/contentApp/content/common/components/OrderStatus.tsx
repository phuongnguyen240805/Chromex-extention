import { Space, Tag, Typography } from "antd";
import { waitForElementInView } from "../../../../../SHARED/utils/helper";
import axios from "axios";
import { useEffect } from "react";
import { sendMessageToBackground } from "../../../../../SHARED/common/states/common";
import { waitForElementToAppear } from "../../../../../SHARED/utils/helper";
import { debounceTime } from "rxjs";
import { Spin } from "antd";
import { useRequest } from "ahooks";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import { ExportOutlined } from "@ant-design/icons";
function StatusOrder(props: { orderSn: string; element: HTMLElement }) {
  const { data } = useRequest(
    async () => {
      console.log("get order", props.orderSn);

      const res = await sendMessageToBackground("GET_ORDER", {
        orderSn: props.orderSn,
      });
      console.log(res, props.element);
      if (res?.finance && res.finance.platformFee > 0) {
        const root = document.createElement("div");
        root.id = "sx-inject-fee";

        props.element.querySelector(".order-payment-info")?.appendChild(root);
        ReactDOM.createRoot(root).render(
          <Typography.Text style={{ fontSize: "12px" }}>
            Phí:{" "}
            <Typography.Text type="success" style={{ fontSize: "12px" }}>
              {res.finance.platformFee?.toLocaleString()}
            </Typography.Text>{" "}
            (
            {(
              (res.finance.platformFee /
                (res.finance.platformFee + res.finance.totalRevenue)) *
              100
            ).toFixed(2)}
            %)
          </Typography.Text>,
        );
      }
      return res;
    },
    {
      cacheKey: `get_order_${props.orderSn}`,
      staleTime: 1000 * 60 * 60 * 24,
      cacheTime: 1000 * 60 * 60 * 24,
    },
  );
  const { t } = useTranslation();

  return (
    <>
      {data ? (
        <Space>
          <Typography.Link
            href={`https://app.shipxanh.com/dashboard/orders-sell/order-detail/${props.orderSn}`}
            target="_blank"
          >
            <Tag color="purple">
              {t(`statuses.${data.packageList?.[0]?.logisticsStatus}`)}{" "}
              <ExportOutlined />
            </Tag>
          </Typography.Link>
        </Space>
      ) : null}
    </>
  );
}

function OrderStatus(props: { pathname: string }) {
  useEffect(() => {
    if (props.pathname.startsWith("/portal/sale")) {
      let subElement: any;
      sendMessageToBackground("GET_SHOP_CONNECTED").then((res: any[]) => {
        if (res.length) {
          axios.get("/api/selleraccount/shop_info/").then((resShop) => {
            const shopId = resShop?.data?.data?.shop_id;
            const shopInfo = res.find((x) => `${x.shopId}` === `${shopId}`);
            if (shopInfo) {
              subElement = waitForElementToAppear("a.order-item, a.order-card")
                .pipe(debounceTime(500))
                .subscribe(async (elements) => {
                  if (elements.length > 0) {
                    for (const e of elements) {
                      waitForElementInView(e).subscribe(() => {
                        const check = e.querySelector(".sx-order-status");
                        if (!check) {
                          const orderSn = (
                            (
                              e.querySelector(
                                ".orderid, .order-sn.label, .order-sn",
                              ) as HTMLElement
                            )?.innerText as string
                          )
                            ?.split(/\s|&nbsp;/g)
                            ?.pop();

                          if (orderSn && !e.querySelector("#sx-inject")) {
                            const root = document.createElement("div");
                            root.id = "sx-inject";
                            root.style.marginLeft = "10px";

                            e
                              .querySelector(".order-card-header .left")
                              ?.appendChild(root);
                            ReactDOM.createRoot(root).render(
                              <StatusOrder
                                orderSn={orderSn}
                                element={e as HTMLElement}
                              />,
                            );
                          }
                        }
                      });
                    }
                  }
                });
            }
          });
        }
      });
    }
  }, [props.pathname]);

  return <></>;
}

export default OrderStatus;

import { useEffect, useState } from "react";
import { sendMessageToBackground } from "../../../../../../../SHARED/common/states/common";
import { useDebounceFn, useRequest, useUpdateEffect } from "ahooks";
import { waitForElementToAppear } from "../../../../../../../SHARED/utils/helper";
import ReactDOM from "react-dom/client";
import { Checkbox, ConfigProvider, Flex, List, Space, Typography } from "antd";
import {
  formatDate,
  numberSeperatorShow,
  timeAgo,
} from "../../../../common/services/helper";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { uniqBy } from "lodash";
import { GlobalConfigsStore } from "../../../../../../../SHARED/common/states/index.state";
import { select } from "@ngneat/elf";
import { useObservable } from "@ngneat/react-rxjs";

function AnalyticsItem(props: { product: any }) {
  const { product } = props;
  const { item_basic } = product;
  const { t } = useTranslation();

  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        components: {
          List: {
            itemPaddingSM: "8px",
          },
          Typography: {
            fontSize: 12,
            lineHeight: 1,
          },
        },
      }}
    >
      <List size="small" split bordered>
        <List.Item key={"rating"}>
          <Typography.Text type="secondary">{t("votes")}</Typography.Text>
          <Typography.Text>
            {numberSeperatorShow(item_basic.item_rating?.rating_count?.[0])}
          </Typography.Text>
        </List.Item>
        <List.Item key={"ctime"}>
          <Typography.Text type="secondary">{t("created_at")}</Typography.Text>
          <Flex vertical gap={3} align="end">
            <Typography.Text>{formatDate(item_basic.ctime)}</Typography.Text>
            <Typography.Text type="secondary">
              {timeAgo(item_basic.ctime)}
            </Typography.Text>
          </Flex>
        </List.Item>

        <List.Item key={"sold"}>
          <Flex vertical gap={6}>
            <Typography.Text type="secondary">
              {t("sold_per_month")}
            </Typography.Text>
            <Typography.Text type="secondary">=</Typography.Text>
          </Flex>
          <Flex vertical align="flex-end" gap={6}>
            <Typography.Text>
              {numberSeperatorShow(item_basic.sold)}
            </Typography.Text>
            <Typography.Text className="money">
              {numberSeperatorShow(
                item_basic.sold * (item_basic.price / 100000),
              )}
            </Typography.Text>
          </Flex>
        </List.Item>
        <List.Item key={"historical_sold"}>
          <Flex vertical gap={6}>
            <Typography.Text type="secondary">
              {t("total_sold")}
            </Typography.Text>
            <Typography.Text type="secondary">=</Typography.Text>
          </Flex>
          <Flex vertical align="flex-end" gap={6}>
            <Typography.Text>
              {numberSeperatorShow(item_basic.historical_sold)}
            </Typography.Text>
            <Typography.Text className="money">
              {numberSeperatorShow(
                item_basic.historical_sold * (item_basic.price / 100000),
              )}
            </Typography.Text>
          </Flex>
        </List.Item>
      </List>
    </ConfigProvider>
  );
}
function parseSoldCount(text: string) {
  if (!text) return 0;

  // Tìm số dạng "Đã bán 2,1k" hoặc "Đã bán 496/tháng"
  const match = text.match(/([\d.,]+)([kK]?)/);
  if (!match) return 0;

  let numberStr = match[1].replace(",", "."); // đổi dấu phẩy thành chấm
  let number = parseFloat(numberStr);

  const unit = match[2].toLowerCase();
  if (unit === "k") {
    number *= 1000;
  }

  return Math.round(number);
}
function ShopeeBuyerProductsAnalyticsItem(props: { pathname: string }) {
  const [searchItems, setSearchItems] = useState<any[]>([]);

  const { run: runFetch } = useRequest(
    async (url: string, headers: any, body?: any, method?: string) => {
      if (!headers || headers?.["from-sx"]) return;
      const res = await fetch(url, {
        headers: {
          ...headers,
          "from-sx": "true",
        },
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data?.items?.length) {
        setSearchItems((old) => [...data?.items, ...old]);
      }
      if (data?.data?.centralize_item_card?.item_cards) {
        const items = data?.data?.centralize_item_card?.item_cards?.map(
          (item: any) => {
            return {
              itemid: item.itemid,
              item_basic: {
                ctime: item.ctime,
                price: item.item_card_display_price.price,
                sold: parseSoldCount(
                  item.item_card_display_sold_count.monthly_sold_count_text,
                ),
                historical_sold: parseSoldCount(
                  item.item_card_display_sold_count.historical_sold_count_text,
                ),
                item_rating: item.item_rating,
              },
            };
          },
        );
        setSearchItems((old) => [...items, ...old]);
      }
    },
    { manual: true },
  );

  const [hideAnalytics] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.hideAnalytics)),
  );

  useEffect(() => {
    if (hideAnalytics) return;
    chrome.runtime.onMessage.addListener(async (request) => {
      if (request.func === "SHOPEE_SEARCH_ITEMS") {
        const { url, headers } = request;
        runFetch(url, headers);
      }
      if (request.func === "SHOPEE_RCMD_ITEMS") {
        const { url, headers, body, method } = request;
        runFetch(url, headers, body, method);
      }
    });
  }, [hideAnalytics]);

  useUpdateEffect(() => {
    const sub1 = waitForElementToAppear(
      "a.contents:not(.shipxanh-analytics)",
    ).subscribe(async (els) => {
      injectAnalytics(els, undefined, searchItems);
    });

    const sub2 = waitForElementToAppear(
      "a[data-sqe='link']:not(.shipxanh-analytics)",
    ).subscribe(async (els) => {
      injectAnalytics(els, "&>div>div", searchItems);
    });

    const sub3 = waitForElementToAppear(
      ".stardust-tabs-panels__panel a:not(.shipxanh-analytics)",
    ).subscribe(async (els) => {
      injectAnalytics(els, "&>div>div:nth-child(2)", searchItems);
    });

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
    };
  }, [searchItems]);

  const injectAnalytics = async (
    els: Element[],
    isInvalid = "&>div",
    items: any[],
  ) => {
    for (const el of els) {
      const a = el as HTMLAnchorElement;
      let divAppend: any = el.querySelector(
        'div[data-sqe="name"]',
      )?.parentElement;

      if (!divAppend) divAppend = el.querySelector(isInvalid);

      if (divAppend) {
        const url = new URL(a.href);
        const pathname = url.pathname;
        if (
          /^\/product\/(\d+)\/(\d+).*$/g.test(pathname) ||
          /^.+\-i\.(\d+)\.(\d+).*$/.test(pathname)
        ) {
          let shopId: string = "";
          let itemId: string = "";
          const test = pathname.match(/^.+\-i\.(\d+)\.(\d+).*$/);
          if (test) {
            shopId = test[1];
            itemId = test[2];
          }
          if (!shopId || !itemId) {
            const test = pathname.match(/^\/product\/(\d+)\/(\d+).*$/);
            if (test) {
              shopId = test[1];
              itemId = test[2];
            }
          }
          if (shopId && itemId) {
            const product = items.find((item) => +item.itemid === +itemId);

            if (product) {
              const root = document.createElement("div");
              divAppend.appendChild(root);
              ReactDOM.createRoot(root).render(
                <AnalyticsItem product={product} />,
              );
              a.classList.add("shipxanh-analytics");
            } else {
            }
          }
        }
      }
    }
  };

  const { t } = useTranslation();

  return <></>;
}

export default ShopeeBuyerProductsAnalyticsItem;

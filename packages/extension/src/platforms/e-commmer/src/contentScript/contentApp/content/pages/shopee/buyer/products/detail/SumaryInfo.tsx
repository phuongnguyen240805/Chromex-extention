import { Divider, Flex, Image, Table, Typography, Watermark } from "antd";

import { useEffect, useState } from "react";
import {
  DecimalSeparatorFormat,
  formatDate,
  numberSeperatorShow,
} from "../../../../../common/services/helper";
import { useTranslation } from "react-i18next";

function ShopeeBuyerProductsDetailSumaryInfo(props: { raw: any }) {
  const { raw } = props;
  const { t } = useTranslation();

  const [dataModels, setDataModels] = useState<
    {
      name: string;
      price: string;
      price_before_discount: string;
      image: string;
      stock: string;
    }[]
  >([]);

  useEffect(() => {
    setDataModels(
      raw.models.map((x: any) => {
        let image = raw.tier_variations?.[0]?.images?.[x.extinfo.tier_index[0]];

        if (image?.length) {
          image = `https://cf.shopee.vn/file/${image}`;
        }

        return {
          name: x.name,
          price: DecimalSeparatorFormat(x.price / 100000),
          price_before_discount: DecimalSeparatorFormat(
            (x.price_before_discount || x.price) / 100000,
          ),
          image: image,
          stock: DecimalSeparatorFormat(x.stock),
          sold: numberSeperatorShow(x.sold),
          total_sold: numberSeperatorShow(
            ((x.price_before_discount || x.price) / 100000) * x.sold,
          ),
        };
      }),
    );
  }, [raw]);

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "white",
        marginTop: 16,
      }}
    >
      <Watermark
        content="ShipXanh.com"
        font={{
          fontSize: 18,
          color: "rgba(0, 0, 0, 0.10)",
        }}
      >
        <Table
          title={() => (
            <Flex justify="end">
              <Typography.Text>
                {t("created_at")}: {formatDate(raw.ctime, "HH:mm DD/MM/YYYY")}
              </Typography.Text>
            </Flex>
          )}
          size="small"
          bordered
          columns={[
            {
              title: "#",
              dataIndex: "ind",
              key: "ind",
              className: "text-center",
              render(value, record, index) {
                return index + 1;
              },
            },
            ...(dataModels?.[0]?.image
              ? [
                  {
                    title: "",
                    dataIndex: "image",
                    key: "image",
                    className: "text-center",
                    render(value: string) {
                      return (
                        <Image
                          src={value}
                          width={50}
                          height={50}
                          preview={false}
                        />
                      );
                    },
                  },
                ]
              : []),
            {
              title: t("category"),
              dataIndex: "name",
              key: "name",
              render: (value) => {
                return <>{value}</>;
              },
            },
            {
              title: t("price"),
              dataIndex: "price",
              key: "price",
              className: "text-right",
              render: (value) => {
                return (
                  <Typography.Text className="money">{value}</Typography.Text>
                );
              },
            },
            {
              title: t("original_price"),
              dataIndex: "price_before_discount",
              key: "price_before_discount",
              className: "text-right",
              render: (value) => {
                return (
                  <Typography.Text className="money">{value}</Typography.Text>
                );
              },
            },

            {
              title: t("sold"),
              dataIndex: "sold",
              key: "sold",
              className: "text-right",
            },
            {
              title: t("total_sold"),
              dataIndex: "total_sold",
              key: "total_sold",
              className: "text-right",
              render: (value) => {
                return (
                  <Typography.Text className="money">{value}</Typography.Text>
                );
              },
            },
            {
              title: t("stock"),
              dataIndex: "stock",
              key: "stock",
              className: "text-right",
            },
          ]}
          dataSource={dataModels}
          pagination={false}
        />
      </Watermark>
    </div>
  );
}

export default ShopeeBuyerProductsDetailSumaryInfo;

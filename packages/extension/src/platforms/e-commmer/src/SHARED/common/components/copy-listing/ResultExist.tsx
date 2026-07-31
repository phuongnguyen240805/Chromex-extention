import { Divider, Flex, Space, Tag, Typography } from "antd";
import { CopyListingMarketplacesENUM } from "./index.state";
import { useTranslation } from "react-i18next";
import { orderBy } from "lodash";

const colorSchema = [
  {
    marketplace: CopyListingMarketplacesENUM.SHOPEE,
    color: "orange",
  },
  {
    marketplace: CopyListingMarketplacesENUM.LAZADA,
    color: "blue",
  },
  {
    marketplace: CopyListingMarketplacesENUM.TIKTOK,
    color: "black",
  },
  {
    marketplace: CopyListingMarketplacesENUM.FACEBOOK,
    color: "geekblue",
  },
  {
    marketplace: CopyListingMarketplacesENUM.WOO,
    color: "purple",
  },
  {
    marketplace: CopyListingMarketplacesENUM.TIKI,
    color: "cyan",
  },
  {
    marketplace: CopyListingMarketplacesENUM.SENDO,
    color: "red",
  },
];
function ProductCopyResultExist(props: {
  exist: {
    copy_to: CopyListingMarketplacesENUM;
    id: string;
  }[];
  horizontal?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      {!props.horizontal ? (
        <Divider orientation="left">
          <Typography.Text type="secondary">{t("save_result")}</Typography.Text>
        </Divider>
      ) : null}
      <Space wrap>
        {props.horizontal ? (
          <Typography.Text type="secondary">{t("save_result")}</Typography.Text>
        ) : null}
        {orderBy(props.exist, ["copy_to"], ["asc"]).map((e, i) => {
          return (
            <Typography.Link
              key={i}
              href="https://app.shipxanh.com/dashboard/copy-products"
              target="_blank"
            >
              <Tag
                color={
                  colorSchema.find((x) => x.marketplace == e.copy_to)?.color
                }
              >
                {e.copy_to}
              </Tag>
            </Typography.Link>
          );
        })}
      </Space>
    </>
  );
}

export default ProductCopyResultExist;

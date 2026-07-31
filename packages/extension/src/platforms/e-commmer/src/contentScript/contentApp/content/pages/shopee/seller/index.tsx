import { List, Typography } from "antd";
import { useTranslation } from "react-i18next";

function ShopeeSeller() {
  const { t } = useTranslation();

  return (
    <List split size="small">
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=1,1"
          target="_blank"
        >
          {t("ai_agent_flashsale")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=1,2"
          target="_blank"
        >
          {t("auto_push_shopee_product")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=2,6"
          target="_blank"
        >
          {t("auto_reply_reviews")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=2,2"
          target="_blank"
        >
          {t("auto_confirm_order")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=2,1"
          target="_blank"
        >
          {t("manage_returned_orders")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://youtu.be/cC1pPYcrHvo?si=Us7_7TsMwPYgc8uo"
          target="_blank"
        >
          {t("customize_shipping_labels")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/marketing/ecom-pricelist"
          target="_blank"
        >
          {t("bulk_price_update")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=1,0"
          target="_blank"
        >
          {t("update_marketing_frames")}
        </Typography.Link>
      </List.Item>
      <List.Item>
        <Typography.Link
          href="https://app.shipxanh.com/dashboard/home?autoOpen=0,0"
          target="_blank"
        >
          {t("clone_shop")}
        </Typography.Link>
      </List.Item>
    </List>
  );
}

export default ShopeeSeller;

import { Typography } from "antd";
import { useTranslation } from "react-i18next";

function CommonTextStatus(props: { status: string }) {
  const { t } = useTranslation();
  const text = t("translation:status." + props.status.toLowerCase());
  switch (props.status) {
    case "SUCCESS":
      return <Typography.Text type="success">{text}</Typography.Text>;
    case "ERROR":
      return <Typography.Text type="danger">{text}</Typography.Text>;
    case "IN_PROGRESS":
      return <Typography.Text type="warning">{text}</Typography.Text>;
    default:
      return <Typography.Text>{text}</Typography.Text>;
  }
}

export default CommonTextStatus;

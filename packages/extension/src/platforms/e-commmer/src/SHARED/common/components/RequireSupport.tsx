import { MessageOutlined } from "@ant-design/icons";
import { Divider, Space, Button, Flex, QRCode, Typography } from "antd";
import { useEffect } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sendMessageToBackground } from "../states/common";

function RequireSupport(props: { isIdeas?: boolean; isSimple?: boolean }) {
  const { t } = useTranslation();
  const [version, setVersion] = useState(null);
  console.log("RequireSupport component render");
  useEffect(() => {
    console.log("RequireSupport useEffect triggered");
    sendMessageToBackground("GET_EXTENSION_VERSION").then((v) => {
      console.log("version from background:", v);
      setVersion(v);
    });
  }, []);
  return (
    <>
      {!props.isSimple ? (
        <Divider>
          <Typography.Text>{t("require_support")}</Typography.Text>
        </Divider>
      ) : null}
      <Flex vertical align={props.isSimple ? undefined : "center"} gap={10}>
        <Space>
          <Button
            variant="filled"
            color="primary"
            size="small"
            href="https://m.me/phanmemshipxanh"
            target="_blank"
          >
            <MessageOutlined />
            <Typography.Text>
              Chat aoi-auto{props.isSimple ? ` ${t("support")}` : ""}
            </Typography.Text>
          </Button>
          <Typography.Text type="secondary">
            123456789
          </Typography.Text>
          {version ? (
            <Typography.Text type="secondary">Ver{version}</Typography.Text>
          ) : null}
        </Space>
      </Flex>
    </>
  );
}

export default RequireSupport;

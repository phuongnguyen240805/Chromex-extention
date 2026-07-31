import {
  CloseOutlined,
  GlobalOutlined,
  LogoutOutlined,
  MinusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Flex, Avatar, Typography, Space, Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { sendMessageToBackground } from "../../SHARED/common/states/common";
import { select } from "@ngneat/elf";
import { useObservable } from "@ngneat/react-rxjs";
import { controlContentShowPanel } from "../../SHARED/common/states/index.state";
import { UserStore } from "../../SHARED/common/states/user.state";
import ChangeLang from "../../SHARED/common/components/ChangeLang";

function HeaderContent() {
  const [{ displayName, uid }] = useObservable(
    UserStore.pipe(select((s) => s)),
  );
  const { t } = useTranslation();

  return (
    <>
      <Flex gap={4} align="center" justify="space-between">
        <Space align="center" size={3}>
          <Avatar src="https://app.shipxanh.com/images/logo.png" size={30} />
          <Typography.Text>
            {uid ? displayName : "ShipXanh"}
          </Typography.Text>
        </Space>
        <Space>
          {uid ? (
            <>
              <Tooltip title={t("logout")}>
                <Button
                  size="small"
                  color="danger"
                  variant="filled"
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    sendMessageToBackground("SIGN_OUT");
                  }}
                >Đăng xuất</Button>
              </Tooltip>
              <ChangeLang />
              <Tooltip title={t("admin_page")}>
                <Button
                  onClick={() => {
                    window.open("https://app.shipxanh.com", "_blank");
                  }}
                  size="small"
                  color="default"
                  variant="filled"
                  icon={<GlobalOutlined />}
                ></Button>
              </Tooltip>
            </>
          ) : null}
          <Tooltip title={t("minimize")}>
            <Button
              size="small"
              color="default"
              variant="filled"
              icon={<MinusOutlined />}
              onClick={() => {
                controlContentShowPanel(false);
              }}
            />
          </Tooltip>
        </Space>
      </Flex>
    </>
  );
}

export default HeaderContent;

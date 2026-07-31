import { Avatar, Flex, theme, Tooltip, Typography } from "antd";
import { ShopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

// const platformAvaiable = [
//   "shopee",
//   "lazada",
//   "tiktok",
//   "facebook",
//   "sendo",
//   "woo",
// ];
function Marketplace(props: {
  text?: string;
  transBG?: boolean;
  fontBold?: boolean;
  hideText?: boolean;
  name?: string;
  hideIcon?: boolean;
}) {
  const { hideText, name, text: textOrigin, fontBold, hideIcon } = props;
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const text = textOrigin === "all" ? t("all") : textOrigin;

  return (
    <>
      {
        <Flex
          align="center"
          gap={4}
          wrap
          className="platform-label"
          style={{
            // backgroundColor: transBG ? "unset" : "rgb(0 0 0 / 4%)",
            fontWeight: !fontBold ? "unset" : "500",
          }}
        >
          {!hideIcon && (
            <Tooltip title={text}>
              <Avatar
                style={{
                  backgroundColor: "#0000",
                  borderRadius: 2,
                }}
                icon={
                  <ShopOutlined
                    style={{
                      fontSize: 18,
                      color: token.colorTextSecondary,
                    }}
                  />
                }
                size={20}
                shape="square"
                src={`https://app.shipxanh.com/images/icons/${(text || "shipxanh").toLowerCase()}.png`}
              ></Avatar>
            </Tooltip>
          )}
          {!hideText ? (
            <Typography.Text
              style={{
                textTransform: "capitalize",
              }}
            >
              {name?.length ? name : text}
            </Typography.Text>
          ) : null}
        </Flex>
      }
    </>
  );
}

export default Marketplace;

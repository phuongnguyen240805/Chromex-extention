import { DoubleLeftOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { FloatButton, theme } from "antd";
import { CSSProperties, useState } from "react";

function SectionHeader(props: {
  children: React.ReactNode;
  style?: CSSProperties;
  mode?: "light" | "grey";
  noStyle?: boolean;
}) {
  const { token } = theme.useToken();

  return (
    <>
      <div
        className="section-header"
        style={{
          backgroundColor:
            props.mode == "light" ? token.colorBgBase : token.colorBgLayout,
          ...props.style,
          borderRadius: token.borderRadius,
          padding: token.padding,
        }}
      >
        {props.children}
      </div>
    </>
  );
}

export default SectionHeader;

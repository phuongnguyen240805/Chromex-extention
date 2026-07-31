import { useEffect } from "react";
import { sendMessageToBackground } from "../../../../../SHARED/common/states/common";
import { useRequest } from "ahooks";
import { Spin, Typography } from "antd";

function ViettelPost() {
  const { loading, data } = useRequest(async () => {
    const tokenData = localStorage.getItem("vtp-token");
    if (tokenData) {
      const token = JSON.parse(tokenData)?.tokenKey;
      if (token) {
        return await sendMessageToBackground("UPDATE_TOKEN_VTP", {
          token,
        });
      }
    }
  });
  return (
    <Spin spinning={loading}>
      {data ? (
        <Typography.Text type="success">Đã đồng bộ tài khoản</Typography.Text>
      ) : null}
    </Spin>
  );
}

export default ViettelPost;

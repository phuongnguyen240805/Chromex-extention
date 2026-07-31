import { Alert, Layout } from "antd";
import LogoHeader from "../common/components/LogoHeader";
import "./index.scss";
function LayoutRoot() {
  return (
    <Layout>
      <LogoHeader />
      <Layout.Content className="content">
        <Alert message="Hello, World!" type="success" />
      </Layout.Content>
    </Layout>
  );
}

export default LayoutRoot;

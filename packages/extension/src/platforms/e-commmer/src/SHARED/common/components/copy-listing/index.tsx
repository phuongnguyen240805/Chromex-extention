import {
  Alert,
  Button,
  Checkbox,
  Form,
  Popconfirm,
  Select,
  Spin,
  Steps,
  Typography,
} from "antd";
import { useState } from "react";
import SectionHeader from "../SectionHeader";
import { CopyListingProps, CopyListingStore } from "./index.state";
import Marketplace from "../Marketplace";
import { useObservable } from "@ngneat/react-rxjs";
import { select } from "@ngneat/elf";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

function CopyListingForm(props: {
  onSave: () => void;
  loading: boolean;
  outlineBtn?: boolean;
  isDone?: boolean;
  fromBulk?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm<CopyListingProps>();
  const [copyListingConfigs] = useObservable(
    CopyListingStore.pipe(select((s) => s)),
  );
  const { t } = useTranslation();
  const { fromBulk } = props;

  return (
    <Spin spinning={props.loading}>
      <SectionHeader>
        <Form<CopyListingProps>
          form={form}
          className="no-margin"
          initialValues={copyListingConfigs}
          onValuesChange={(e) => {
            console.log(e);
            CopyListingStore.update((s) => ({
              ...s,
              ...e,
            }));
          }}
          onFinish={() => {
            // setIsDone(true);
            props.onSave();
          }}
        >
          <Steps
            direction={fromBulk ? "horizontal" : "vertical"}
            size="small"
            current={current}
            onChange={(e) => setCurrent(e)}
            items={[
              {
                title: t("where_to_publish"),
                description: (
                  <Form.Item
                    name={"marketplaces"}
                    rules={[
                      {
                        required: true,
                        message: t("choose_at_least_one"),
                      },
                    ]}
                  >
                    <Select
                      allowClear
                      mode="multiple"
                      placeholder={t("select_marketplace")}
                      options={[
                        "shopee",
                        "lazada",
                        "tiktok",
                        "facebook",
                        "tiki",
                        "sendo",
                        "woo",
                      ].map((x) => ({
                        value: x,
                        label: <Marketplace text={x} />,
                      }))}
                    />
                  </Form.Item>
                ),
              },
              {
                title: t("configurations"),
                description: (
                  <Form.Item
                    name={"isGetPriceAfterDiscount"}
                    valuePropName="checked"
                  >
                    <Checkbox>{t("get_price_after_discount")}</Checkbox>
                  </Form.Item>
                ),
              },
              {
                title: t("click_button_below"),
                description: (
                  <Button
                    block
                    color="primary"
                    variant="solid"
                    icon={<PlusOutlined />}
                    onClick={() => form.submit()}
                  >
                    {fromBulk ? "Bắt đầu" : t("save_to_pending_list")}
                  </Button>
                ),
              },
              {
                title: t("completed"),
                description: (
                  <Alert
                    style={{
                      maxWidth: fromBulk ? 180 : undefined,
                    }}
                    type={props.isDone ? "success" : "info"}
                    message={
                      <Typography.Text>
                        {t("open_pending_list")}{" "}
                        <Typography.Link
                          href="https://app.shipxanh.com/dashboard/copy-products"
                          target="_blank"
                        >
                          {t("here")}
                        </Typography.Link>{" "}
                        {t("to_continue")}
                      </Typography.Text>
                    }
                  />
                ),
                status: props.isDone ? "finish" : "wait",
              },
            ]}
          />
        </Form>
      </SectionHeader>
    </Spin>
  );
}

export default CopyListingForm;

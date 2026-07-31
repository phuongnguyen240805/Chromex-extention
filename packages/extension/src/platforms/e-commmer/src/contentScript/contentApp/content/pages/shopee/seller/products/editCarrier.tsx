import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import {
  Alert,
  Button,
  ConfigProvider,
  Flex,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from "antd";
import { useRequest, useUpdateEffect } from "ahooks";
import axios from "axios";
import SectionHeader from "../../../../../../../SHARED/common/components/SectionHeader";
import RequireSupport from "../../../../../../../SHARED/common/components/RequireSupport";
import { CheckOutlined } from "@ant-design/icons";
import { wait } from "../../../../common/services/helper";

function EditCarrierModal(props: { productIds: any[]; onClose: () => void }) {
  const [channelSelected, setChannelSelected] = useState<any[]>([]);

  const [saved, setSaved] = useState(0);
  const [error, setError] = useState<any[]>([]);
  const [shopId, setShopId] = useState<any>(null);
  const [openSelect, setOpenSelect] = useState(false);

  const {
    loading: loadingChannel,
    data: channels,
    mutate,
  } = useRequest(async () => {
    const resShop = await axios.get(
      `https://banhang.shopee.vn/api/framework/selleraccount/shop_info/`,
    );
    setShopId(resShop?.data?.data?.shop_id);

    const productId = props.productIds[0].productId;
    const channelRes = await axios.post(
      `https://banhang.shopee.vn/api/v3/listing-upload/component/get_product_channel_info`,
      {
        product_id: +productId,
        shop_id: shopId,
        is_draft: false,
      },
    );
    const channelsInfo = channelRes?.data?.data?.list?.filter(
      (x: any) => !x.parent_channel_id,
    );
    setOpenSelect(channelsInfo.length > 0);
    return channelsInfo.map((x: any) => ({
      channelid: x.channel_id,
      name: x.name,
      enabled: channelSelected.includes(x.channel_id),
    })) as any[];
  });

  const { run: save, loading } = useRequest(
    async () => {
      setError([]);
      setSaved(0);

      for (const product of props.productIds) {
        const { productId, productName } = product;
        await wait(2500);
        try {
          const channelRes = await axios.post(
            `https://banhang.shopee.vn/api/v3/listing-upload/component/get_product_channel_info`,
            {
              product_id: +productId,
              shop_id: shopId,
              is_draft: false,
            },
          );
          const channelInfo = channelRes?.data?.data?.list;

          if (!channelInfo?.length) {
            throw "Sản phẩm chưa có vận chuyển";
          }

          const res = await axios
            .post(
              `https://banhang.shopee.vn/api/v3/product/update_product_info`,
              {
                product_id: +productId,
                product_info: {
                  logistics_channels: channelInfo
                    .map((x: any) => {
                      const channelItem = channels?.find(
                        (y: any) => y.channelid === x.channel_id,
                      );
                      if (
                        channelItem &&
                        channelSelected.includes(x.channel_id)
                      ) {
                        return {
                          price: x.price,
                          enabled: channelItem.enabled,
                          channelid: x.channel_id,
                        };
                      }
                      return null;
                    })
                    .filter((x: any) => x !== null),
                },
              },
            )
            .catch((e) => {
              throw (
                e.response?.data?.message || e.response?.data?.msg ||
                "Có lỗi xảy ra, liên hệ admin để được hỗ trợ"
              );
            });

          if (res?.data?.msg === "success") {
            setSaved((prev) => prev + 1);
          } else {
            throw res?.data?.user_message;
          }

        } catch (error) {
          setError((prev) => [
            ...prev,
            {
              productId,
              productName,
              error,
            },
          ]);
        }
      }
    },
    {
      manual: true,
    },
  );

  useUpdateEffect(() => {
    if (saved === props.productIds.length) {
      props.onClose();
    }
  }, [saved]);

  return (
    <Spin spinning={loadingChannel}>
      <Space
        direction="vertical"
        style={{
          width: "100%",
        }}
      >
        <Space.Compact
          style={{
            width: "100%",
          }}
        >
          <Button color="primary" variant="filled">
            Kênh áp dụng
          </Button>
          <Select
            open={openSelect}
            onDropdownVisibleChange={(open) => {
              setOpenSelect(open);
            }}
            allowClear
            mode="multiple"
            options={channels?.map((x: any) => ({
              label: x.name,
              value: x.channelid,
            }))}
            style={{
              width: "100%",
            }}
            dropdownStyle={{
              width: "auto",
            }}
            value={channelSelected}
            onChange={(value) => {
              setChannelSelected(value);
            }}
            placeholder="Bấm để chọn"
          />
        </Space.Compact>

        {channels?.filter((x) => channelSelected.includes(x.channelid))
          ?.length ? (
          <SectionHeader>
            <List split>
              {channels
                ?.filter((x) => channelSelected.includes(x.channelid))
                .map((item) => (
                  <List.Item key={item.channelid}>
                    <Typography.Title level={5}>{item.name}</Typography.Title>
                    <Switch
                      checkedChildren="Đang bật"
                      unCheckedChildren="Đang tắt"
                      value={item.enabled}
                      onChange={(checked) => {
                        mutate((prev) => {
                          return prev?.map((x: any) => ({
                            ...x,
                            enabled:
                              x.channelid === item.channelid
                                ? checked
                                : x.enabled,
                          }));
                        });
                      }}
                    />
                  </List.Item>
                ))}
            </List>
          </SectionHeader>
        ) : (
          <Alert message="Vui lòng chọn kênh áp dụng" type="warning" />
        )}
        <SectionHeader>
          <Flex justify="end" gap={10}>
            <Button
              color="default"
              variant="outlined"
              onClick={() => {
                props.onClose();
              }}
            >
              Đóng
            </Button>
            <Button
              color="primary"
              variant="solid"
              icon={<CheckOutlined />}
              loading={loading}
              disabled={!channelSelected.length}
              onClick={save}
            >
              Lưu {saved > 0 ? `(${saved}/${props.productIds.length})` : ""}
            </Button>
          </Flex>
        </SectionHeader>
        {error.length ? (
          <List split style={{ maxHeight: 300, overflowY: "auto" }}>
            {error.map((e) => (
              <List.Item key={e.productId}>
                <Flex vertical>
                  <Typography.Link
                    target="_blank"
                    href={`/portal/product/${e.productId}`}
                  >
                    {e.productName}
                  </Typography.Link>
                  <Typography.Text type="danger">{e.error}</Typography.Text>
                </Flex>
              </List.Item>
            ))}
          </List>
        ) : null}
        <RequireSupport />
      </Space>
    </Spin>
  );
}

function EditCarrier() {
  const [productIds, setProductIds] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const openModal = () => {
    const selectedItems = document.querySelectorAll(
      ".product-list-item__td input.eds-checkbox__input[value='true'], .product-card-item.grid input.eds-checkbox__input[value='true']",
    );
    if (!selectedItems.length) {
      alert("Vui lòng chọn sản phẩm");
      return;
    }

    const products = Array.from(selectedItems)
      .map((item) => {
        const wrapper = item.closest("tr, .product-item");
        if (wrapper) {
          const product = wrapper.querySelector("a.product-name-wrap");
          if (product) {
            const productId = product.getAttribute("href")?.split("/")?.pop();
            const image = wrapper.querySelector("div.product-image img");
            return {
              productId,
              productName: product.textContent,
              image: image?.getAttribute("src"),
            };
          }
        }
      })
      .filter((item) => item !== undefined);
    if (!products.length) {
      alert("CÓ LỖI XẢY RA, Liên hệ admin để được hỗ trợ");
      return;
    }
    setProductIds(products);
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        color="primary"
        variant="outlined"
        size="small"
        shape="round"
        onClick={openModal}
      >
        Bật / Tắt vận chuyển hàng loạt
      </Button>
      <Modal
        destroyOnClose
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title={`Cấu hình vận chuyển cho ${productIds.length} sản phẩm`}
        width={650}
      >
        <EditCarrierModal
          productIds={productIds}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  );
}

function ShopeeSellerProductsEditCarrier(props: { pathname: string }) {
  const { pathname } = props;
  const { t } = useTranslation();

  useEffect(() => {
    setTimeout(() => {
      if (pathname.startsWith("/portal/product/list")) {
        const listHeader = document.querySelector(
          ".list-header .list-header-left",
        );
        if (listHeader && !document.querySelector(".edit-carrier")) {
          const root = document.createElement("div");
          root.className = "edit-carrier";
          root.style.marginLeft = "10px";
          listHeader.appendChild(root);
          ReactDOM.createRoot(root).render(
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "rgb(73 82 255)",
                },
              }}
            >
              <EditCarrier />
            </ConfigProvider>,
          );
        }
      }
    }, 1500);
  }, [pathname]);
  return <></>;
}

export default ShopeeSellerProductsEditCarrier;

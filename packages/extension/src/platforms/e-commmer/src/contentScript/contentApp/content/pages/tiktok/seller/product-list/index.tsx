import { useRequest } from "ahooks";
import {
  Button,
  Flex,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Typography,
} from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  mapTiersToModels,
  numberSeperatorShow,
} from "../../../../common/services/helper";
import SectionHeader from "../../../../../../../SHARED/common/components/SectionHeader";
import Marketplace from "../../../../../../../SHARED/common/components/Marketplace";
import { useTranslation } from "react-i18next";
import { ExportOutlined, PlusOutlined } from "@ant-design/icons";
import { chunk, sumBy } from "lodash";
import { sendMessageToBackground } from "../../../../../../../SHARED/common/states/common";

function convertRawToProduct(raw: any, sellerId: string, shopName: string) {
  const videoUrl = raw.video?.video_infos?.[0]?.main_url;

  const data: any = {
    itemid: +raw.product_id,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: +(raw.package_weight || 0.5) * 1000,
    shipxanh_width: +(raw.package_width || 0),
    shipxanh_length: +(raw.package_length || 0),
    shipxanh_height: +(raw.package_height || 0),
    origin_cate: "",
    current_cate: "",
    name: raw.product_name,
    description: raw.description,
    short_description: "",
    origin_url: `https://www.tiktok.com/view/product/${raw.product_id}`,
    origin_shop: shopName,
    price: 0,
    video_info_list: videoUrl ? [{ video_url: videoUrl }] : [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: sumBy(
      raw.skus,
      (x: any) => x.quantities?.[0]?.available_quantity || 0,
    ),
    shopid: sellerId,
    images: raw.images.map((x: any) => x.url_list?.[0]),
    categories: [],
    attributes: [],
    targets: ["0"],
    from_seller: true,
    valid_to_copy: false,
    errors: ["yup.current_cate.required"],
    tier_variations: raw.sale_properties?.map((x: any) => {
      return {
        name: x.name,
        options: x.values?.map((y: any) => y.name),
        ...(x.has_image && {
          images: x.values?.map((y: any) => y.image.url_list?.[0]),
        }),
      };
    }),
    models: raw.skus.map((x: any) => {
      return {
        name: x.properties?.map((y: any) => y.value_name).join(","),
        stock: x.quantities?.[0]?.available_quantity || 0,
        price: +x.base_price?.sale_price || 0,
        sku: x.seller_sku,
      };
    }),
    seller_attributes: [],
    size_chart_image: null,
    size_chart_type: null,
    source: "tiktok",
  };

  return data;
}

function TiktokSellerProductListSaveModal() {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [step, setStep] = useState(0);
  const [marketplaces, setMarketplaces] = useState<any[]>([
    "shopee",
    "lazada",
    "tiktok",
  ]);
  const { data, loading } = useRequest(async () => {
    let stop = false;
    let page = 1;
    const products: any[] = [];
    while (!stop) {
      const res = await axios.get(
        `/api/v1/product/local/products/list?tab_id=1&page_number=${page}&page_size=50&sku_number=1`,
      );
      page++;
      if (res.data?.data?.products?.length) {
        products.push(...res.data?.data?.products);
      } else {
        stop = true;
      }
    }
    return products;
  });
  const { t } = useTranslation();
  const [successList, setSuccessList] = useState<string[]>([]);
  const [errorList, setErrorList] = useState<
    {
      id: string;
      error: string;
    }[]
  >([]);
  useEffect(() => {}, [errorList]);
  const { run: runSaveProduct, loading: loadingSaveProduct } = useRequest(
    async () => {
      setSuccessList([]);
      setErrorList([]);

      for (let chunksId of chunk(selectedProducts, 5)) {
        const tasks = [];
        for (const id of chunksId) {
          const task = async () => {
            try {
              const product = data?.find((x) => x.product_id === id);

              if (!product) {
                throw new Error("Không tìm thấy sản phẩm");
              }
              const success = await saveProduct(product.product_id);
              if (success) {
                setSuccessList((prev) => [...prev, id]);
                setSelectedProducts((prev) => prev.filter((x) => x !== id));
              }
            } catch (error) {
              setErrorList((prev) => [
                ...prev,
                {
                  id: id,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Lỗi, vui lòng thử lại",
                },
              ]);
            }
          };
          tasks.push(task());
        }
        await Promise.all(tasks);
      }
      return {
        successList,
        errorList,
      };
    },
    {
      manual: true,
    },
  );

  async function saveProduct(product_id: string) {
    const resInfoShop = await axios.get(`/api/v3/seller/common/get`);
    const seller = resInfoShop.data?.data?.seller;
    if (!seller) {
      throw new Error("Không tìm thấy shop");
    }
    const resDetail = await axios.get(
      `/api/v1/product/audit/product/get?product_id=${product_id}`,
    );
    const detail = resDetail.data?.data?.product;
    const data = convertRawToProduct(
      detail,
      seller.seller_id,
      seller.shop_name,
    );
    const resSaveProduct = await sendMessageToBackground("SAVE_PRODUCT_COPY", {
      data,
      marketplaces,
      isGetPriceAfterDiscount: false,
    });
    if (resSaveProduct.success) {
      return true;
    } else throw new Error(resSaveProduct.message);
  }

  return (
    <Space direction="vertical">
      <SectionHeader>
        <Steps
          current={step}
          onChange={(e) => setStep(e)}
          items={[
            {
              title: "Đăng lên?",
              description: (
                <Select
                  value={marketplaces}
                  onChange={(e) => setMarketplaces(e)}
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
              ),
            },
            {
              title: "Bấm nút dưới",
              description: (
                <Button
                  disabled={!marketplaces.length || !selectedProducts.length}
                  block
                  color="primary"
                  variant="solid"
                  icon={<PlusOutlined />}
                  loading={loadingSaveProduct}
                  onClick={() => runSaveProduct()}
                >
                  Bắt đầu
                </Button>
              ),
            },
          ]}
        />
      </SectionHeader>
      <Table
        loading={loading}
        virtual
        scroll={{
          y: 550,
          x: "max-content",
        }}
        pagination={false}
        dataSource={(data || []).filter((x) =>
          x.product_name.toLowerCase().includes(searchValue.toLowerCase()),
        )}
        rowKey={"product_id"}
        bordered
        rowSelection={{
          selectedRowKeys: selectedProducts,
          onChange(selectedRowKeys, selectedRows, info) {
            setSelectedProducts(selectedRowKeys);
          },
          columnWidth: 50,
          renderCell(value, record, index, originNode) {
            return (
              <Flex vertical justify="center" align="center">
                {index + 1}
                {originNode}
              </Flex>
            );
          },
        }}
        columns={[
          {
            title: (
              <Typography.Text>
                {selectedProducts?.length
                  ? `${selectedProducts?.length} / `
                  : ""}
                {data?.length}
              </Typography.Text>
            ),
            dataIndex: "id",
            width: 90,
            align: "center",
            render: (_, record) => (
              <Image
                src={record.image?.url_list?.[0]}
                width={70}
                height={70}
                style={{
                  borderRadius: 6,
                }}
              />
            ),
          },
          {
            title: (
              <Input.Search
                placeholder="Tìm kiếm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            ),
            dataIndex: "product_name",
            render(value, record, index) {
              const success = successList.includes(record.product_id);
              const error = errorList.find(
                (x) => x.id === record.product_id,
              )?.error;
              return (
                <Flex vertical>
                  <Typography.Paragraph>
                    {value}{" "}
                    <Typography.Link
                      href={`/product/edit/${record.product_id}`}
                      target="_blank"
                    >
                      <ExportOutlined />
                    </Typography.Link>
                  </Typography.Paragraph>
                  {success && (
                    <Typography.Text type="success">
                      Lưu thành công
                    </Typography.Text>
                  )}
                  {error && (
                    <Typography.Text type="danger">{error}</Typography.Text>
                  )}
                </Flex>
              );
            },
          },
          {
            title: "",
            width: 120,
            dataIndex: "price",
            align: "right",
            sorter: (a, b) =>
              a.quantity.total_available_stock -
              b.quantity.total_available_stock,
            render(value, record, index) {
              return (
                <Flex vertical justify="center" align="right">
                  <Typography.Text className="money">
                    {numberSeperatorShow(+record.price_range?.max_sale_price)}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Tồn:{" "}
                    <Typography.Text>
                      {record.quantity.total_available_stock}
                    </Typography.Text>
                  </Typography.Text>
                </Flex>
              );
            },
          },
        ]}
      />
    </Space>
  );
}

function TiktokSellerProductList({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        color="primary"
        block
        variant="solid"
        onClick={() => setOpen(true)}
      >
        Copy sang shop khác
      </Button>
      <Modal
        width={750}
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <TiktokSellerProductListSaveModal />
      </Modal>
    </>
  );
}

export default TiktokSellerProductList;

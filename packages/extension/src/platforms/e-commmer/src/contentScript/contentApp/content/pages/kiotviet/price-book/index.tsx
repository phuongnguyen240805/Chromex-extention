import {
  Button,
  Flex,
  Image,
  Input,
  InputNumber,
  InputNumberProps,
  Space,
  Table,
  Typography,
} from "antd";
import { useState } from "react";
import "./index.scss";
import { useRequest } from "ahooks";
import axios from "axios";
import { sendMessageToBackground } from "../../../../../../SHARED/common/states/common";
import SectionHeader from "../../../../../../SHARED/common/components/SectionHeader";
import { chunk } from "lodash";

function Content() {
  const { loading, data, mutate } = useRequest(async () => {
    let stop = false;
    let page = 0;
    let models: {
      id: number;
      itemId: number;
      price: number;
      image: string;
      itemName: string;
      sku: string;
      modelName: string;
      stock: number;
    }[] = [];
    while (!stop) {
      const res = await sendMessageToBackground("GET_PRODUCTS", { page }).catch(
        (e) => {
          stop = true;
          throw e;
        },
      );
      page++;
      if (res.items?.length) {
        models.push(
          ...res.items.map((item: any) => {
            item.models
              .filter((model: any) => model)
              .forEach((model: any) => {
                models.push({
                  id: model.id,
                  itemId: item.id,
                  price: model.price,
                  image: item.images?.[0]?.publicUrl,
                  itemName: item.name,
                  sku: model.sku,
                  modelName: model.name,
                  stock: model.sellableStock,
                });
              });
          }),
        );
      } else {
        stop = true;
      }
    }
    let resKiot = await getKiotVietPriceBook();

    resKiot = resKiot
      .map((item: any) => {
        const model = models.find((model: any) => model?.sku == item?.Code);
        item.image = model?.image;
        item.itemId = model?.itemId;
        item.modelId = model?.id;
        item.itemName = model?.itemName;
        item.modelName = model?.modelName;
        item.stock = model?.stock;
        item.Cost = +item.Cost;
        if (item.Code === "3YZ4430") {
        }
        return item;
      })
      .filter((item: any) => item?.modelId);

    return resKiot;
  });

  const getKiotVietPriceBook = async () => {
    let page = 1;
    let stop = false;
    let skip = 0;
    let pageSize = 100;
    const products = [];
    const token = localStorage.getItem("cat");
    const kvCurrentBranchId = localStorage.getItem("kvCurrentBranchId");
    while (!stop) {
      const resKiot = await axios
        .post(
          "https://api-man1.kiotviet.vn/api/pricebook/getlistitems?PriceBookIds=0&BypassLimitPriceBook=true",
          {
            $inlinecount: "allpages",
            $format: "json",
            OnhandFilter: 0,
            BypassLimitPriceBook: true,
            $top: pageSize,
            $skip: skip,
            Skip: skip,
            Take: pageSize,
            PageSize: pageSize,
            Page: page,
          },
          {
            headers: {
              retailer: "shopsieure912",
              Authorization: `Bearer ${token}`,
              branchid: kvCurrentBranchId,
            },
          },
        )
        .catch((e) => {
          stop = true;
          throw e;
        });
      skip += pageSize;
      page++;
      if (resKiot.data?.Data?.length) {
        products.push(...resKiot.data?.Data);
      } else {
        stop = true;
      }
    }
    return products;
  };

  const [searchValue, setSearchValue] = useState("");
  const formatter: InputNumberProps<number>["formatter"] = (value) => {
    const [start, end] = `${value}`.split(".") || [];
    const v = `${start}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${end ? `${v}.${end}` : `${v}`}`;
  };
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncResult, setSyncResult] = useState<number>(0);
  const { loading: syncLoading, run: syncPriceBook } = useRequest(
    async () => {
      setSyncResult(0);
      for (const chunksIds of chunk(selectedIds, 100)) {
        const res = await sendMessageToBackground("SYNC_PRICE_BOOK", {
          cogsList: chunksIds
            .map((x) => {
              const model = data?.find((item: any) => item.Id == x);
              if (model?.Cost >= 0) {
                return {
                  modelId: model?.modelId,
                  costOfGoodsSold: model?.Cost,
                };
              }
            })
            .filter((x) => x),
        });

        if (res) setSyncResult((prev) => prev + chunksIds.length);
      }
    },
    {
      manual: true,
    },
  );
  return (
    <SectionHeader>
      <Space direction="vertical">
        <Table
          title={() => (
            <Input.Search
              placeholder="Tìm kiếm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          )}
          rowKey="Id"
          loading={{
            tip: "Đang load dữ liệu sản phẩm",
            spinning: loading,
          }}
          virtual
          scroll={{ y: 400, x: "max-content" }}
          pagination={false}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (selectedRowKeys) => {
              setSelectedIds(selectedRowKeys as number[]);
            },
            columnWidth: 50,
            renderCell(value, record, index, originNode) {
              return (
                <Flex vertical align="center" justify="center">
                  {originNode}
                  <Typography.Text type="secondary">
                    {index + 1}
                  </Typography.Text>
                </Flex>
              );
            },
          }}
          columns={[
            {
              title: "",
              dataIndex: "image",
              width: 70,
              align: "center",
              render: (text, record) => {
                return (
                  <Image
                    width={65}
                    height={65}
                    src={record.image}
                    alt=""
                    style={{ objectFit: "contain", borderRadius: 5 }}
                  />
                );
              },
            },
            {
              title: "SKU",
              dataIndex: "sku",
              width: 200,
              render: (text, record) => {
                return (
                  <Flex vertical>
                    <Typography.Text strong>{record.Code}</Typography.Text>

                    <Typography.Paragraph
                      ellipsis={{
                        rows: 2,
                        tooltip: true,
                      }}
                      type="secondary"
                    >
                      {record.modelName ? (
                        <Typography.Text>{record.modelName} </Typography.Text>
                      ) : null}
                      {record.itemName}
                    </Typography.Paragraph>
                  </Flex>
                );
              },
            },

            {
              title: "Giá nhập",
              dataIndex: "Cost",
              align: "right",
              sorter: (a, b) => (a.Cost || 0) - (b.Cost || 0),
              render: (Cost, record) => {
                return (
                  <InputNumber
                    className="money"
                    style={{ textAlign: "right", width: "100%" }}
                    value={Cost}
                    formatter={formatter}
                    parser={(value) =>
                      value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                    }
                    onChange={(value) => {
                      mutate((data) =>
                        data?.map((item) => {
                          if (item.Id == record.Id) {
                            return {
                              ...item,
                              Cost: value,
                            };
                          }
                          return item;
                        }),
                      );
                    }}
                  />
                );
              },
            },
          ]}
          dataSource={
            data?.filter(
              (item: any) =>
                item?.Code?.toLowerCase().includes(searchValue.toLowerCase()) ||
                item?.itemName
                  ?.toLowerCase()
                  .includes(searchValue.toLowerCase()) ||
                item?.modelName
                  ?.toLowerCase()
                  .includes(searchValue.toLowerCase()),
            ) || []
          }
        />
        <Flex justify="end">
          <Button
            color="primary"
            variant={selectedIds.length ? "solid" : "outlined"}
            loading={syncLoading}
            onClick={() => {
              syncPriceBook();
            }}
            disabled={!selectedIds.length}
          >
            Bắt đầu đồng bộ {selectedIds.length} mặt hàng với kho ShipXanh{" "}
            {syncResult > 0 ? `(${syncResult}/${selectedIds.length})` : ""}
          </Button>
        </Flex>
      </Space>
    </SectionHeader>
  );
}

function KiotVietPriceBook() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <Content />
      ) : (
        <Button color="primary" variant="solid" onClick={() => setOpen(true)}>
          Đồng bộ giá với kho ShipXanh
        </Button>
      )}
    </>
  );
}

export default KiotVietPriceBook;

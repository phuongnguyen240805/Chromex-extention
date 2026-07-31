import { Checkbox, Flex, Image, Space, Spin, Table, Typography } from "antd";
import SectionHeader from "../../../../../../SHARED/common/components/SectionHeader";
import { ExportOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import CopyListingForm from "../../../../../../SHARED/common/components/copy-listing";
import { useInViewport, useRequest, useUpdateEffect } from "ahooks";
import { getItemIdShopId } from "../../../pages/shopee/buyer/index.helper";
import { useMessage } from "../../../../app";
import { useObservable } from "@ngneat/react-rxjs";
import {
  ProductCopyStore,
  updateProductCopy,
} from "../../services/product-copy.state";
import { selectEntity } from "@ngneat/elf-entities";
import { GlobalConfigsStore } from "../../../../../../SHARED/common/states/index.state";
import { sendMessageToBackground } from "../../../../../../SHARED/common/states/common";
import CommonTextStatus from "../../../../../../SHARED/common/components/TextStatus";
import { checkProductCopyExist } from "../../../../../../SHARED/utils/helper";
import ProductCopyResultExist from "../../../../../../SHARED/common/components/copy-listing/ResultExist";
interface IItem {
  id: string;
  name: string;
  image: string;
  link: string;
  shop_type: string;
  status: string;
  error: string;
}

const copyProduct = (item: IItem) => {
  switch (item.shop_type) {
    case "shopee": {
      updateProductCopy(item.id, {
        status: "IN_PROGRESS",
      });
      const urlProduct = new URL(item.link);
      const queryString = new URLSearchParams(urlProduct.search);

      const { itemId, shopId } = getItemIdShopId(item.link);
      console.log(itemId, shopId, item.link);

      queryString.set("sx-close", "true");
      queryString.set("sx-auto", "true");
      queryString.set("sx-id", `${item.id}`);
      const url = `https://${`${urlProduct.hostname}/${urlProduct.pathname}`.replace("//", "/")}?${queryString.toString()}`;

      sendMessageToBackground("OPEN_TAB", {
        url,
        active: true,
      });
      break;
    }
    case "1688":
      break;
  }
};
function StatusTag(props: { item: IItem; onSuccess: () => void }) {
  const { item, onSuccess } = props;

  const [product] = useObservable(ProductCopyStore.pipe(selectEntity(item.id)));
  const [currentStatus, setCurrentStatus] = useState<string>(
    product?.status || "",
  );
  const [currentError, setCurrentError] = useState<string>(
    product?.error || "",
  );
  const { run, data, refresh } = useRequest(
    async () => {
      const { itemId, shopId } = getItemIdShopId(item.link);
      const res = await checkProductCopyExist(itemId, shopId);
      return res;
    },
    {
      manual: true,
      cacheKey: `check-exist-${item.id}`,
      cacheTime: 1000 * 60 * 60 * 24,
    },
  );
  useUpdateEffect(() => {
    if (product) {
      if (product?.status === "SUCCESS") {
        refresh();
      }

      if (["ERROR", "SUCCESS"].includes(product?.status || "")) {
        onSuccess();
      }

      setCurrentStatus(product?.status || "");
      setCurrentError(product?.error || "");
    }
  }, [product]);

  const ref = useRef(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (inViewport) {
      run();
    }
  }, [inViewport]);

  return (
    <Flex justify="space-between" gap={10}>
      <div ref={ref}>
        <ProductCopyResultExist exist={data || []} horizontal />
      </div>
      <div>
        {currentStatus ? <CommonTextStatus status={currentStatus} /> : null}
        {currentError ? (
          <Typography.Paragraph type="danger">
            {currentError}
          </Typography.Paragraph>
        ) : null}
      </div>
    </Flex>
  );
}

function BulkCopyProducts(props: { productList: IItem[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const showMessage = useMessage();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const onSave = (noToast?: boolean) => {
    try {
      if (!selected.length && !noToast) {
        showMessage({
          content: "Vui lòng chọn sản phẩm để copy",
          type: "error",
        });
        return;
      }
      const firstProduct = props.productList.find(
        (item) => selected[0] === item.name,
      );
      if (firstProduct) {
        copyProduct(firstProduct);
      }
      //   setIsLoading(true);
    } catch (error) {
      console.error(error);
      showMessage({
        content: "Lỗi khi copy sản phẩm",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Space direction="vertical">
      <CopyListingForm onSave={onSave} loading={isLoading} fromBulk />
      <SectionHeader>
        <Table
          bordered
          dataSource={props.productList}
          rowKey={(record) => record.name}
          pagination={false}
          scroll={{ y: "75vh" }}
          rowSelection={{
            onChange: (selectedRowKeys, selectedRows) => {
              setSelected(selectedRowKeys as string[]);
            },
            selectedRowKeys: selected,
            renderCell(value, record, index, originNode) {
              return (
                <Flex vertical justify="center" align="center">
                  <Typography.Text>{index + 1}</Typography.Text>
                  {originNode}
                </Flex>
              );
            },
          }}
          columns={[
            {
              title: "Ảnh",
              dataIndex: "image",
              key: "image",
              render: (text: string) => {
                return <Image src={text} width={60} height={60} />;
              },
              align: "center",
              width: 80,
            },
            {
              title: "Tên sản phẩm",
              dataIndex: "name",
              key: "name",
              filterSearch: true,
              onFilter: (value, record) => {
                return record.name === value;
              },
              filters: [
                ...props.productList.map((item) => ({
                  text: item.name,
                  value: item.name,
                })),
              ],
              sorter: (a, b) => (a.status === "SUCCESS" ? 1 : -1),
              render: (text: string, record) => {
                return (
                  <Flex vertical gap={10}>
                    <Typography.Link href={record.link} target="_blank">
                      <Typography.Text>{text}</Typography.Text>&nbsp;
                      <ExportOutlined />
                    </Typography.Link>
                    <StatusTag
                      item={record}
                      onSuccess={() => {
                        const newSelected = selected.filter(
                          (item) => item !== record.name,
                        );
                        setTimeout(() => {
                          setSelected(newSelected);
                          if (newSelected[0]) {
                            copyProduct(
                              props.productList.find(
                                (item) => item.name === newSelected[0],
                              ) as IItem,
                            );
                          } else {
                            showMessage({
                              content: "Thành công",
                              type: "success",
                            });
                          }
                        }, 100);
                      }}
                    />
                  </Flex>
                );
              },
            },
          ]}
        />
      </SectionHeader>
    </Space>
  );
}

export default BulkCopyProducts;

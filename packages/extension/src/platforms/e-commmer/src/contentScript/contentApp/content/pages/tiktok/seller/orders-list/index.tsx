import { useRequest } from "ahooks";
import { Button, Flex, Space, Table, Typography } from "antd";
import { sumBy, uniq, uniqBy } from "lodash";

export default function TiktokSellerOrdersList() {
  const { loading, data, run } = useRequest(getOrders, {
    manual: true,
  });
  const { loading: fetchLoading, run: runFetchShipped } = useRequest(
    fetchAllShippedOrders,
    {
      manual: true,
    },
  );

  async function fetchAllShippedOrders() {
    let allOrderIds: string[] = [];
    let offset = 0;
    const count = 200;

    while (true) {
      try {
        const res = await fetch(
          `https://seller-vn.tiktok.com/api/fulfillment/order/list?aid=4068`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              search_condition: {
                condition_list: {
                  search_tab: {
                    value: ["102"],
                  },
                },
              },
              offset: offset,
              count: count,
              sort_info: "6",
              search_cursor: "",
              pagination_type: 0,
            }),
          },
        );
        const responseData = await res.json();
        console.log("Chunk data:", responseData);

        // Tuỳ thuộc API TikTok, danh sách đơn có thể nằm ở data.order_list hoặc similar
        const orderList = responseData?.data?.main_orders || [];
        if (orderList.length === 0) {
          break;
        }

        const orderIds = orderList.map((order: any) => order.main_order_id);
        allOrderIds = [...allOrderIds, ...orderIds];

        // Nếu số lượng trả về ít hơn count, có nghĩa là đã tới trang cuối
        if (orderList.length < count) {
          break;
        }

        offset += count;
      } catch (error) {
        console.error("Error fetching shipped orders:", error);
        break;
      }
    }

    console.log("Toàn bộ mã đơn đang vận chuyển (shipped):", allOrderIds);
    if (allOrderIds.length > 0) {
      chrome.runtime.sendMessage(
        {
          func: "GET_SHIPXANH_ORDERS_BY_IDS",
          params: {
            ids: allOrderIds.join(","),
          },
        },
        (res) => {
          console.log("Thông tin đơn hàng trên ShipXanh:", res);
        },
      );
    }
    return allOrderIds;
  }
  async function getOrders() {
    const checkboxChecked = document.querySelectorAll(
      "div[data-log_module_name='order_list'] label.p-checkbox-checked",
    );
    let orders = [];
    for (const checkbox of checkboxChecked) {
      const order = checkbox.closest("tr");
      if (order) {
        const spanOrderId = order.querySelector(
          "span[data-log_click_for='order_id_link']",
        );
        const orderId = spanOrderId?.textContent;
        const res = await fetch(
          `https://seller-vn.tiktok.com/api/v1/pay/statement/order/list?pagination_type=1&from=0&size=5&reference_id=${orderId}&page_type=12&need_total_amount=true`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data = await res.json();
        console.log(data);
        orders.push({
          orderId: orderId,
          earnedAmount: +data?.data?.sum_settlement_amount?.amount,
        });
      }
    }
    orders = uniqBy(orders, "orderId");
    const totalEarnedAmount = sumBy(orders, "earnedAmount");
    console.log({
      orders,
      totalEarnedAmount,
    });

    return {
      orders,
      totalEarnedAmount,
    };
  }
  return (
    <Space direction="vertical">
      <Space>
        <Button
          onClick={run}
          loading={loading}
          color="primary"
          variant="outlined"
        >
          Xem thu nhập từ các đơn đang chọn
        </Button>
        <Button
          onClick={runFetchShipped}
          loading={fetchLoading}
          color="primary"
          variant="outlined"
        >
          Lấy toàn bộ mã đơn đang giao
        </Button>
      </Space>
      <Table
        pagination={false}
        size="small"
        scroll={{ y: 500 }}
        bordered
        footer={() => (
          <Flex justify="end">
            <Typography.Text type="success">
              {(data?.totalEarnedAmount || 0).toLocaleString()}
            </Typography.Text>
          </Flex>
        )}
        loading={loading}
        dataSource={data?.orders}
        columns={[
          {
            title: "STT",
            dataIndex: "stt",
            key: "stt",
            render: (text, record, index) => {
              return index + 1;
            },
            width: 50,
            align: "center",
          },
          {
            title: "Mã đơn hàng",
            dataIndex: "orderId",
            key: "orderId",
          },
          {
            title: "Thu nhập",
            dataIndex: "earnedAmount",
            key: "earnedAmount",
            render: (text) => {
              return (
                <Typography.Text type="success">
                  {text?.toLocaleString()}
                </Typography.Text>
              );
            },
            align: "right",
          },
        ]}
      />
    </Space>
  );
}

import { useEffect, useState } from "react";
import { reverse } from "lodash";
import { sendMessageToBackground } from "../../../../../../../SHARED/common/states/common";
import { CopyListingStore } from "../../../../../../../SHARED/common/components/copy-listing/index.state";
import { useMessage } from "../../../../../app";
import { useTranslation } from "react-i18next";
import { checkProductCopyExist } from "../../../../../../../SHARED/utils/helper";
import JSZip from "jszip";
import { Button, Col, Row, Spin, Tabs } from "antd";
import { GlobalConfigsStore } from "../../../../../../../SHARED/common/states/index.state";
import {
  CopyOutlined,
  DownloadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import CopyListingForm from "../../../../../../../SHARED/common/components/copy-listing";
import ProductCopyResultExist from "../../../../../../../SHARED/common/components/copy-listing/ResultExist";
import { useObservable } from "@ngneat/react-rxjs";
import { select } from "@ngneat/elf";

async function mapModelFromTiers(productCopy: any): Promise<any[]> {
  return new Promise((r) => {
    let string: any[] = [];
    let index: number[] = [];
    let models: any[] = [];
    let limit = 1;
    productCopy = JSON.parse(JSON.stringify(productCopy));
    let tier_variations = productCopy.tier_variations;

    tier_variations = tier_variations.map((x: any) => {
      if (!x.options?.length) {
        x.options = [""];
      }
      return x;
    });

    for (const i in tier_variations) {
      limit *= tier_variations[i].options!.length || 1;
    }

    const getDataFromModel = (model_name: string, tier_index: number[]) => {
      let model = productCopy.models!.find((x: any) => {
        let check =
          x.extinfo?.tier_index?.toLocaleString() == tier_index.toString() ||
          x.name == model_name;

        if (!check) {
          let model_name_arr = reverse(x.name.split(","));
          let new_name = model_name_arr.join(",");
          check = model_name == new_name;
        }

        return check;
      });

      if (!model && productCopy.models?.length == 1) {
        model = {
          price: productCopy.models[0].price,
          stock: productCopy.models[0].stock,
        } as any;
      }

      let { price, stock, sku, modelid, itemid, extinfo } = model || {};

      const obj = {
        ...model,
        name: model_name,
        id: model_name,
        modelid: modelid?.toString() || model_name,
        price: price !== null && price! > 0 ? price : 0,
        stock: stock !== null && stock! > 0 ? stock : 0,
        extinfo: { ...(extinfo || {}), tier_index },
        itemid: itemid || productCopy.itemid || "",
        sku: sku || "",
        input_price: model && model["input_price"] ? model["input_price"] : 0,
      };

      obj.stock >= 1000000 && (obj.stock = 999999);
      return obj;
    };

    function dequy(hang: any, cur?: any) {
      if (hang >= tier_variations!.length) {
        const model_name = string.join(",");
        // const indexs = index.join(',');

        const obj = getDataFromModel(model_name, index);

        models = [...models, JSON.parse(JSON.stringify(obj))];
        if (models.length == limit) {
          r(models);
        }
        return;
      }

      for (let i = 0; i < tier_variations![hang].options!.length; i++) {
        // hang=hang+1;
        string.push(tier_variations![hang].options![i]);
        index.push(i);
        dequy(hang + 1, tier_variations![hang].options![i]);

        string.pop();
        index.pop();
        // hang=hang-1;
      }
    }

    dequy(0);
  });
}
function tiktokGenTiervariationsAndModels(skus: any[], sale_properties: any[], skuPriceInfo: any[]) {
  let images_size: any[] = [];
  let tier_variations = sale_properties.map((x) => {
    images_size = [
      ...images_size,
      ...(x.has_image
        ? (x.values || x.sale_prop_values).map((y: any) => {
          return y.image;
        })
        : []),
    ];
    return {
      name: x.name || x.prop_name,
      images: x.has_image
        ? (x.values || x.sale_prop_values).map((y: any) => {
          return y.image.url_list[0].replace(
            "resize-jpeg:300:300",
            "origin-jpeg",
          );
        })
        : [],
      options: (x.values || x.sale_prop_values).map((y: any) => {
        return y.name || y.prop_value;
      }),
    };
  });




  let models = skus.map((x) => {
    const skuPrice = skuPriceInfo?.find((item) => item.SkuId === x.sku_id)?.PriceInfo
      ;


    return {
      price: +(skuPrice?.sale_price_decimal ||
        0
      ).toString().replace(".", ""),
      price_before_discount: +(skuPrice?.origin_price_decimal ||
        0
      ).toString().replace(".", ""),
      sku: x.seller_sku || "",
      stock:
        x.stock || (x.quantities ? x.quantities[0].total_quantity || 0 : 0),
      name: (x.properties || x.sku_sale_props)
        .map((p: any) => p.value_name || p.prop_value)
        .join(","),
    };
  });
  return {
    tier_variations,
    models,
    images_size,
  };
}
async function convertRaw(raw: any) {


  const descArr: {
    type: string;
    text?: string;
    image?: any;
    content?: string[];
  }[] = JSON.parse(raw.product_base.desc_detail?.toString());

  let desc = descArr
    .map((x) => {
      if (x.type === "text") {
        return x.text;
      }
      if (x.type == "ul") {
        return `${x.content?.map((y) => `- ${y}`).join("\n")}`;
      }
      if (x.type === "image") {
        return `<img src="${x.image.url_list[0]}" />`;
      }
      return "";
    })
    .join("\n");

  const data: any = {
    itemid: +raw.product_id,
    copy_to: "",
    shipxanh_sku: "",
    shipxanh_weight: 500,
    shipxanh_width: 0,
    shipxanh_length: 0,
    shipxanh_height: 0,
    shipxanh_include_video: false,
    origin_cate: "",
    current_cate: "",
    name: raw.product_base.title,
    description: desc,
    short_description: "",
    origin_url: location.href,
    origin_shop: raw.seller.name,
    price: 0,
    video_info_list: [],
    current_brand: {
      name: "No Brand",
      id: 0,
    },
    stock: 0,
    shopid: raw.seller.seller_id,
    images: raw.product_base.images.map((x: any) => x.url_list[0]),
    categories: [],
    attributes: [],
    targets: ["0"],
    from_seller: true,
    valid_to_copy: false,
    errors: ["yup.current_cate.required"],
    tier_variations: [],
    models: [],
    seller_attributes: [],
    size_chart_image: null,
    size_chart_type: null,
    source: "tiktok",
  };
  const { models, tier_variations, images_size } =
    tiktokGenTiervariationsAndModels(raw.skus, raw.sale_props, raw.skuPriceInfo);

  data.tier_variations = tier_variations;
  data.models = models;
  data.images_size = [...raw.product_base.images, ...images_size];
  data.models = await mapModelFromTiers(data);


  return data;
}

function TiktokBuyerProduct(props: { pathname: string }) {
  const { pathname } = props;
  const [product, setProduct] = useState<any>(null);
  const [detailProductActiveTab] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
  );

  useEffect(() => {
    const id = pathname.split("/").pop();
    if (id) {
      window.open(`https://shop.tiktok.com/vn/pdp/${id}`, "_self");
    }
  }, []);

  // useEffect(() => {
  //   const currentHTML = document.querySelector("html")?.innerHTML;
  //   if (currentHTML) {
  //     sendMessageToBackground("SAVE_TIKTOK_COOKIE");
  //     const regex = /id="__MODERN_ROUTER_DATA__">([\s\S]*?)<\/script>/;

  //     // Thực hiện tìm kiếm
  //     const match = currentHTML.match(regex);

  //     if (match && match[1]) {
  //       const data = match[1].trim(); // Lấy dữ liệu và loại bỏ khoảng trắng thừa

  //       // Nếu dữ liệu là JSON, parse nó
  //       try {
  //         const jsonData = JSON.parse(data);
  //         console.log("jsonData", jsonData);

  //         const productInfo =
  //           jsonData?.loaderData?.["(name$)/(id)/page"]?.initialData
  //             ?.productInfo;
  //         if (productInfo) {

  //           convertRaw(productInfo).then((res) => {
  //             setProduct({ ...res });
  //           });
  //         } else {
  //           throw "Không tìm thấy dữ liệu sản phẩm";
  //         }
  //       } catch (error) {
  //         console.error("Error parsing JSON:", error);
  //       }
  //     } else {
  //       const id = pathname.split("/").pop();
  //       fetch(
  //         `https://www.tiktok.com/view/product/${id}?__loader=(shop$)/(pdp)/(name$)/(id)/page&__ssrDirect=true`,
  //       )
  //         .then((res) => res.json())
  //         .then((data) => {
  //           if (data.initialData) {
  //             convertRaw(data.initialData.productInfo).then((res) => {
  //               setProduct({ ...res });
  //             });
  //           } else {
  //             throw "Không tìm thấy dữ liệu sản phẩm";
  //           }
  //         });
  //     }
  //   }
  // }, [pathname]);

  const [loading, setLoading] = useState(false);
  const [exist, setExist] = useState<any[]>([]);
  const [isDone, setIsDone] = useState(false);
  const showMessage = useMessage();
  const { t } = useTranslation();

  const onSaveProduct = async () => {
    try {
      setLoading(true);
      const { marketplaces, isGetPriceAfterDiscount } = CopyListingStore.query(
        (s) => s,
      );
      const res = await sendMessageToBackground("SAVE_PRODUCT_COPY", {
        data: product,
        marketplaces,
        isGetPriceAfterDiscount,
      });

      if (res.success) {
        setLoading(false);
        const { itemid, shopid } = product;
        checkProductCopyExist(itemid, shopid, true).then((res) => {
          setExist(res);
        });
        setIsDone(true);
        showMessage({
          type: "success",
          content: t("success_open_pending_list"),
        });
      } else throw new Error(res.message);
    } catch (error) {
      showMessage({
        type: "error",
        content:
          error instanceof Error ? error.message : "Lỗi, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadImages = async () => {
    setLoading(true);
    try {
      if (product) {
        const images = product.images;

        let classifies: {
          name: string;
          images: string[];
        }[] = [];

        if (product.tier_variations?.[0]?.images?.length) {
          classifies = product.tier_variations?.[0]?.options?.map(
            (x: any, i: string | number) => {
              const image = product.tier_variations?.[0]?.images?.[i];
              return {
                name: x,
                images: image ? [image] : [],
              };
            },
          );
        }

        // download images and classifies images as zip
        const zip = new JSZip();

        for (const i in images) {
          const url = images[i];
          try {
            const img = await fetch(url);
            const imgBlob = await img.blob();
            const contentType = img.headers.get("content-type");
            let extension = contentType?.split("/")[1];
            if (!["png", "jpg", "jpeg"].includes(extension || "")) {
              extension = "jpg";
            }
            const filename = `${+i + 1}.${extension || "jpg"}`;
            zip.file(filename, imgBlob);
          } catch (error) {
            console.error(`Failed to fetch image at ${url}`, error);
          }
        }

        for (const ii in classifies) {
          const classify = classifies[ii];
          if (!classify.images.length) continue;
          const folder = zip.folder(classify.name);
          for (const j in classify.images) {
            try {
              const url = classify.images[j];

              const img = await fetch(url);
              const imgBlob = await img.blob();
              // get file extension
              const contentType = img.headers.get("content-type");
              let extension = contentType?.split("/")[1];
              ``;
              if (!["png", "jpg", "jpeg"].includes(extension || "")) {
                extension = "jpg";
              }
              const filename = `${+j + 1}.${extension || "jpg"}`;
              folder?.file(filename, imgBlob);
            } catch (error) {
              console.error(`Failed to fetch image at ${j}`, error);
            }
          }
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${product.name || "taobao-product-images"}.zip`);
      }
    } catch (error) {
      showMessage({
        type: "error",
        content:
          error instanceof Error ? error.message : "Lỗi, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      {pathname}
      {product ? (
        <Tabs
          activeKey={detailProductActiveTab}
          size="small"
          onChange={(key) => {
            GlobalConfigsStore.update((s) => ({
              ...s,
              content: {
                ...s.content,
                detailProductActiveTab: key,
              },
            }));
          }}
          items={[
            {
              key: "copy",
              label: t("copy_product"),
              icon: <CopyOutlined />,
              children: (
                <>
                  <CopyListingForm
                    isDone={isDone}
                    outlineBtn={exist.length > 0}
                    loading={loading}
                    onSave={() => {
                      onSaveProduct();
                    }}
                  />
                  {exist.length > 0 && (
                    <>
                      <ProductCopyResultExist exist={exist} />
                    </>
                  )}
                </>
              ),
            },
            {
              key: "download",
              label: t("download_video_images"),
              icon: <DownloadOutlined />,
              children: (
                <Spin spinning={loading}>
                  <Row gutter={4}>
                    <Col span={24}>
                      <Button
                        block
                        icon={<PictureOutlined />}
                        color="primary"
                        variant="solid"
                        onClick={() => {
                          downloadImages();
                        }}
                      >
                        {t("download_images")}
                      </Button>
                    </Col>
                  </Row>
                </Spin>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}

export default TiktokBuyerProduct;

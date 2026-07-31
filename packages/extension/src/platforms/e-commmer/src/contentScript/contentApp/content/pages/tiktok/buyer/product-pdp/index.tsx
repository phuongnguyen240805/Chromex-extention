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
                    let model_name_arr = reverse((x.name || "").split(","));
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
                const obj = getDataFromModel(model_name, index);

                models = [...models, JSON.parse(JSON.stringify(obj))];
                if (models.length == limit) {
                    r(models);
                }
                return;
            }

            for (let i = 0; i < tier_variations![hang].options!.length; i++) {
                string.push(tier_variations![hang].options![i]);
                index.push(i);
                dequy(hang + 1, tier_variations![hang].options![i]);

                string.pop();
                index.pop();
            }
        }

        dequy(0);
    });
}

function tiktokGenTiervariationsAndModels(skus: any[], sale_properties: any[], skusPrice: any) {
    let images_size: any[] = [];
    let tier_variations = (sale_properties || []).map((x) => {
        images_size = [
            ...images_size,
            ...(x.has_image
                ? (x.property_values).map((y: any) => {
                    return y.image;
                })
                : []),
        ];
        return {
            name: x.property_name,
            images: x.has_image
                ? (x.property_values).map((y: any) => {
                    return (y.image?.url_list?.[0] || "").replace(
                        "resize-jpeg:300:300",
                        "origin-jpeg",
                    );
                })
                : [],
            options: (x.property_values).map((y: any) => {
                return y.property_value_name;
            }),
        };
    });

    let models = (skus || []).map((x) => {
        const skuPrice = skusPrice?.[x.sku_id];

        return {
            price: +(skuPrice?.sale_price_decimal || 0).toString().replace(".", ""),
            price_before_discount: +(skuPrice?.origin_price_decimal || 0).toString().replace(".", ""),
            sku: x.seller_sku || "",
            stock: x.sku_quantity?.available_quantity || 0,
            name: (x.property_pairs || [])
                .map((p: any) => p.sku_property_value_name)
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
    const productModel = raw.product_model;
    const promotionModel = raw.promotion_model;
    const sellerModel = raw.seller_model;

    let desc = "";
    try {
        const descArr: any[] = JSON.parse(productModel.description || "[]");
        desc = descArr
            .map((x) => {
                if (x.type === "text") {
                    return x.text;
                }
                if (x.type === "image") {
                    return `<img src="${x.image?.url_list?.[0] || ""}" />`;
                }
                return "";
            })
            .join("\n");
    } catch (e) {
        console.error("Error parsing description", e);
    }

    const data: any = {
        itemid: +productModel.product_id,
        copy_to: "",
        shipxanh_sku: "",
        shipxanh_weight: 500,
        shipxanh_width: 0,
        shipxanh_length: 0,
        shipxanh_height: 0,
        shipxanh_include_video: false,
        origin_cate: "",
        current_cate: "",
        name: productModel.name,
        description: desc,
        short_description: "",
        origin_url: location.href,
        origin_shop: sellerModel?.shop_name || "",
        price: 0,
        video_info_list: [],
        current_brand: {
            name: "No Brand",
            id: 0,
        },
        stock: 0,
        shopid: productModel.seller_id,
        images: (productModel.images || []).map((x: any) => x.url_list?.[0] || ""),
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

    const { models, tier_variations, images_size } = tiktokGenTiervariationsAndModels(
        productModel.skus,
        productModel.sale_properties,
        promotionModel?.promotion_product_price?.skus_price
    );

    data.tier_variations = tier_variations;
    data.models = models;
    data.images_size = [...(productModel.images || []), ...images_size];
    data.models = await mapModelFromTiers(data);

    return data;
}

export default function TiktokBuyerProductPdp(props: { pathname: string }) {
    const { pathname } = props;
    const [product, setProduct] = useState<any>(null);
    const [detailProductActiveTab] = useObservable(
        GlobalConfigsStore.pipe(select((s) => s.content?.detailProductActiveTab)),
    );

    useEffect(() => {
        console.log("TiktokBuyerProductPdp");
        const currentHTML = document.querySelector("html")?.innerHTML;
        if (currentHTML) {
            console.log("Current HTML:", currentHTML);
            const regex = /id="__MODERN_ROUTER_DATA__"[^>]*>([\s\S]*?)<\/script>/;
            const match = currentHTML.match(regex);
            console.log("Match:", match);

            if (match && match[1]) {
                const data = match[1].trim();

                try {
                    const jsonData = JSON.parse(data);
                    console.log("JSON Data:", jsonData);
                    let productInfo =
                        jsonData?.loaderData?.["(region)/pdp/(product_name_slug$)/(product_id)/page"]?.page_config?.components_map?.find((x: any) => x.component_name === 'product_info')?.component_data?.product_info;

                    if (!productInfo) {
                        productInfo =
                            jsonData?.loaderData?.["shop/(region)/pdp/(product_name_slug$)/(product_id)/page"]?.page_config?.components_map?.find((x: any) => x.component_name === 'product_info')?.component_data?.product_info;
                    }

                    if (productInfo) {
                        convertRaw(productInfo).then((converted) => {
                            console.log("Converted Product:", converted);
                            setProduct(converted);
                        });
                    } else {
                        throw "Không tìm thấy dữ liệu sản phẩm";
                    }
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            }
        }
    }, [pathname]);

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
                            const contentType = img.headers.get("content-type");
                            let extension = contentType?.split("/")[1];
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
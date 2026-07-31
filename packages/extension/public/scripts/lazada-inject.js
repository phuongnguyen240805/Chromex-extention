sessionStorage.removeItem("lazada-product-info");
sessionStorage.removeItem("lazada-shop-id");

setTimeout(() => {
  // Get product data from Lazada's window object
  let productData = JSON.stringify({
    ...window?.__moduleData__?.data?.root?.fields,
  });
  productData = JSON.parse(productData);

  if (productData) {
    // Create a deep copy of the product data

    // Remove unnecessary fields from the product data
    delete productData.product?.desc;
    delete productData.promotionTags;
    delete productData.htmlRender;
    delete productData.deliveryOptions;
    delete productData.warranties;
    delete productData.product?.highlights;

    // Save product info to sessionStorage
    sessionStorage.setItem("lazada-product-info", JSON.stringify(productData));

    // Save shop ID to sessionStorage
    sessionStorage.setItem("lazada-shop-id", productData.seller?.sellerId);
  }
}, 500);

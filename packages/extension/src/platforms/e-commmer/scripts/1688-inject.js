sessionStorage.removeItem("1688-product-info");

setTimeout(() => {
  // Get product data from 1688's window object
  // Check if __INIT_DATA exists before accessing it using bracket notation
  const productData = window["__INIT_DATA"]
    ? { ...window["__INIT_DATA"].globalData }
    : undefined;
  console.log("productData", productData);
  if (productData?.offerBaseInfo) {
    // Save product info to sessionStorage
    sessionStorage.setItem("1688-product-info", JSON.stringify(productData));
  } else {
    document.querySelectorAll("script").forEach((script) => {
      if (script.textContent?.includes("window.contextPath,")) {
        if (script.textContent) {
          const regex = /\(window\.contextPath,([\s\S]*?)\)\;/;

          // Thực hiện tìm kiếm
          const match = script.textContent.match(regex);

          if (match && match[1]) {
            const data = match[1].trim(); // Lấy dữ liệu và loại bỏ khoảng trắng thừa
            try {
              // Sanitize numeric keys by wrapping them in quotes
              const sanitizedData = data.replace(/([{,]\s*)(\d+):/g, '$1"$2":');
              const jsonData = JSON.parse(sanitizedData);
              console.log("jsonData", jsonData);

              const productData = jsonData.result?.data?.Root?.fields?.dataJson;
              sessionStorage.setItem(
                "1688-product-info",
                JSON.stringify(productData),
              );
            } catch (error) {
              console.error(
                "Dữ liệu không phải JSON hợp lệ:",
                error,
                "Original data:",
                data,
              );
            }
          }
        }
      }
    });
  }
}, 1000);

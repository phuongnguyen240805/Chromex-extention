const originalFetch = window.fetch;

console.log("isAliexpressProduct");
// Ghi đè phương thức fetch gốc của window
window.fetch = async function (...args) {
  // Biến để kiểm tra xem yêu cầu có phải tới các API được theo dõi hay không
  let isTargetApi = false;

  // Gọi phương thức fetch gốc với các tham số ban đầu
  const response = await originalFetch(...args);

  // Lấy URL từ tham số đầu tiên của fetch
  const url = args[0];

  console.log(url);

  // Kiểm tra nếu URL thuộc một trong các API cần theo dõi
  if (/api\/v4\/pdp\/get_pc?/.test(url) || /api\/v4\/pdp\/get_rw?/.test(url)) {
    isTargetApi = true;
  }

  // Nếu đúng là API cần theo dõi, xử lý phản hồi
  if (isTargetApi) {
    // Clone phản hồi để đọc dữ liệu JSON
    response
      .clone()
      .json()
      .then((data) => {
        // Lưu dữ liệu vào sessionStorage
        console.log(data);
      });
  }

  // Trả về phản hồi gốc
  return response;
};

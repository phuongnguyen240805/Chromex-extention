import { getEntityAbout } from "../services/fb-helper";
import { notify } from "../../../contents/core/helper";

export const initProfileInsights = (settings: any) => {
  if (settings.profileInsights === false) {
    console.log("🚀 FB Profile Insights - DISABLED by config");
    return;
  }
  console.log("🚀 FB Profile Insights - Initialized");

  // Hàm lấy UID từ URL hoặc DOM
  function getProfileId() {
    // Thử lấy từ URL (ví dụ: facebook.com/zuck)
    // Hoặc từ các biến global của FB nếu có thể
    // Ở đây ta dùng một cách đơn giản là tìm trong DOM
    const metaUid = (document.querySelector('meta[property="al:android:url"]') as HTMLMetaElement)?.content;
    if (metaUid) return metaUid.split('fb://profile/')[1];
    
    return null;
  }

  async function analyzeProfile() {
    const uid = getProfileId();
    if (!uid) return;

    console.log("Analyzing profile UID:", uid);
    notify({ msg: "Đang phân tích Profile: " + uid });

    try {
      const data = await getEntityAbout(uid);
      if (data) {
        console.log("Profile Data:", data);
        
        // Gửi dữ liệu về Sidepanel
        chrome.runtime.sendMessage({
          type: 'ANALYTICS_DATA',
          data: {
            uid: data.uid,
            name: data.name,
            avatar: data.avatar,
            url: data.url,
            type: data.type
          }
        });

        notify({ msg: "Phân tích xong: " + data.name });
      }
    } catch (e) {
      console.error("Analysis failed", e);
    }
  }

  // Chạy khi load trang và khi URL thay đổi (Single Page App)
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      analyzeProfile();
    }
  }, 2000);

  analyzeProfile();
};

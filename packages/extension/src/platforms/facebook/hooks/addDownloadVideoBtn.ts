import { onElementsAdded, closest, injectCssCode } from "../../../contents/core/helper";

export const initAddDownloadVideoBtn = (settings: any) => {
  if (settings.fbVideoDownload === false) {
    console.log("FB AIO: Video Downloader DISABLED by config");
    return;
  }

  console.log("🎬 FB Video Downloader - Real Logic Enabled");

  const className = "fb-aio-download-btn";

  // Thêm CSS cho nút
  injectCssCode(`
    .${className} {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 9999;
      background: rgba(0, 123, 255, 0.8);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: background 0.3s;
    }
    .${className}:hover {
      background: rgba(0, 105, 217, 1);
    }
  `);

  // Lắng nghe khi có video mới xuất hiện trên màn hình
  onElementsAdded("video", (videos: any) => {
    for (let video of videos) {
      // Tìm container bao quanh video
      const container = closest(video, "[data-video-id]") || video.parentElement;
      
      if (!container || container.querySelector(`.${className}`)) continue;

      // Tạo nút download
      const btn = document.createElement("button");
      btn.className = className;
      btn.innerHTML = "⬇️ Tải Video";
      btn.title = "Tải video này về máy";

      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Facebook thường dùng m3u8 hoặc blob, cách đơn giản nhất là chuyển hướng qua tool download
        // Oder lấy URL hiện tại của bài viết
        const videoUrl = window.location.href;
        window.open(`https://fdown.net/download.php?url=${encodeURIComponent(videoUrl)}`, '_blank');
      };

      // Đảm bảo container có position relative để nút hiển thị đúng góc
      if (window.getComputedStyle(container).position === 'static') {
        (container as HTMLElement).style.position = 'relative';
      }

      container.appendChild(btn);
    }
  });
};

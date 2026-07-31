# Kiến Trúc Monorepo Chromex & Social AIO

Tài liệu này mô tả định hướng kiến trúc chuẩn hóa cho hệ sinh thái **Chromex** và các công cụ mạng xã hội (**Social AIO Tools**). 

Mục tiêu cốt lõi là thiết kế theo mô hình **Modular Monorepo**, đảm bảo tính **đóng gói cao (self-contained)** cho từng nền tảng, cho phép dễ dàng tách ghép, tái sử dụng và đóng gói thành các tiện ích mở rộng độc lập (standalone extension) mà không bị trùng lặp mã nguồn (zero code duplication).

---

## 🎯 Ý Tưởng Tổng Quan & Mục Tiêu

1. **Độc lập nền tảng**: Mỗi nền tảng (Facebook, Instagram, TikTok, Threads, Medium...) được tổ chức thành một package riêng biệt hoàn toàn tự chứa (self-contained).
2. **Khả năng mang đi (Portability)**: Khi cần phát triển một tiện ích mới chỉ chuyên biệt cho một mạng xã hội (ví dụ: *Facebook Tools Pro*), lập trình viên chỉ cần sao chép hoặc cài đặt duy nhất thư mục package tương ứng (ví dụ: `facebook-tools`) cùng với nhân lõi `social-core` là có ngay đầy đủ các kịch bản nội dung (content scripts), giao diện (UI), hook và cấu hình manifest.
3. **Tối ưu hóa nhân lõi (Core Isolation)**: Toàn bộ logic dùng chung như Service Worker (Background), thanh điều hướng nổi (Dock bar), hệ thống lưu trữ (Storage), liên lạc (Messaging) và các quy tắc chặn mạng (`DeclarativeNetRequest`) được gom chung vào package `social-core`.
4. **Lớp vỏ mở rộng mỏng (Thin Extension Shell)**: Tiện ích tổng hợp chính (`extension`) đóng vai trò như một lớp vỏ tích hợp, chỉ việc nhập (import) và đăng ký (register) các module nền tảng cần thiết.

---

## 📂 Cây Thư Mục Tiêu Chuẩn

```text
chromex/                                      ← Thư mục gốc Monorepo
│
├── packages/
│   │
│   ├── social-core/                          ← 📦 NHÂN LÕI CHUNG (BACKGROUND & SOCIAL AIO CORE)
│   │   ├── src/
│   │   │   ├── background/                   ← DUY NHẤT 1 BACKGROUND WORKER Ở ĐÂY
│   │   │   │   ├── index.ts                  ← Điểm vào chính của Service Worker
│   │   │   │   ├── platform-registrar.ts     ← Hệ thống đăng ký động các nền tảng
│   │   │   │   ├── dnr-rules.ts              ← Quản lý tập luật DeclarativeNetRequest
│   │   │   │   ├── storage.ts                ← Trình quản lý lưu trữ đồng bộ
│   │   │   │   ├── dock-manager.ts           ← Xử lý vòng đời thanh Dock
│   │   │   │   ├── messaging.ts              ← Cầu nối liên lạc (Message Router)
│   │   │   │   └── utils.ts                  ← Các tiện ích hỗ trợ nền ngầm
│   │   │   ├── dock/                         ← Giao diện thanh Dock, MegaMenu, PremiumPanel...
│   │   │   ├── components/                   ← Các React Component chung (BaseTool, Toast, Tooltip...)
│   │   │   ├── hooks/                        ← Custom hook dùng chung (useFocusRestore, useShortcuts...)
│   │   │   ├── store/                        ← Quản lý trạng thái chung (Zustand Store)
│   │   │   ├── services/                     ← Các dịch vụ API, gửi/nhận thông điệp
│   │   │   ├── utils/                        ← Hằng số, xử lý DOM, kiểm tra bản quyền...
│   │   │   ├── register.ts                   ← Xuất API đăng ký: export { registerPlatform }
│   │   │   └── types.ts                      ← Định nghĩa kiểu dữ liệu dùng chung (Shared Types)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── facebook-tools/                       ← 🔥 PACKAGE ĐỘC LẬP CHO FACEBOOK
│   │   ├── src/
│   │   │   ├── content/                      ← Script nội dung chuyên biệt cho Facebook
│   │   │   ├── hooks/                        ← Hook tính năng: Tải video, chống lừa đảo, chặn Seen...
│   │   │   ├── services/                     ← Logic nghiệp vụ, thao tác hàng loạt (Bulk Operations)
│   │   │   ├── ui/                           ← Các thẻ công cụ, bảng điều khiển FacebookToolsPanel
│   │   │   ├── register.ts                   ← Đăng ký tính năng vào hệ thống nhân lõi chung
│   │   │   ├── manifest.config.ts            ← Tùy biến quyền (permissions) và biểu tượng riêng
│   │   │   └── index.ts                      ← Xuất điểm vào: export { registerFacebookTools }
│   │   ├── package.json                      ← Khai báo phụ thuộc: dependencies: ["@chromex/social-core"]
│   │   └── README.md
│   │
│   ├── instagram-tools/                      ← Cấu trúc chuẩn hóa tương tự package facebook-tools
│   ├── tiktok-tools/                         ← Cấu trúc chuẩn hóa tương tự package facebook-tools
│   ├── threads-tools/                        ← Cấu trúc chuẩn hóa tương tự package facebook-tools
│   ├── medium-tools/                         ← Cấu trúc chuẩn hóa tương tự package facebook-tools
│   └── security-tools/                       ← Các công cụ bảo mật, kiểm tra hoặc trêu đùa (Virus/Troll)
│
│   ├── extension/                            ← 🟣 TIỆN ÍCH CHÍNH TỔNG HỢP (CHROMEX AI + SOCIAL AIO)
│   │   ├── src/
│   │   │   ├── background/                   ← Tái xuất (re-export) Service Worker từ social-core
│   │   │   │   └── index.ts
│   │   │   ├── platforms/                    ← Nhập và kích hoạt toàn bộ các nền tảng
│   │   │   │   └── index.ts
│   │   │   ├── sidepanel/                    ← Giao diện trợ lý AI Chromex Sidepanel
│   │   │   └── content/                      ← Script nội dung hỗ trợ trích xuất văn bản cho AI
│   │   ├── public/                           ← Tệp tĩnh: manifest, biểu tượng, tệp sidepanel.html...
│   │   ├── plasmo.config.ts                  ← Cấu hình biên dịch Plasmo
│   │   └── package.json                      ← Phụ thuộc: @chromex/social-core + tất cả *-tools
│   │
│   ├── shared/                               ← Các tiện ích và định nghĩa chia sẻ đa nền tảng
│   ├── bridge/                               ← Giao thức cầu nối Native Messaging
│   └── native-host/                          ← Mã nguồn ứng dụng máy chủ cục bộ (Native Host)
│
├── templates/
│   └── standalone-platform/                  ← Mẫu dự án để khởi tạo nhanh một extension độc lập
│       ├── src/
│       ├── plasmo.config.ts
│       ├── package.json
│       └── manifest.config.ts
│
├── scripts/                                  ← Tệp lệnh tự động hóa quy trình biên dịch
│   ├── build-extension.mjs                   ← Đóng gói tiện ích tổng hợp
│   └── build-standalone-facebook.mjs         ← Đóng gói tiện ích mở rộng độc lập cho Facebook
│
├── package.json                              ← Cấu hình không gian làm việc gốc (Root Workspace)
├── tsconfig.base.json                        ← Cấu hình biên dịch TypeScript nền tảng
└── .gitignore
```

---

## 🔄 Luồng Hoạt Động Kỹ Thuật Nền Ngầm (Mô hình 1 Nhạc Trưởng - Nhiều Nhạc Công)

Để tuân thủ tuyệt đối quy định **chỉ có 1 Service Worker duy nhất** của Google Chrome Manifest V3 trong khi vẫn giữ nguyên tính độc lập mã nguồn, hệ thống áp dụng cơ chế ủy quyền ngầm:

### 1. Background riêng cho từng mục (Các Nhạc Công)
* Mỗi package mục tiêu tự định nghĩa một tệp xử lý ngầm độc lập (ví dụ: `facebook-tools/src/background.ts`).
* File này chịu trách nhiệm trọn vẹn cho các nghiệp vụ chuyên biệt của mục đó: cập nhật bộ quy tắc DeclarativeNetRequest (DNR) chống lừa đảo riêng của FB, lắng nghe thay đổi cấu hình bộ nhớ của riêng FB.

### 2. Quản lý nền ngầm trung tâm (Nhạc Trưởng Lõi)
* Service Worker thực sự duy nhất được khai báo với trình duyệt nằm tại `social-core/src/background/index.ts`.
* Khi tiện ích khởi động, "Nhạc trưởng" này sẽ tự động nạp danh sách các mục đã đăng ký và đồng loạt kích hoạt ngầm toàn bộ các file background chuyên biệt thông qua lệnh:
  ```typescript
  platformRegistrar.initializeBackgroundAll();
  ```

### 3. Khi biên dịch Tiện ích chính (`extension`)
* Lớp vỏ chính import tệp xuất của tất cả các công cụ: `registerFacebookTools()`, `registerInstagramTools()`, v.v.
* Trình biên dịch của Plasmo gộp toàn bộ mã nguồn một cách tối ưu, tạo ra một tiện ích toàn diện tích hợp trọn vẹn cả AI Sidepanel và thanh công cụ đa năng.

### 4. Khi biên dịch Tiện ích độc lập (Standalone Extension)
* Dùng template `standalone-platform`, cấu hình nhập trực tiếp package nền tảng mong muốn (ví dụ: `@chromex/facebook-tools`) cùng với `@chromex/social-core`.
* Kết quả xuất ra một tiện ích mở rộng gọn nhẹ, chuyên nghiệp, hoạt động mượt mà chỉ riêng trên nền tảng đích mà không mang theo các tệp thừa của nền tảng khác.
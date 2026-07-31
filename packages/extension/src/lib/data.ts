import { 
  // Facebook
  Users, Download, Shield, Trash2, UserPlus, FileText, BarChart2, Share2,
  Home, Lock, ThumbsUp, Settings, Smartphone, MessageSquare, Video, MessageCircleX, Bookmark, Eye,
  QrCode, Wifi, Key, Image, Mail, Gauge, Moon, DollarSign, Palette, Calendar, Percent, Clock,
  Type, Copy, Database, Code, Wrench, Layers, Link, AlertTriangle, Zap, Calculator,
  // Instagram
  Camera, Heart, User, Search,
  // TikTok
  Music, TrendingUp, Play,
  // Threads
  AtSign, Hash, MessageCircle, EyeOff, Layout,
  // Virus
  Terminal, Monitor, HardDrive, Cpu, Laptop, MonitorX, Wind, Bug, Bomb, Grid, Ghost
} from "lucide-react"

export type PlatformType = "facebook" | "instagram" | "tiktok" | "threads" | "virus"

export interface Tool {
  name: string
  i18nKey?: string
  icon: React.ComponentType<any>
  color: string
  link?: string
  description?: string
}

export interface ToolCategory {
  title: string
  i18nKey?: string
  tools: Tool[]
}

// ==================== FACEBOOK ====================
export const FACEBOOK_TOOLS: ToolCategory[] = [
  {
    title: "FACEBOOK FEATURES",
    i18nKey: "fb_cat_features",
    tools: [
      { name: "Trang chủ", i18nKey: "fb_tool_home", icon: Home, color: "#1877F2", description: "Truy cập nhanh trang chủ Facebook với các tính năng tùy biến giao diện." },
      { name: "Bảo mật tài khoản", i18nKey: "fb_tool_security", icon: Lock, color: "#10b981", description: "Kiểm tra và thiết lập các lớp bảo mật tối ưu cho tài khoản của bạn." },
      { name: "Bạn bè", i18nKey: "fb_tool_friends", icon: Users, color: "#f59e0b", description: "Quản lý danh sách bạn bè, lọc bạn bè không tương tác tự động." },
      { name: "Trang đã thích", i18nKey: "fb_tool_liked_pages", icon: ThumbsUp, color: "#ec4899", description: "Xem và quản lý tất cả các trang fanpage bạn đã nhấn thích." },
      { name: "Bài viết của tôi", i18nKey: "fb_tool_my_posts", icon: FileText, color: "#8b5cf6", description: "Tìm kiếm và quản lý các bài viết cũ trên dòng thời gian của bạn." },
      { name: "Nhóm đã tham gia", i18nKey: "fb_tool_joined_groups", icon: Users, color: "#06b6d4" },
      { name: "Quản lý nhóm", i18nKey: "fb_tool_group_settings", icon: Settings, color: "#ef4444" },
      { name: "Đang theo dõi", i18nKey: "fb_tool_following", icon: Eye, color: "#3b82f6" }
    ]
  },
  {
    title: "MANAGEMENT TOOLS",
    i18nKey: "fb_cat_management",
    tools: [
      { name: "Công cụ Backup", i18nKey: "fb_tool_backup", icon: Download, color: "#10b981" },
      { name: "Trò chuyện AI", i18nKey: "fb_tool_ai_chat", icon: MessageSquare, color: "#6366f1" },
      { name: "Tải video", i18nKey: "fb_tool_video_download", icon: Video, color: "#f59e0b" },
      { name: "Quét bình luận", i18nKey: "fb_tool_comment_scan", icon: MessageCircleX, color: "#ec4899" },
      { name: "Quản lý Block List", i18nKey: "fb_tool_block_list", icon: Shield, color: "#ef4444" },
      { name: "Mục đã lưu", i18nKey: "fb_tool_bookmarks", icon: Bookmark, color: "#8b5cf6" },
      { name: "Lấy ID Facebook", i18nKey: "fb_tool_get_id", icon: Zap, color: "#3b82f6" },
      { name: "Cấm Toàn Cầu", i18nKey: "fb_tool_global_ban", icon: AlertTriangle, color: "#f59e0b" }
    ]
  },
  {
    title: "FREE TOOLS",
    i18nKey: "fb_cat_free",
    tools: [
      { name: "Gmail Dot Trick", i18nKey: "fb_tool_gmail_dot", icon: Mail, color: "#ef4444" },
      { name: "Tạo Mã QR", i18nKey: "fb_tool_qr_gen", icon: QrCode, color: "#3b82f6" },
      { name: "IP của tôi là gì?", i18nKey: "fb_tool_my_ip", icon: Wifi, color: "#06b6d4" },
      { name: "Tạo Mật Khẩu", i18nKey: "fb_tool_pass_gen", icon: Key, color: "#10b981" },
      { name: "Làm Đẹp Screenshot", i18nKey: "fb_tool_screenshot_beauty", icon: Image, color: "#ec4899" },
      { name: "Photo Booth", i18nKey: "fb_tool_photo_booth", icon: Smartphone, color: "#f59e0b" },
      { name: "Tạo Chữ Ký Email", i18nKey: "fb_tool_email_sig", icon: FileText, color: "#8b5cf6" },
      { name: "Tạo CV", i18nKey: "fb_tool_cv_gen", icon: FileText, color: "#1877F2" }
    ]
  },
  {
    title: "UTILITY TOOLS",
    i18nKey: "fb_cat_utility",
    tools: [
      { name: "Kiểm tra tốc độ gõ", i18nKey: "fb_tool_typing_test", icon: Gauge, color: "#3b82f6" },
      { name: "Vòng quay may mắn", i18nKey: "fb_tool_lucky_wheel", icon: Zap, color: "#f59e0b" },
      { name: "Máy Tính BMI", i18nKey: "fb_tool_bmi_calc", icon: Calculator, color: "#10b981" },
      { name: "Máy Tính Giấc Ngủ", i18nKey: "fb_tool_sleep_calc", icon: Moon, color: "#06b6d4" },
      { name: "Chuyển Đổi Tiền Tệ", i18nKey: "fb_tool_currency_conv", icon: DollarSign, color: "#ec4899" },
      { name: "Kiểm Tra Độ Tương Phản Màu", i18nKey: "fb_tool_contrast_checker", icon: Palette, color: "#8b5cf6" },
      { name: "Trích Xuất Bảng Màu", i18nKey: "fb_tool_palette_extract", icon: Palette, color: "#ef4444" },
      { name: "Tính Ngày", i18nKey: "fb_tool_date_calc", icon: Calendar, color: "#3b82f6" }
    ]
  },
  {
    title: "CONVERSION & CODE TOOLS",
    i18nKey: "fb_cat_code",
    tools: [
      { name: "Máy Tính Phần Trăm", i18nKey: "fb_tool_percent_calc", icon: Percent, color: "#f59e0b" },
      { name: "Pomodoro Timer", i18nKey: "fb_tool_pomodoro", icon: Clock, color: "#10b981" },
      { name: "Đếm Từ", i18nKey: "fb_tool_word_count", icon: Type, color: "#ec4899" },
      { name: "Chuyển Đổi CSV sang JSON", i18nKey: "fb_tool_csv_json", icon: Database, color: "#3b82f6" },
      { name: "Máy Tính Tỷ Lệ Khung Hình", i18nKey: "fb_tool_aspect_ratio", icon: Layers, color: "#8b5cf6" },
      { name: "Đọc Mã QR", i18nKey: "fb_tool_qr_reader", icon: QrCode, color: "#f59e0b" },
      { name: "Tạo Số Ngẫu Nhiên", i18nKey: "fb_tool_random_gen", icon: Zap, color: "#06b6d4" },
      { name: "Chuyển Đổi Màu Sắc", i18nKey: "fb_tool_color_conv", icon: Palette, color: "#ec4899" }
    ]
  },
  {
    title: "DEVELOPER TOOLS",
    i18nKey: "fb_cat_developer",
    tools: [
      { name: "Tạo URL Chiến Dịch", i18nKey: "fb_tool_utm_gen", icon: Link, color: "#3b82f6" },
      { name: "Đồng Hồ Bấm Giờ", i18nKey: "fb_tool_stopwatch", icon: Clock, color: "#10b981" },
      { name: "Tạo Dữ Liệu Giả", i18nKey: "fb_tool_fake_data", icon: Database, color: "#ef4444" },
      { name: "Tạo UUID", i18nKey: "fb_tool_uuid_gen", icon: Copy, color: "#f59e0b" },
      { name: "Tùy chỉnh Scrollbar", i18nKey: "fb_tool_scrollbar_gen", icon: Wrench, color: "#8b5cf6" },
      { name: "JS Obfuscator", i18nKey: "fb_tool_js_obf", icon: Code, color: "#3b82f6" },
      { name: "Giải Thích Crontab", i18nKey: "fb_tool_crontab", icon: Cpu, color: "#06b6d4" },
      { name: "JS Beautify", i18nKey: "fb_tool_js_beautify", icon: Code, color: "#ec4899" }
    ]
  },
  {
    title: "TEXT & DATA TOOLS",
    i18nKey: "fb_cat_text",
    tools: [
      { name: "Curl to Code", i18nKey: "fb_tool_curl_code", icon: Terminal, color: "#10b981" },
      { name: "JWT Debugger", i18nKey: "fb_tool_jwt", icon: Wrench, color: "#3b82f6" },
      { name: "Trình Soạn Thảo JSON", i18nKey: "fb_tool_json_editor", icon: Code, color: "#f59e0b" },
      { name: "Tạo Meta Tag", i18nKey: "fb_tool_meta_gen", icon: FileText, color: "#ec4899" },
      { name: "Trình Soạn Thảo Markdown", i18nKey: "fb_tool_md_editor", icon: Type, color: "#8b5cf6" },
      { name: "So sánh Văn Bản", i18nKey: "fb_tool_text_diff", icon: Layers, color: "#1877F2" },
      { name: "Chuyển Đổi Base64", i18nKey: "fb_tool_base64", icon: Code, color: "#10b981" },
      { name: "Mã Hóa & Giải Mã URL", i18nKey: "fb_tool_url_enc", icon: Lock, color: "#ef4444" }
    ]
  },
  {
    title: "CONVERSION TOOLS",
    i18nKey: "fb_cat_conversion",
    tools: [
      { name: "Chuyển Đổi Unix Time", i18nKey: "fb_tool_unix_time", icon: Calendar, color: "#3b82f6" },
      { name: "Hash Text", i18nKey: "fb_tool_hash", icon: Code, color: "#f59e0b" },
      { name: "Tạo Lorem Ipsum", i18nKey: "fb_tool_lorem", icon: Type, color: "#06b6d4" },
      { name: "Resize Ảnh", i18nKey: "fb_tool_img_resize", icon: Image, color: "#ec4899" }
    ]
  }
]

// ==================== INSTAGRAM ====================
export const INSTAGRAM_TOOLS: ToolCategory[] = [
  {
    title: "AUTOMATION",
    i18nKey: "ig_cat_automation",
    tools: [
      { name: "Auto Like Feed", i18nKey: "ig_tool_auto_like", icon: Heart, color: "#ed4956" },
      { name: "Unfollow Non-Followers", i18nKey: "ig_tool_unfollow", icon: User, color: "#f59e0b" },
      { name: "Quick Reply DM", i18nKey: "ig_tool_quick_reply", icon: Search, color: "#3b82f6" }
    ]
  },
  {
    title: "CONTENT & DOWNLOAD",
    i18nKey: "ig_cat_content",
    tools: [
      { name: "Story Downloader", i18nKey: "ig_tool_story_dl", icon: Download, color: "#833ab4" },
      { name: "Save Post Image/Video", i18nKey: "ig_tool_post_dl", icon: Camera, color: "#5851db" },
      { name: "Profile Analytics", i18nKey: "ig_tool_analytics", icon: BarChart2, color: "#e1306c" }
    ]
  }
]

// ==================== TIKTOK ====================
export const TIKTOK_TOOLS: ToolCategory[] = [
  {
    title: "DOWNLOADER",
    i18nKey: "tt_cat_downloader",
    tools: [
      { name: "No Watermark Downloader", i18nKey: "tt_tool_no_wm", icon: Download, color: "#25F4EE" },
      { name: "MP3 Audio Saver", i18nKey: "tt_tool_mp3", icon: Music, color: "#FE2C55" },
      { name: "Batch Profile Downloader", i18nKey: "tt_tool_batch", icon: Zap, color: "#3b82f6" }
    ]
  },
  {
    title: "AUTOMATION",
    i18nKey: "tt_cat_automation",
    tools: [
      { name: "Auto Scroll Feed", i18nKey: "tt_tool_scroll", icon: Play, color: "#10b981" },
      { name: "Hashtag Generator", i18nKey: "tt_tool_hashtag", icon: TrendingUp, color: "#f59e0b" },
      { name: "Auto Like Clips", i18nKey: "tt_tool_like", icon: Play, color: "#FE2C55" }
    ]
  }
]

// ==================== THREADS ====================
export const THREADS_TOOLS: ToolCategory[] = [
  {
    title: "MODERATION",
    i18nKey: "th_cat_moderation",
    tools: [
      { name: "Bulk Hide Comments", i18nKey: "th_tool_hide_cmts", icon: EyeOff, color: "#ffffff" },
      { name: "Cleanup UI", i18nKey: "th_tool_cleanup", icon: Layout, color: "#f8fafc" },
      { name: "Anti-Spam Filter", i18nKey: "th_tool_antispam", icon: Shield, color: "#ef4444" }
    ]
  },
  {
    title: "UTILITIES",
    i18nKey: "th_cat_utility",
    tools: [
      { name: "Export Thread", i18nKey: "th_tool_export", icon: Share2, color: "#3b82f6" },
      { name: "Media Batch Downloader", i18nKey: "th_tool_batch_dl", icon: Hash, color: "#10b981" },
      { name: "Search Optimizer", i18nKey: "th_tool_search_opt", icon: AtSign, color: "#f59e0b" }
    ]
  }
]

// ==================== VIRUS TROLL ====================
export interface VirusTool extends Tool {
  link: string
}

export interface VirusToolCategory extends ToolCategory {
  tools: VirusTool[]
}

export const VIRUS_TROLL_TOOLS: VirusToolCategory[] = [
  {
    title: "SIMULATORS",
    i18nKey: "vi_cat_simulators",
    tools: [
      { name: "Hacker", i18nKey: "vi_tool_hacker", icon: Terminal, color: "#10b981", link: "https://pranx.com/hacker/" },
      { name: "Bios CMOS", i18nKey: "vi_tool_bios", icon: Cpu, color: "#3b82f6", link: "https://pranx.com/bios/" },
      { name: "Google Terminal", i18nKey: "vi_tool_google_term", icon: Search, color: "#f59e0b", link: "https://elgoog.im/terminal/" },
      { name: "Startup Screen", i18nKey: "vi_tool_startup", icon: Monitor, color: "#6366f1", link: "https://pranx.com/boot-device-not-found/" },
      { name: "Online Dos", i18nKey: "vi_tool_dos", icon: HardDrive, color: "#94a3b8", link: "https://pranx.com/fake-dos/" },
      { name: "Norton Commander", i18nKey: "vi_tool_norton", icon: Layout, color: "#1e40af", link: "https://pranx.com/norton-commander/" },
      { name: "Win XP Simulator", i18nKey: "vi_tool_winxp_sim", icon: Laptop, color: "#0284c7", link: "https://pranx.com/windows-xp-simulator/" },
      { name: "Jurassic Surveillance", i18nKey: "vi_tool_jurassic_surv", icon: Ghost, color: "#ef4444", link: "https://pranx.com/jurassic-park/" },
      { name: "Jurassic Console", i18nKey: "vi_tool_jurassic_con", icon: Terminal, color: "#ef4444", link: "https://pranx.com/jurassic-park/console/" }
    ]
  },
  {
    title: "FAKE UPDATES",
    i18nKey: "vi_cat_updates",
    tools: [
      { name: "Apple iOS", i18nKey: "vi_tool_apple", icon: Smartphone, color: "#f8fafc", link: "https://pranx.com/apple/" },
      { name: "Windows 7", i18nKey: "vi_tool_win7", icon: Monitor, color: "#0ea5e9", link: "https://pranx.com/win7-update/" },
      { name: "Windows XP", i18nKey: "vi_tool_winxp", icon: Monitor, color: "#0284c7", link: "https://pranx.com/winxp-update/" },
      { name: "Windows 10", i18nKey: "vi_tool_win10", icon: Monitor, color: "#3b82f6", link: "https://pranx.com/win10-update/" }
    ]
  },
  {
    title: "ANIMATIONS",
    i18nKey: "vi_cat_animations",
    tools: [
      { name: "DVD Screensaver", i18nKey: "vi_tool_dvd", icon: Play, color: "#ec4899", link: "https://pranx.com/bouncing-dvd-screensaver/" },
      { name: "Pipes Screensaver", i18nKey: "vi_tool_pipes", icon: Wind, color: "#8b5cf6", link: "https://pranx.com/pipes/" },
      { name: "Blue Death - BSOD", i18nKey: "vi_tool_bsod", icon: MonitorX, color: "#1e40af", link: "https://pranx.com/blue-death/" },
      { name: "Cracked Screen", i18nKey: "vi_tool_crack", icon: Smartphone, color: "#ef4444", link: "https://pranx.com/crack/" },
      { name: "FBI Warning", i18nKey: "vi_tool_fbi", icon: AlertTriangle, color: "#ef4444", link: "https://pranx.com/fbi-warning/" },
      { name: "Fake Virus Prank", i18nKey: "vi_tool_virus", icon: Bug, color: "#10b981", link: "https://pranx.com/fake-virus/" },
      { name: "Cracked Desktop", i18nKey: "vi_tool_cracked_desktop", icon: Monitor, color: "#ef4444", link: "https://pranx.com/cracked-screen/" },
      { name: "Matrix Code Rain", i18nKey: "vi_tool_matrix", icon: Terminal, color: "#10b981", link: "https://pranx.com/matrix-code-rain/" },
      { name: "Static TV Noise", i18nKey: "vi_tool_static", icon: Wind, color: "#64748b", link: "https://pranx.com/static-tv-noise/" }
    ]
  },
  {
    title: "MORE...",
    i18nKey: "vi_cat_more",
    tools: [
      { name: "Chat Screenshot", i18nKey: "vi_tool_chat_ss", icon: Smartphone, color: "#3b82f6", link: "https://pranx.com/chat-screenshot/" },
      { name: "Sound Effects", i18nKey: "vi_tool_sounds", icon: Music, color: "#f59e0b", link: "https://pranx.com/sound-effects/" },
      { name: "Scare Maze", i18nKey: "vi_tool_maze", icon: Ghost, color: "#ef4444", link: "https://pranx.com/scary-maze/" },
      { name: "Minesweeper", i18nKey: "vi_tool_minesweeper", icon: Bomb, color: "#94a3b8", link: "https://pranx.com/minesweeper/" },
      { name: "Tetris", i18nKey: "vi_tool_tetris", icon: Grid, color: "#8b5cf6", link: "https://pranx.com/tetris/" }
    ]
  }
]

// ==================== GETTER ====================
export const getToolsForPlatform = (platform: PlatformType): ToolCategory[] => {
  const toolsMap = {
    facebook: FACEBOOK_TOOLS,
    instagram: INSTAGRAM_TOOLS,
    tiktok: TIKTOK_TOOLS,
    threads: THREADS_TOOLS,
    virus: VIRUS_TROLL_TOOLS as ToolCategory[]
  }
  return toolsMap[platform] || []
}

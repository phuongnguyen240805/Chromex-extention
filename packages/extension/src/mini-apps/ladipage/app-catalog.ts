import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  Gift,
  Layout,
  Link,
  MapPin,
  Megaphone,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type LadipageAppCategory =
  | "marketing"
  | "sales"
  | "content"
  | "upcoming";

export type LadipageAppEmbedMode = "full" | "partial" | "upcoming";

export type LadipageAppDefinition = {
  id: string;
  name: string;
  toolName: string;
  description: string;
  category: LadipageAppCategory;
  route?: string;
  icon: LucideIcon;
  color: string;
  embedMode: LadipageAppEmbedMode;
};

export const LADIPAGE_APP_PANEL_SIZE = {
  width: 1280,
  height: 700,
} as const;

export const LADIPAGE_APPS: LadipageAppDefinition[] = [
  {
    id: "1",
    name: "Website Builder",
    toolName: "Website Builder · Ladipage",
    description: "Quản lý landing page, thư viện mẫu, biểu mẫu, tên miền và dữ liệu lead.",
    category: "sales",
    route: "/landing-pages",
    icon: Layout,
    color: "#F97316",
    embedMode: "full",
  },
  {
    id: "2",
    name: "Ecom Store",
    toolName: "Ecom Store · Ladipage",
    description: "Quản lý sản phẩm, đơn hàng, tồn kho, khách hàng và vận hành bán hàng.",
    category: "sales",
    route: "/ban-hang",
    icon: ShoppingCart,
    color: "#10B981",
    embedMode: "full",
  },
  {
    id: "5",
    name: "Dynamic",
    toolName: "Dynamic · Ladipage",
    description: "Xây dựng luồng automation và nội dung động theo từng phân khúc khách hàng.",
    category: "marketing",
    route: "/automation",
    icon: Workflow,
    color: "#EC4899",
    embedMode: "full",
  },
  {
    id: "6",
    name: "E-Learning",
    toolName: "E-Learning · Ladipage",
    description: "Quản lý khóa học, học viên, giảng viên, lịch học và báo cáo đào tạo.",
    category: "sales",
    route: "/e-learning/tong-quan",
    icon: BookOpen,
    color: "#059669",
    embedMode: "full",
  },
  {
    id: "10",
    name: "Facebook Ads",
    toolName: "Facebook Ads · Ladipage",
    description: "Quản lý chiến dịch, tài khoản quảng cáo và báo cáo Facebook Ads.",
    category: "marketing",
    route: "/extension-preview/facebook-ads",
    icon: Megaphone,
    color: "#2563EB",
    embedMode: "full",
  },
  {
    id: "14",
    name: "CloudPhone",
    toolName: "CloudPhone · Ladipage",
    description: "Quản lý thiết bị cloud phone, đồng bộ điều khiển và workflow automation.",
    category: "marketing",
    route: "/cloudphone/cua-hang-cho-thue",
    icon: Smartphone,
    color: "#0891B2",
    embedMode: "full",
  },
  {
    id: "15",
    name: "OfferKit",
    toolName: "OfferKit · Ladipage",
    description: "Quản lý ưu đãi, voucher, referral, loyalty và quy tắc áp dụng.",
    category: "marketing",
    route: "/offerkit",
    icon: Gift,
    color: "#3B82F6",
    embedMode: "full",
  },
  {
    id: "17",
    name: "AI SEO",
    toolName: "AI SEO · Ladipage",
    description: "Theo dõi dự án SEO, task tự động, playbook và tình trạng crawl website.",
    category: "marketing",
    route: "/ai-seo",
    icon: Sparkles,
    color: "#8B5CF6",
    embedMode: "full",
  },
  {
    id: "18",
    name: "Site Metrics",
    toolName: "Site Metrics · Ladipage",
    description: "Xem nhanh chỉ số tên miền, traffic và sức khỏe kỹ thuật website.",
    category: "marketing",
    route: "/site-metrics",
    icon: Activity,
    color: "#16A34A",
    embedMode: "partial",
  },
  {
    id: "19",
    name: "Local",
    toolName: "Local · Ladipage",
    description: "Quản lý Google Business Profile và theo dõi thứ hạng tìm kiếm địa phương.",
    category: "marketing",
    route: "/local",
    icon: MapPin,
    color: "#F97316",
    embedMode: "partial",
  },
  {
    id: "20",
    name: "Content",
    toolName: "Content · Ladipage",
    description: "Trợ lý nội dung, topical map, semantic grader và quy trình viết bài SEO.",
    category: "content",
    route: "/content",
    icon: FileText,
    color: "#E11D48",
    embedMode: "partial",
  },
  {
    id: "21",
    name: "Keywords",
    toolName: "Keywords · Ladipage",
    description: "Nghiên cứu từ khóa, search volume, độ khó và cơ hội xếp hạng.",
    category: "content",
    route: "/keywords",
    icon: Search,
    color: "#4F46E5",
    embedMode: "partial",
  },
  {
    id: "22",
    name: "Reports",
    toolName: "Reports · Ladipage",
    description: "Tạo và quản lý báo cáo marketing, bán hàng và hiệu quả chiến dịch.",
    category: "marketing",
    route: "/bao-cao",
    icon: BarChart3,
    color: "#22C55E",
    embedMode: "full",
  },
  {
    id: "23",
    name: "Authority",
    toolName: "Authority · Ladipage",
    description: "Theo dõi backlink, referring domain và chiến dịch xây dựng liên kết.",
    category: "upcoming",
    icon: Link,
    color: "#0D9488",
    embedMode: "upcoming",
  },
];

export const LADIPAGE_APP_CATEGORIES: Array<{
  id: LadipageAppCategory;
  title: string;
}> = [
  { id: "marketing", title: "LADIPAGE · MARKETING" },
  { id: "sales", title: "LADIPAGE · BÁN HÀNG" },
  { id: "content", title: "LADIPAGE · NỘI DUNG" },
  { id: "upcoming", title: "LADIPAGE · SẮP RA MẮT" },
];

export function getLadipageAppById(
  appId: string,
): LadipageAppDefinition | undefined {
  return LADIPAGE_APPS.find((app) => app.id === appId);
}

export const LADIPAGE_EMBED_ALLOWED_PATHS = LADIPAGE_APPS.flatMap((app) =>
  app.route ? [app.route] : [],
);

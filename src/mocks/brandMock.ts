// TODO: Thay bằng API backend khi sẵn sàng (Dữ liệu mockup cho CSM Picks, Combo tiết kiệm và Vòng quay may mắn)
import { Product } from "../types/product";

export interface CsmPickItem {
  productId: string;
  badge: string; // "CSM Pick"
  tagline: string;
  curatorNote: string;
  pairingNote: string;
}

export const mockCsmPickMetadata: Record<string, { tagline: string; curatorNote: string; pairingNote: string }> = {
  p2: {
    tagline: "Bữa sáng chuẩn vị",
    curatorNote: "Bánh mì nướng giòn rụm mỗi sáng, kết hợp sốt bơ trứng béo ngậy độc quyền.",
    pairingNote: "Ngon nhất khi dùng kèm Cà phê sữa đá.",
  },
  p4: {
    tagline: "Nóng sốt tức thì",
    curatorNote: "Sợi mì dai chuẩn hương vị Thái, nước dùng chua cay kích thích vị giác.",
    pairingNote: "Kèm thêm xúc xích phô mai là tuyệt đỉnh.",
  },
  p5: {
    tagline: "Cà phê pha phin đậm đặc",
    curatorNote: "Hạt Robusta Đắk Lắk rang mộc, vị ngọt đầm của sữa đặc truyền thống.",
    pairingNote: "Nạp năng lượng tỉnh táo cả buổi chiều.",
  },
  p3: {
    tagline: "Giòn rụm vui miệng",
    curatorNote: "Khoai tây tươi sấy giòn áo lớp rong biển mặn ngọt thanh thoát.",
    pairingNote: "Món ăn vặt số 1 cho các buổi xem phim.",
  },
};

export interface ComboItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  discountPercent: number; // % giảm so với mua lẻ
  productIds: [string, string, string]; // Đúng 3 sản phẩm quanh một hộp
  badge: string;
  badgeColor: string;
}

export const mockCombos: ComboItem[] = [
  {
    id: "combo-breakfast",
    name: "Combo Năng Lượng Buổi Sáng",
    slug: "combo-nang-luong-buoi-sang",
    tagline: "Khởi đầu ngày mới tỉnh táo & no nê",
    description: "Bánh mì kẹp thịt nguội nóng giòn, cà phê sữa đá đậm đà và snack tráng miệng.",
    discountPercent: 18,
    productIds: ["p2", "p5", "p3"],
    badge: "Bán chạy nhất",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "combo-lunch",
    name: "Combo Bữa Trưa Tiện Lợi",
    slug: "combo-bua-trua-tien-loi",
    tagline: "Tiết kiệm thời gian, trọn vẹn dinh dưỡng",
    description: "Mì ly Modern chua cay nức mũi, bổ sung nước khoáng thanh khiết và snack giòn rụm.",
    discountPercent: 20,
    productIds: ["p4", "p1", "p3"],
    badge: "Tiết kiệm 20%",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "combo-refresh",
    name: "Combo Giải Nhiệt Chiều Hè",
    slug: "combo-giai-nhiet-chieu-he",
    tagline: "Sảng khoái từng ngụm, nạp lại hứng khởi",
    description: "Cà phê sữa đá sảng khoái kết hợp nước khoáng mát lạnh và bánh mì tươi kẹp thịt.",
    discountPercent: 15,
    productIds: ["p5", "p1", "p2"],
    badge: "Thanh mát",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
  },
];

export interface SpinPrize {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  weight: number; // Tỷ lệ xuất hiện (trọng số)
  color: string;
  textColor: string;
  accentBg: string;
  isWinning: boolean;
  code?: string;
}

export const SPIN_PRIZES: SpinPrize[] = [
  {
    id: "prize-10k",
    label: "Voucher 10K",
    subLabel: "Đơn từ 50.000₫",
    icon: "🎟️",
    weight: 25,
    color: "#E8F5E9",
    textColor: "#2E7D32",
    accentBg: "bg-emerald-500",
    isWinning: true,
    code: "CSM10K",
  },
  {
    id: "prize-topping",
    label: "Free Topping",
    subLabel: "Thêm trân châu/thạch",
    icon: "🧋",
    weight: 25,
    color: "#FFF3E0",
    textColor: "#E65100",
    accentBg: "bg-amber-500",
    isWinning: true,
    code: "TOPPINGFREE",
  },
  {
    id: "prize-drink15",
    label: "Giảm 15% Nước",
    subLabel: "Áp dụng cho đồ uống",
    icon: "🥤",
    weight: 20,
    color: "#E3F2FD",
    textColor: "#1565C0",
    accentBg: "bg-sky-500",
    isWinning: true,
    code: "DRINK15",
  },
  {
    id: "prize-freeship",
    label: "Freeship Đơn",
    subLabel: "Đơn từ 99.000₫",
    icon: "🚚",
    weight: 15,
    color: "#F3E5F5",
    textColor: "#6A1B9A",
    accentBg: "bg-purple-500",
    isWinning: true,
    code: "FREESHIP99",
  },
  {
    id: "prize-luck",
    label: "Chúc May Mắn",
    subLabel: "Hẹn gặp lại ngày mai",
    icon: "🍀",
    weight: 10,
    color: "#FFFDE7",
    textColor: "#F57F17",
    accentBg: "bg-yellow-500",
    isWinning: false,
  },
  {
    id: "prize-20k",
    label: "Voucher 20K",
    subLabel: "Giải đặc biệt hôm nay",
    icon: "🎁",
    weight: 5,
    color: "#FFEBEE",
    textColor: "#C62828",
    accentBg: "bg-rose-500",
    isWinning: true,
    code: "CSM20KSPECIAL",
  },
];

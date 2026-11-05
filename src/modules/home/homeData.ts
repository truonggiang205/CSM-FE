export interface HeroBannerItem {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  bgGradient: string;
  tagColor: string;
}

export const mockHeroBanners: HeroBannerItem[] = [
  {
    id: "b1",
    badge: "🔥 FLASH SALE ĐỒNG GIÁ",
    title: "Giờ Vàng Tiện Lợi",
    highlight: "Đồng Giá Từ 15.000₫",
    description: "Thưởng thức các món ăn vặt, mì ly và nước giải khát mát lạnh với mức giá ưu đãi nhất khung giờ trưa và tối.",
    ctaText: "Săn deal ngay",
    ctaLink: "/products?q=sale",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=700&q=80",
    bgGradient: "from-primary-tint/70 via-surface to-pastel-peach/40",
    tagColor: "bg-danger-pastel text-danger-dark border-danger/30",
  },
  {
    id: "b2",
    badge: "🍱 COMBO TIẾT KIỆM",
    title: "Bữa Trưa Nhanh Gọn",
    highlight: "Tiết Kiệm Đến 25%",
    description: "Bánh mì tươi kẹp thịt + Trà sữa trân châu hoặc Cà phê sữa đá. Nạp năng lượng tức thì trong vòng 5 phút.",
    ctaText: "Xem combo",
    ctaLink: "/products?category=c2",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=700&q=80",
    bgGradient: "from-pastel-peach/70 via-surface to-pastel-butter/50",
    tagColor: "bg-accent-tint text-accent-dark border-accent/30",
  },
  {
    id: "b3",
    badge: "🧃 ĐỒ UỐNG TƯƠI MÁT",
    title: "Trà Trái Cây & Trà Sữa",
    highlight: "Mua 2 Tặng 1 Mỗi Ngày",
    description: "Hương vị trà thanh mát, trân châu dai giòn được pha chế chuẩn vị cửa hàng tiện lợi Nhật - Hàn.",
    ctaText: "Đặt đồ uống",
    ctaLink: "/products?category=c1",
    image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=700&q=80",
    bgGradient: "from-pastel-sky/70 via-surface to-pastel-mint/50",
    tagColor: "bg-info-pastel text-info-dark border-info/30",
  },
  {
    id: "b4",
    badge: "⚡ GIAO SIÊU TỐC 30P",
    title: "Cần Gì Có Đó Ngay",
    highlight: "Freeship Đơn Từ 100k",
    description: "Đóng gói kỹ lưỡng và giao đến tận bàn làm việc hoặc trước cửa nhà bạn từ chi nhánh CSM gần nhất.",
    ctaText: "Khám phá ngay",
    ctaLink: "/products",
    image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=700&q=80",
    bgGradient: "from-pastel-lavender/70 via-surface to-primary-tint/50",
    tagColor: "bg-pastel-mint text-primary-dark border-primary/30",
  },
];

export interface WhyChooseItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
  badge: string;
}

export const mockWhyChooseUs: WhyChooseItem[] = [
  {
    id: "w1",
    iconName: "Truck",
    title: "Giao Nhanh Trong 30 Phút",
    description: "Đơn hàng được điều phối đến chi nhánh gần bạn nhất để đóng gói và giao tức thì.",
    badge: "Siêu tốc",
  },
  {
    id: "w2",
    iconName: "ShieldCheck",
    title: "100% Nguồn Gốc Sạch",
    description: "Kiểm tra hạn sử dụng và tiêu chuẩn an toàn thực phẩm mỗi sáng trước khi lên kệ.",
    badge: "An tâm",
  },
  {
    id: "w3",
    iconName: "Store",
    title: "Mạng Lưới Rộng Khắp",
    description: "Chuỗi cửa hàng phủ rộng các quận trung tâm, dễ dàng ghé mua hoặc nhận tại quầy.",
    badge: "Tiện lợi",
  },
  {
    id: "w4",
    iconName: "Clock",
    title: "Phục Vụ 24/7 Không Nghỉ",
    description: "Dù nửa đêm hay sáng sớm, CSM luôn sẵn sàng đồ ăn nóng và nước uống phục vụ bạn.",
    badge: "24/7",
  },
];

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  purchasedItem: string;
}

export const mockTestimonials: TestimonialItem[] = [
  {
    id: "t1",
    name: "Lê Hoàng Yến",
    role: "Nhân viên văn phòng (Quận 1)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Trưa nào làm việc bận cũng mở CSM đặt bánh mì kẹp và trà sữa. Giao siêu nhanh chỉ 20 phút là tới sảnh tòa nhà, đồ ăn vẫn còn ấm giòn rất ngon!",
    date: "2 ngày trước",
    purchasedItem: "Combo Bánh Mì + Trà Sữa",
  },
  {
    id: "t2",
    name: "Trần Minh Quân",
    role: "Sinh viên ĐH Quốc Tế (Quận 7)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Thích nhất là web cho chọn đúng chi nhánh gần nhà để xem đúng số lượng còn trong kho. Thanh toán MoMo cái là xong, không phải lo ra cửa hàng bị hết món.",
    date: "1 tuần trước",
    purchasedItem: "Mì Ly Modern + Snack O'Star",
  },
  {
    id: "t3",
    name: "Nguyễn Thu Hà",
    role: "Freelancer (Bình Thạnh)",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    comment: "Giao diện màu pastel dịu mắt nhìn rất cưng chuẩn style Hàn Quốc. Đặt hàng ban đêm lúc 1h sáng vẫn có người giao nhiệt tình, 10/10 chất lượng!",
    date: "3 ngày trước",
    purchasedItem: "Cà phê sữa đá + Snack rong biển",
  },
];

export interface ComboItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  discountPercent: number;
  productIds: [string, string, string];
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

export interface SpinPrize {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  weight: number;
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

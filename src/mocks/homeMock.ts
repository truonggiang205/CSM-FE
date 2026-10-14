// TODO: Mock data cho giao diện trang chủ (chưa có API backend cho banner khuyến mãi, đánh giá khách hàng)

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

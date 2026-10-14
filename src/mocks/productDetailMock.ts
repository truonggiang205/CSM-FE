// TODO: Replace with real Product Nutrition & Storage API once backend endpoint is available

export interface ProductExtraDetails {
  origin: string;
  brand: string;
  manufacturer: string;
  certification: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sodium: string;
  sugar: string;
  ingredients: string[];
  storageInstructions: string[];
  usageInstructions: string[];
  warnings: string[];
}

export const mockDefaultProductExtra: ProductExtraDetails = {
  origin: "Việt Nam",
  brand: "CSM Select / Premium Local",
  manufacturer: "Công ty Cổ phần Thực phẩm Tiện lợi CSM Việt Nam",
  certification: "HACCP & ISO 22000:2018, Chuẩn Vệ sinh An toàn Thực phẩm",
  servingSize: "100g / 1 phần ăn",
  calories: "215 kcal",
  protein: "7.8 g",
  carbs: "28.5 g",
  fat: "4.2 g",
  sodium: "320 mg",
  sugar: "5.1 g",
  ingredients: [
    "Nguyên liệu tươi chọn lọc loại 1",
    "Nước tinh khiết qua hệ thống lọc RO",
    "Gia vị tự nhiên tiêu chuẩn cao cấp",
    "Không sử dụng phẩm màu tổng hợp độc hại",
    "Không chất bảo quản vượt ngưỡng cho phép",
  ],
  storageInstructions: [
    "Bảo quản ở nhiệt độ 2°C - 8°C (đối với thực phẩm tươi & đồ mát)",
    "Nhiệt độ phòng thoáng mát 22°C - 26°C (đối với đồ khô & bánh kẹo)",
    "Tránh ánh nắng mặt trời chiếu trực tiếp",
    "Sau khi mở bao bì, nên sử dụng trong vòng 24 giờ",
  ],
  usageInstructions: [
    "Dùng trực tiếp sau khi mở bao bì hoặc hâm nóng bằng lò vi sóng trong 1-2 phút",
    "Ngon hơn khi dùng kèm đồ uống ướp lạnh CSM",
    "Kiểm tra hạn sử dụng in trên bao bì trước khi dùng",
  ],
  warnings: [
    "Không sử dụng sản phẩm khi quá hạn hoặc bao bì có dấu hiệu phồng rách",
    "Cảnh báo dị ứng: có thể chứa vết đậu nành hoặc sữa",
  ],
};

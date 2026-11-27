# Hệ Thống Thiết Kế (Design System) - CSM Convenience Store

> **Tài liệu chuẩn mực dành cho Developer & Designer tham gia phát triển Frontend CSM (CSM-FE)**  
> **Phiên bản**: 2.0 (Pastel Convenience Store Theme)  
> **Phong cách chủ đạo**: Modern Pastel Retail / Boutique Convenience Store (Thanh lịch, tươi mới, hữu cơ, thân thiện kiểu Hàn Quốc & Nhật Bản).

---

## 1. Tổng Quan & Triết Lý Thiết Kế (Design Philosophy)

Hệ thống thiết kế này là **Single Source of Truth** cho toàn bộ giao diện của dự án `CSM-FE`. Toàn bộ thành viên khi phát triển tính năng, component hay trang mới **bắt buộc tuân thủ các quy chuẩn trong tài liệu này** để đảm bảo tính nhất quán cao nhất.

### 4 Trụ Cột Thiết Kế:
1. **Fresh & Natural (Tươi mới & Tự nhiên)**: Sử dụng các gam màu Pastel hữu cơ (Sage Green, Mint, Warm Peach, Lavender) gợi liên tưởng đến thực phẩm sạch, đồ uống thanh mát và không gian cửa hàng tiện lợi hiện đại.
2. **Soft & Friendly (Mềm mại & Gần gũi)**: Góc bo rộng (`rounded-xl`, `rounded-2xl`), đổ bóng êm ái ánh xanh bạc hà (`shadow-card`), micro-interactions mượt mà giúp người dùng cảm thấy dễ chịu khi mua sắm.
3. **Accessible & Clear (Rõ ràng & Dễ tiếp cận)**: Nền pastel mềm mại luôn đi kèm với chữ sắc nét độ tương phản cao đạt chuẩn **WCAG AA**, không gây mỏi mắt.
4. **Convenient (Tiện dụng & Nhanh gọn)**: Bố cục trực quan, hỗ trợ khách mua hàng chỉ với 2-3 lượt nhấp và giúp nhân viên quản trị thao tác nhanh trên dashboard.

---

## 2. Bảng Màu Pastel Chuẩn (Color Palette & Tokens)

Toàn bộ màu sắc được cấu hình tập trung trong `tailwind.config.js` và đồng bộ qua CSS variables trong `src/index.css`. Developer **không được tự tiện hardcode mã màu lạ** (như `#ff0000`, `#00ff00`) vào class inline.

### 2.1. Bảng Màu Thương Hiệu & Điểm Nhấn

| Token | Tên màu | HEX | Tailwind Class | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | Fresh Sage / Mint | `#4E9F76` | `bg-primary`, `text-primary` | Màu nhận diện chính, nút bấm chính (CTA), tiêu đề nổi bật |
| **Primary Dark** | Deep Sage | `#387B5B` | `bg-primary-dark`, `text-primary-dark` | Hover nút bấm, text giá tiền, text trên nền pastel mint |
| **Primary Light**| Soft Mint | `#6FB994` | `bg-primary-light` | Điểm chuyển màu gradient, border phụ |
| **Primary Tint** | Pastel Mint Wash | `#EAF5EF` | `bg-primary-tint`, `bg-pastel-mint` | Nền pill badge, active tab, hover mềm, icon wrapper |
| **Accent** | Pastel Peach / Apricot | `#F59E6C` | `bg-accent`, `text-accent` | Điểm nhấn khuyến mãi, badge giỏ hàng, nút nổi bật |
| **Accent Dark** | Deep Apricot | `#D97B48` | `bg-accent-dark`, `text-accent-dark` | Chữ nổi bật trên nền pastel peach, hover accent |
| **Accent Tint** | Soft Peach Wash | `#FFF2EB` | `bg-accent-tint`, `bg-pastel-peach`| Nền ưu đãi, thông báo flash-sale |

### 2.2. Bảng Màu Trạng Thái (Pastel Semantic Chips)

Hệ thống trạng thái sử dụng phong cách **Pastel Chip** (Nền pastel nhẹ + Viền pastel mảnh + Chữ tương phản cao):

| Trạng thái | Nền Pastel | Viền | Chữ đậm (Đạt WCAG AA) | Tailwind Helper |
| :--- | :--- | :--- | :--- | :--- |
| **Success** (Còn hàng, Hoàn tất) | `#EDFAF1` (`bg-success-pastel`) | `#C6F0D3` | `#276749` (`text-success-dark`) | `<Badge variant="success">` |
| **Warning** (Chờ xử lý, Sắp hết) | `#FEF9E7` (`bg-warning-pastel`) | `#FDE8B3` | `#975A16` (`text-warning-dark`) | `<Badge variant="warning">` |
| **Danger** (Hết hàng, Hủy đơn) | `#FEF2F2` (`bg-danger-pastel`) | `#FDCACA` | `#9B2C2C` (`text-danger-dark`) | `<Badge variant="destructive">` |
| **Info** (Đang giao hàng, Tin tức) | `#EBF8FF` (`bg-info-pastel`) | `#BEE3F8` | `#2B6CB0` (`text-info-dark`) | `<Badge variant="info">` |

### 2.3. Gam Màu Nền & Chữ (Neutrals)

| Token | Giá trị | Tailwind Class | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Background** | `#F8FAF9` | `bg-background` | Nền toàn bộ trang web (trắng ấm ánh bạc hà dịu mắt) |
| **Surface** | `#FFFFFF` | `bg-surface` | Nền card, modal, drawer, thanh tìm kiếm |
| **Surface Soft** | `#F5F8F6` | `bg-surface-soft` | Nền card lồng nhau, bảng `thead`, ô nhập dữ liệu |
| **Border** | `#E2EBE6` | `border-border` | Đường kẻ phân cách, viền card, viền input |
| **Foreground** | `#22312A` | `text-foreground` | Màu chữ chính (charcoal dịu, dễ đọc, không gắt) |
| **Muted** | `#64756D` | `text-muted` | Màu chữ phụ, mô tả sản phẩm, nhãn phụ |

---

## 3. Quy Tắc Phối Màu & Tương Phản (Accessibility Rules)

> [!IMPORTANT]
> **NGUYÊN TẮC BẮT BUỘC KHI DÙNG MÀU PASTEL:**
> 1. **KHÔNG BAO GIỜ** dùng chữ màu pastel sáng (như `#EAF5EF` hay `#FFF2EB`) trên nền trắng hoặc nền sáng.
> 2. **Luôn phối Nền Pastel với Chữ Đậm tương ứng:**
>    - Nền `bg-primary-tint` $\rightarrow$ Chữ `text-primary-dark`
>    - Nền `bg-accent-tint` $\rightarrow$ Chữ `text-accent-dark`
>    - Nền `bg-success-pastel` $\rightarrow$ Chữ `text-success-dark`
>    - Nền `bg-warning-pastel` $\rightarrow$ Chữ `text-warning-dark`
>    - Nền `bg-danger-pastel` $\rightarrow$ Chữ `text-danger-dark`
> 3. Nút bấm chính có nền `bg-primary` (`#4E9F76`) bắt buộc dùng chữ trắng (`text-white`) để đạt tỷ lệ tương phản chuẩn $\ge 4.5:1$.

---

## 4. Typography & Font Hierarchy

Sử dụng font chữ **Inter** (Google Fonts) hỗ trợ tiếng Việt đầy đủ và thẩm mỹ cao.

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

| Cấp độ | Kích thước | Line-height | Font-weight | Tailwind Class |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 32px (sm: 48px, lg: 56px) | 1.25 | 800 (Extrabold) | `text-display font-extrabold` |
| **H1** | 24px (sm: 30px) | 1.3 | 700 (Bold) | `text-h1 font-bold` |
| **H2** | 20px (sm: 24px) | 1.35 | 700 (Bold) | `text-h2 font-bold` |
| **H3** | 16px (sm: 18px) | 1.4 | 600 (Semibold) | `text-h3 font-semibold` |
| **Body** | 14px | 1.5 | 400 / 500 | `text-body` |
| **Caption / Sub** | 12px | 1.5 | 400 / 500 | `text-caption text-muted` |
| **Micro** | 10px - 11px | 1.4 | 600 / 700 | `text-[11px] uppercase tracking-wider` |

---

## 5. Bo Góc (Border Radius) & Đổ Bóng (Shadows)

Phong cách pastel yêu cầu các đường nét bo cong mềm mại và đổ bóng khuếch tán:

### 5.1. Border Radius
- `rounded-lg` (14px): Dành cho tag nhỏ, ô chọn số lượng.
- `rounded-xl` (18px): Dành cho **Button, Input, Select, Dropdown menu**.
- `rounded-2xl` (24px): Dành cho **Card sản phẩm, Card thống kê, Khối bộ lọc**.
- `rounded-3xl` (32px): Dành cho **Hero Container, Khối nổi bật chi tiết sản phẩm**.
- `rounded-full` (9999px): Dành cho **Badge, Avatar, Pill tabs**.

### 5.2. Box Shadows
- `shadow-card`: `0 2px 12px -2px rgba(78, 159, 118, 0.08), 0 1px 3px rgba(0, 0, 0, 0.03)` (Đổ bóng ánh xanh dịu nhẹ khi ở trạng thái nghỉ).
- `shadow-card-hover`: `0 12px 28px -4px rgba(78, 159, 118, 0.15), 0 4px 8px -2px rgba(0, 0, 0, 0.04)` (Hiệu ứng nổi khi hover chuột).
- `shadow-soft`: `0 4px 20px -2px rgba(0, 0, 0, 0.05)`.

---

## 6. Quy Chuẩn Base UI Components

Tất cả base components nằm tại `src/components/ui/`. Khi code trang mới, developer **bắt buộc dùng lại các component này**, không tự viết button hoặc badge riêng lẻ.

### 6.1. Button (`src/components/ui/Button.tsx`)

Hỗ trợ các biến thể (variants) và kích thước (sizes):

```tsx
import { Button } from "@/components/ui/Button";

// Nút chính (CTA)
<Button variant="default" size="default">Khám phá ngay</Button>

// Nút mềm pastel mint
<Button variant="soft" size="sm">Xem chi tiết</Button>

// Nút pastel peach
<Button variant="secondary">Ưu đãi hôm nay</Button>

// Nút viền thanh lịch
<Button variant="outline">Quay lại</Button>

// Nút cảnh báo / hủy
<Button variant="destructive">Xóa đơn hàng</Button>

// Nút ghost không viền
<Button variant="ghost" size="icon"><ShoppingCart className="w-5 h-5" /></Button>
```

### 6.2. Badge / Chip (`src/components/ui/Badge.tsx`)

Dùng để hiển thị danh mục, trạng thái đơn hàng, tình trạng kho:

```tsx
import { Badge } from "@/components/ui/Badge";

<Badge variant="primary">Đồ uống</Badge>
<Badge variant="secondary">Flash Sale</Badge>
<Badge variant="success">Còn hàng</Badge>
<Badge variant="warning">Chờ xử lý</Badge>
<Badge variant="destructive">Hết hàng</Badge>
<Badge variant="info">Đang vận chuyển</Badge>
<Badge variant="outline">Mã #ORD-1234</Badge>
```

### 6.3. Card (`src/components/ui/Card.tsx`)

Cấu trúc chuẩn cho một khối nội dung:

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

<Card className="p-6">
  <CardHeader className="p-0 mb-4">
    <CardTitle>Doanh thu hôm nay</CardTitle>
    <CardDescription>Cập nhật lúc 15:30</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    <p className="text-2xl font-extrabold text-primary-dark">12.500.000₫</p>
  </CardContent>
</Card>
```

### 6.4. Input (`src/components/ui/Input.tsx`)

Ô nhập dữ liệu bo tròn góc với focus ring màu pastel mint tinh tế:

```tsx
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

<div className="space-y-1.5">
  <Label htmlFor="product-name">Tên sản phẩm</Label>
  <Input id="product-name" placeholder="Ví dụ: Bánh mì kẹp..." />
</div>
```

---

## 7. Bố Cục Trang & Điều Hướng (Layouts)

Ứng dụng chia làm 2 Layout chính:

### 7.1. Public Layout (`src/layouts/PublicLayout.tsx`)
- **Header**: Cố định (Sticky), nền `bg-surface/85 backdrop-blur-md`, viền `border-b border-border/80`.
- **Logo Brand**: Biểu tượng mầm cây `🌱` cùng chữ `CSM Store` với slogan `PASTEL CONVENIENCE`.
- **Cart Button**: Nút mở Drawer giỏ hàng có badge số lượng `bg-accent text-white`.
- **Footer**: Thanh lịch, chứa bản quyền và ghi chú thương hiệu.

### 7.2. Admin Layout (`src/layouts/AdminLayout.tsx`)
- **Sidebar**: Nền `bg-surface`, viền ngăn cách `border-r border-border`.
- **Active Navigation Item**: Sử dụng kiểu Pastel Chip sang trọng:
  ```css
  bg-primary-tint text-primary-dark font-semibold border border-primary/25 shadow-sm
  ```
- **User Card & Logout**: Avatar pastel mint và nút đăng xuất màu pastel rose nhẹ nhàng.

---

## 8. Hướng Dẫn Dành Cho Developer Kế Tiếp (Developer Guide)

### Quy trình 5 bước khi thêm một tính năng hoặc trang mới:
1. **Định nghĩa kiểu dữ liệu (Types)** trong `src/types/<feature>.ts`.
2. **Khai báo API Service** trong `src/api/<feature>Api.ts` (dùng `apiClient.ts`).
3. **Xây dựng module logic & giao diện** trong `src/modules/<feature>/`:
   - `/components`: Các component cục bộ của tính năng.
   - `/hooks`: Custom hooks (React Query).
   - `/pages`: Trang chính hiển thị.
4. **Tái sử dụng UI Tokens**: Luôn dùng các class `bg-primary`, `bg-primary-tint`, `text-primary-dark`, `border-border`, `shadow-card`.
5. **Khai báo route** vào `src/routes/index.tsx`.

---

## 9. Bảng Tra Cứu Do / Don't (Nên làm & Tuyệt đối tránh)

| Nên Làm (DO) ✅ | Tuyệt Đối Tránh (DON'T) ❌ |
| :--- | :--- |
| Dùng `bg-primary-tint` cho nền chip, badge, active item | Không dùng nền xanh lá đậm đặc quánh (`#0F9D58`) cho các mảng lớn gây chói |
| Dùng `text-primary-dark` cho giá tiền và tiêu đề nhấn | Không dùng chữ màu pastel nhạt trên nền trắng (gây mờ mắt, vi phạm accessibility) |
| Bo tròn mềm mại (`rounded-xl`, `rounded-2xl`) | Không dùng các góc nhọn sắc (`rounded-none`, `rounded-sm`) |
| Tái sử dụng `<Button>`, `<Badge>`, `<Card>`, `<Input>` | Không tự chế style ad-hoc hoặc viết CSS tách rời không qua Tailwind |
| Thêm transition mượt (`transition-all duration-200`) | Không lạm dụng hiệu ứng giật gân, chớp nháy làm mất sự êm dịu của phong cách pastel |
| Giữ font chữ sạch sẽ với font **Inter** | Không dùng font chữ viết tay hoặc font display uốn lượn khó đọc |

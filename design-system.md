# Design System - Convenience Store E-Commerce

## 1. Overview
Hệ thống thiết kế (Design System) này đóng vai trò là nguồn chân lý (Single Source of Truth) cho toàn bộ ứng dụng Frontend CSM (Hệ thống thương mại điện tử chuỗi cửa hàng tiện lợi). Mục tiêu là đảm bảo tính nhất quán về giao diện (UI), trải nghiệm người dùng (UX) và kiến trúc code, giúp các developer dễ dàng bảo trì và mở rộng dự án.

## 2. Design Philosophy
- **Modern**: Giao diện hiện đại, sạch sẽ.
- **Fresh**: Tạo cảm giác tươi mới, phù hợp với ngành bán lẻ / cửa hàng tiện lợi.
- **Friendly**: Thân thiện, dễ sử dụng cho mọi đối tượng khách hàng.
- **Convenient**: Thao tác nhanh gọn, mua sắm tiện lợi.
- **Professional**: Thể hiện sự chuyên nghiệp của một hệ thống quản lý chuỗi cửa hàng lớn.

## 3. Brand
- **Tên hệ thống**: Convenience Store E-Commerce
- **Phong cách**: Modern Convenience Store / Premium Retail (không nhầm lẫn với phong cách dashboard thuần túy hay ngân hàng).

## 4. Colors
Màu sắc được quản lý tập trung thông qua Tailwind CSS (`tailwind.config.js`) và CSS Variables (`index.css`).

- **Primary**: `#0F9D58` (Xanh lá - màu thương hiệu chính)
- **Primary Dark**: `#0B7A44`
- **Accent**: `#FF7A00` (Cam - dùng cho Call to Action, làm nổi bật)
- **Background**: `var(--bg-background)` - Thường là màu sáng/trắng hoặc xám rất nhạt (`#F9FAFB`)
- **Surface**: `#FFFFFF` (Nền của card, modal)
- **Foreground**: `var(--text-foreground)` - Màu text chính
- **Muted**: `var(--text-muted)` - Màu text phụ, placeholder
- **Success**: `#16A34A`
- **Warning**: `#F59E0B`
- **Error/Danger**: `#DC2626`
- **Info**: `#3B82F6`
- **Border**: `var(--border-color)`

## 5. Typography
Sử dụng font chữ **Inter** (Google Fonts) làm font chủ đạo.

- **Display**: 32px, bold
- **H1**: 24px, bold
- **H2**: 20px, bold
- **H3**: 16px, medium
- **Body**: 14px, regular
- **Caption**: 12px, regular
- **Button**: 14px, medium

## 6. Spacing
Hệ thống khoảng cách tuân theo bội số của 4:
- `4px` (1)
- `8px` (2)
- `12px` (3)
- `16px` (4)
- `24px` (6)
- `32px` (8)
- `48px` (12)
- `64px` (16)

## 7. Border Radius
- `sm`: 6px
- `md`: 12px
- `lg`: 20px
- `full`: 9999px (cho avatar, badge)

## 8. Shadows
- `sm`: Shadow rất nhẹ cho các element nổi cơ bản
- `md`: Shadow cho dropdown, menu
- `lg`: Shadow cho card nổi
- `card`: `0 1px 3px rgba(0,0,0,0.08)`
- `card-hover`: `0 8px 20px rgba(0,0,0,0.12)`

## 9. Breakpoints (Responsive)
- **Mobile**: `< 768px`
- **Tablet**: `768px` - `1024px`
- **Desktop**: `1024px` - `1280px`
- **Large Desktop**: `> 1280px`

## 10. Components
*(Sẽ được document chi tiết khi xây dựng cụ thể từng component)*
Các component chính dự kiến:
- Button, Input, Select, Checkbox, Radio, Textarea
- Card, Badge, Modal, Drawer, Table
- Toast, Skeleton, Spinner, EmptyState

## 11. Animation
Sử dụng **Framer Motion** cho các animation chính.
- **Micro-interaction**: 150-300ms (Hover button, focus input)
- **Page transition**: 300-500ms
- **Easing**: Tự nhiên, không quá gắt (easeInOut).

## 12. 3D
Chỉ sử dụng 3D (Three.js/React Three Fiber) ở Hero Section hoặc các khu vực Interactive Product Visual.
**Quy tắc:**
- Lazy loading bắt buộc.
- Fallback bằng ảnh 2D trên mobile.
- Không dùng trong trang quản trị (Admin/Dashboard) hay danh sách dài.

## 13. Accessibility
- Dùng Semantic HTML.
- Hỗ trợ keyboard navigation.
- Label đầy đủ cho Form.
- Tôn trọng `prefers-reduced-motion` để tắt animation nếu người dùng có nhu cầu.

## 14. Naming Convention
- **Components**: `PascalCase` (e.g., `ProductCard.tsx`)
- **Functions/Hooks**: `camelCase` (e.g., `formatCurrency()`, `useAuth()`)
- **Constants**: `UPPER_CASE` (e.g., `API_BASE_URL`)
- **Types/Interfaces**: `PascalCase`

## 15. Folder Convention
- `/api`: Cấu hình Axios, API Client.
- `/assets`: Hình ảnh tĩnh, fonts.
- `/components`: Components dùng chung (`/ui`, `/layout`, `/common`).
- `/config`: Các cấu hình global (theme, env constants).
- `/hooks`: Custom hooks dùng chung.
- `/layouts`: Các layout wrapper (Public, Admin, Customer).
- `/lib`: Các thư viện bên thứ 3 cấu hình sẵn.
- `/mocks`: Mock data.
- `/modules`: Feature-based architecture (chứa logic cụ thể theo nghiệp vụ như `auth`, `products`, `orders`).
- `/pages`: Component trang ghép các module lại.
- `/routes`: Cấu hình react-router.
- `/services`: Các hàm gọi API tương ứng từng tính năng.
- `/store`: Zustand state.
- `/types`: TypeScript interfaces/types.
- `/utils`: Helper functions.

## 16. API Convention
Flow chuẩn khi lấy dữ liệu:
`Page/Component` -> `Custom Hook (React Query)` -> `Service Function` -> `API Client (Axios)` -> `API Gateway`.

## 17. State Management
- **TanStack React Query**: Dành cho Server State (dữ liệu sản phẩm, đơn hàng, tồn kho).
- **Zustand**: Dành cho Client State (Theme, Giỏ hàng UI state, UI Toggle).

## 18. Developer Guidelines
- Tránh tạo Giant Component. Chia nhỏ khi component vượt quá ~200-300 dòng.
- Không viết API logic trực tiếp vào UI Component.
- Phải define Type rõ ràng, hạn chế tối đa việc sử dụng `any`.

## 19. Do / Don't
- **DO**: Viết code dễ đọc, dễ bảo trì, tái sử dụng cao.
- **DO**: Luôn xử lý các state loading/error của API.
- **DON'T**: Không hard-code các thông tương nhạy cảm (JWT token, password).
- **DON'T**: Lạm dụng Glassmorphism làm giảm tốc độ render.

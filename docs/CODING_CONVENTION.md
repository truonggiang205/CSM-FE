# Quy ước viết mã (Coding Convention) – CSM Frontend

Tài liệu này là quy tắc nhóm 04 thống nhất và đang áp dụng trong repo CSM-FE. ESLint (`eslint.config.js`), `tsc` và CI (`.github/workflows/ci.yml`) kiểm tra tự động các quy tắc có thể kiểm tra bằng máy.

## 1. Ngôn ngữ và công cụ
- React 18 + TypeScript (strict) + Vite; Tailwind CSS cho giao diện.
- Kiểm tra tĩnh: `npm run lint:eslint` (typescript-eslint, react-hooks, react-refresh) và `npm run build` (gồm `tsc -b`). Lỗi chặn CI; cảnh báo được ghi vào báo cáo.
- Kiểm thử giao diện: Playwright, tệp trong `tests/*.spec.ts`.

## 2. Cấu trúc thư mục
- `src/modules/<nghiệp vụ>/{pages,components,hooks}`: mã theo nghiệp vụ (auth, products, cart, checkout, orders, inventory, discounts, storefront…).
- `src/components/{ui,common,…}`: component dùng chung; `src/api`: client gọi API; `src/store`: Zustand; `src/routes`: định tuyến; `src/types`: kiểu dữ liệu.

## 3. Đặt tên
| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component, trang | PascalCase, tệp `.tsx` cùng tên | `ProfilePage.tsx`, `UserAvatar.tsx` |
| Hook | camelCase, bắt đầu bằng `use` | `useStorefront.ts` |
| Biến, hàm | camelCase | `cartItems`, `formatPrice()` |
| Kiểu, interface | PascalCase | `Product`, `OrderStatus` |
| Hằng số | UPPER_SNAKE_CASE | `AVATAR_MAX_BYTES` |

## 4. React
- Chỉ dùng function component và hooks; gọi hook ở đầu component, không gọi sau `return` có điều kiện (rule `react-hooks/rules-of-hooks`).
- Dữ liệu máy chủ lấy qua TanStack Query hoặc lớp `src/api`; trạng thái phiên và giỏ hàng qua Zustand.
- Trang quản trị bọc bởi `ProtectedRoute` với danh sách vai trò; không chỉ dựa vào việc ẩn nút.
- Giao diện tiếng Việt, đáp ứng từ 390px; không dùng `console.log` (chỉ `console.warn`/`console.error`).

## 5. Bảo mật
- Không commit `.env` hay token; chỉ dùng biến `VITE_*` không bí mật. CI chạy gitleaks trên toàn bộ lịch sử commit.

## 6. Git
- Nhánh: `main` (bản nộp), `UI` (tích hợp), nhánh `feat/`, `fix/`, `chore/`, `refactor/`.
- Commit theo Conventional Commits: `<loại>(<phạm vi>): <mô tả>`.
- Mọi thay đổi vào `UI`/`main` qua Pull Request; CI phải xanh trước khi merge.

# 🏪 CSM-FE (Convenience Store Management - Frontend)

Hệ thống giao diện Web thương mại điện tử chuỗi cửa hàng tiện lợi phục vụ đề tài Tiểu luận chuyên ngành (TLCN).

## 🛠️ Công nghệ sử dụng
- **ReactJS 18** (Vite + TypeScript)
- **Axios** (kết nối API Gateway và tự động gắn JWT Token)
- **Lucide React** (Bộ icons hiện đại)
- **Vanilla CSS / Custom Design System**

## ✨ Các tính năng chính
- 📍 **Chọn chi nhánh cửa hàng tiện lợi gần nhất**: Tự động cập nhật menu và số lượng tồn kho theo chi nhánh được chọn.
- 📦 **Duyệt danh mục & sản phẩm**: Lọc sản phẩm theo danh mục, hiển thị trạng thái "Còn hàng / Hết hàng" theo thời gian thực.
- 🛒 **Giỏ hàng & Đặt hàng (Checkout)**: Quản lý giỏ hàng cục bộ, tính tổng tiền và tạo đơn hàng.
- 🔐 **Xác thực & Phân quyền**: Đăng nhập, đăng ký và phân quyền Khách hàng / Quản lý cửa hàng / Admin.

---

## 🚀 Hướng dẫn khởi chạy cục bộ

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

2. Khởi chạy server phát triển (Development Server):
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

---

## 📤 Hướng dẫn Đẩy lên GitHub (Push Git)

Mở terminal trong thư mục `CSM-FE` và gõ các lệnh sau:

```bash
# 1. Khởi tạo Git
git init
git branch -M main

# 2. Thêm toàn bộ code và commit
git add .
git commit -m "feat: initial commit for CSM-FE storefront application"

# 3. Liên kết với repository GitHub của bạn (thay link repo của bạn vào)
git remote add origin https://github.com/<your-username>/CSM-FE.git

# 4. Đẩy code lên GitHub
git push -u origin main
```
Sau đó, bạn vào GitHub -> **Settings** -> **Collaborators** -> Bấm **Add people** để mời bạn bè trong nhóm vào cùng làm việc!

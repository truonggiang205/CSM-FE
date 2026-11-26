# CSM-FE

Giao diện web (React 18 + Vite) của hệ thống quản lý chuỗi cửa hàng tiện lợi CSM. Backend nằm ở repo CSM-BE.

## Chạy local

```bash
npm install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
npm run dev                 # http://localhost:3000
```

FE chỉ cần một biến `VITE_API_URL` (mặc định `http://localhost:8000/api/v1`). Nếu bỏ qua bước tạo `.env`, FE vẫn chạy với giá trị mặc định này. Sửa `.env` xong phải chạy lại `npm run dev`.

> Mọi biến `VITE_*` đều bị nhúng công khai vào bundle trình duyệt. Không đặt secret hay mật khẩu vào `.env` của FE.
> Chỉ file `.env.example` được commit. Các file `.env`, `.env.local`, `.env.production`, `.env.backup`... đã nằm trong `.gitignore`.

## Tài khoản đăng nhập

Tài khoản demo do backend tạo khi chạy `npm run seed` trong CSM-BE. Mật khẩu lấy từ `.env` của **CSM-BE** (`SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_CUSTOMER_PASSWORD`, nếu thiếu thì dùng `SEED_PASSWORD`). Xem README của CSM-BE, mục 4.

## Kiểm thử Playwright

Playwright không đọc `.env`. Đặt biến trong terminal rồi chạy, ví dụ PowerShell:

```powershell
$env:SEED_ADMIN_PASSWORD="Admin@123456"; $env:SEED_MANAGER_PASSWORD="Manager@123456"; $env:SEED_CUSTOMER_PASSWORD="Customer@123456"
npx playwright test
```

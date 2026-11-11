# BÁO CÁO AUDIT TRẢI NGHIỆM NGƯỜI DÙNG QUẢN TRỊ (ADMIN & MANAGER UX AUDIT)

- **Dự án**: CSM Convenience Store Management - Frontend (`CSM-FE`)
- **Nhánh thực hiện**: `feature/admin-ux-polish` (tách từ `UI`)
- **Thời điểm trích xuất & kiểm toán**: 11/11/2026
- **Mục tiêu**: Nâng cấp trải nghiệm khu vực ADMIN và BRANCH_MANAGER, tối ưu cho thao tác vận hành thực tế tại chuỗi cửa hàng tiện lợi, 100% dữ liệu từ API thật của Backend, tuân thủ Design System Pastel Retail.

---

## 1. Danh sách các trang Admin/Manager hiện có & API tương ứng

| STT | Tuyến đường (Route) | Tên phân hệ | Role cho phép vào | API Endpoint Backend gọi thực tế | Mô tả mục đích |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/admin` | Tổng quan Dashboard | `ADMIN`, `BRANCH_MANAGER`, `STAFF` | • `GET /orders?limit=500`<br>• `GET /auth/users`<br>• `GET /branches`<br>• `GET /products`<br>• `GET /inventory/branch/:id` | Bảng điều khiển kinh doanh, doanh thu, đơn hàng và cảnh báo kho. |
| 2 | `/admin/orders` | Quản lý Đơn hàng | `ADMIN`, `BRANCH_MANAGER`, `STAFF` | • `GET /orders`<br>• `GET /branches` (chỉ ADMIN)<br>• `PATCH /orders/:id/status` | Xem danh sách đơn, lọc trạng thái, chi nhánh, ngày và cập nhật luồng đơn. |
| 3 | `/admin/inventory`| Quản lý Tồn kho | `ADMIN`, `BRANCH_MANAGER` | • `GET /branches`<br>• `GET /products`<br>• `GET /inventory/branch/:id`<br>• `POST /inventory/add-stock` | Theo dõi tồn thực, giữ chỗ, cảnh báo sắp hết/hết hàng và nhập kho. |
| 4 | `/admin/products` | Quản lý Sản phẩm | Đang để `["BRANCH_MANAGER", "ADMIN"]` *(Cần thu gọn CHỈ ADMIN)* | • `GET /products`<br>• `GET /categories`<br>• `POST /products`<br>• `PUT /products/:id`<br>• `DELETE /products/:id`<br>• `POST /products/:id/image` | CRUD sản phẩm toàn chuỗi, tải ảnh sản phẩm tĩnh giới hạn 2MB. |
| 5 | `/admin/branches` | Quản lý Chi nhánh | `ADMIN` (Manager hiện xem được do route cha chưa chặn) | • `GET /branches?all=true`<br>• `POST /branches`<br>• `PUT /branches/:id`<br>• `DELETE /branches/:id` | Danh mục mạng lưới cửa hàng, tọa độ GPS, kích hoạt / tạm ngưng chi nhánh. |
| 6 | `/admin/customers`| Quản lý Người dùng | `ADMIN` (Manager hiện xem được do route cha chưa chặn) | • `GET /auth/users?role=` | Danh sách tài khoản người dùng, phân quyền theo role (Admin, Manager, Customer). |
| 7 | `/admin/settings` | Cài đặt Hệ thống | `ADMIN` (Manager hiện xem được do route cha chưa chặn) | *Chưa có endpoint BE* (State lưu tạm cục bộ) | Cấu hình tham số vận hành: hotline, phí ship, thời gian giữ chỗ Saga. |

---

## 2. Kiểm toán chi tiết DashboardPage: Dữ liệu thật vs Số liệu giả (Mock / Hardcoded)

| Vị trí / Thành phần | Tên số liệu hiển thị | Nguồn dữ liệu | Đánh giá tính xác thực | Vấn đề UX & Nghiệp vụ phát hiện |
| :--- | :--- | :--- | :---: | :--- |
| **Thẻ chỉ số 1** | Doanh thu hôm nay | `orders` tính tổng `total_amount` | **Sai lệch nghiệp vụ** | Đang cộng dồn mọi đơn có `status !== "CANCELLED"`. Đơn `PENDING` và `CONFIRMED` chưa trả tiền vẫn bị tính vào doanh thu. Cần chỉ tính đơn **`PAID`**. |
| **Trend thẻ 1** | % Tăng trưởng doanh thu | So sánh với `yesterdayRevenue` | **CÓ SỐ GIẢ** | Khi hôm qua không có đơn (`yesterdayRevenue === 0`), code gán cứng giá trị giả `18.4%`. |
| **Thẻ chỉ số 2** | Đơn hàng hôm nay | `orders` lọc theo ngày hôm nay | **Thật** | Đếm đúng số đơn đặt trong ngày. |
| **Trend thẻ 2** | % Tăng trưởng đơn hàng | So sánh với `yesterdayOrders.length` | **CÓ SỐ GIẢ** | Khi hôm qua không có đơn (`yesterdayOrders.length === 0`), code gán cứng giá trị giả `12.6%`. |
| **Thẻ chỉ số 3** | Khách hàng mới (7 ngày) | `users` lọc role `CUSTOMER` | **Không phù hợp** | Thay vì hiện chỉ số vận hành cửa hàng (như đơn chờ xử lý), trang lại hiện khách mới. |
| **Trend thẻ 3** | Tăng trưởng khách mới | Chuỗi tĩnh `"+14.5%"` | **SỐ GIẢ 100%** | Hardcode hoàn toàn, không có phép tính nào phía sau. |
| **Thẻ chỉ số 4** | Cảnh báo kho hàng | Duyệt tồn kho `available <= 5` | **Thật** | Tính từ dữ liệu kho của từng chi nhánh, chia nhóm hết hàng và sắp hết. |
| **Biểu đồ AreaChart** | Doanh thu & Đơn hàng (7 ngày, 30 ngày, tháng, năm) | Tính từ mảng `orders` thật | **Thật** | Dữ liệu vẽ biểu đồ dựa trên ngày tạo đơn thật từ API `GET /orders`. |
| **Bảng gần đây** | 5 Đơn hàng gần nhất | Slice 5 đơn mới nhất từ `orders` | **Thật** | Thông tin mã đơn, khách, chi nhánh, tổng tiền, trạng thái từ API thật. |
| **Phân quyền** | Toàn bộ Dashboard | Chung 1 chế độ xem | **Thiếu sót nghiêm trọng** | Manager đăng nhập vào vẫn nhìn thấy doanh số, đơn hàng và cảnh báo kho của toàn bộ chuỗi chi nhánh khác, không bị khoá theo chi nhánh phụ trách. |

---

## 3. Ảnh chụp giao diện hiện trạng trước khi sửa (1280px & 375px)

Toàn bộ ảnh chụp màn hình hiện trạng đã được tạo tự động bằng Playwright lưu tại `docs/admin-ux-before-after/`:

| Phân hệ / Màn hình | Desktop (1280px) | Mobile (375px) |
| :--- | :--- | :--- |
| **Dashboard (Admin)** | [`before-dashboard-admin-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-dashboard-admin-1280.png) | [`before-dashboard-admin-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-dashboard-admin-375.png) |
| **Dashboard (Manager)** | [`before-dashboard-manager-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-dashboard-manager-1280.png) | [`before-dashboard-manager-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-dashboard-manager-375.png) |
| **Quản lý Đơn hàng** | [`before-orders-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-orders-1280.png) | [`before-orders-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-orders-375.png) |
| **Quản lý Tồn kho** | [`before-inventory-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-inventory-1280.png) | [`before-inventory-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-inventory-375.png) |
| **Quản lý Sản phẩm** | [`before-products-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-products-1280.png) | [`before-products-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-products-375.png) |
| **Quản lý Chi nhánh** | [`before-branches-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-branches-1280.png) | [`before-branches-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-branches-375.png) |
| **Quản lý Người dùng** | [`before-customers-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-customers-1280.png) | [`before-customers-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-customers-375.png) |
| **Cài đặt Hệ thống** | [`before-settings-1280.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-settings-1280.png) | [`before-settings-375.png`](file:///e:/TLCN/CSM-FE/docs/admin-ux-before-after/before-settings-375.png) |

---

## 4. Danh sách 12 vấn đề UX thực tế xếp theo mức độ nghiêm trọng

| Thứ tự | Mức độ | Vấn đề UX quan sát được | Hệ quả cho người vận hành | Giải pháp cải tiến |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **CRITICAL** | **Không biết đơn nào cần xử lý ngay**: Dashboard và trang Đơn hàng không có danh sách đơn cần hành động ưu tiên (`PENDING`/`CONFIRMED`). | Quản lý/nhân viên không biết khách vừa đặt đơn nào để chuẩn bị đóng gói và giao hàng. | Tạo khối riêng **"Cần xử lý ngay"** gom các đơn PENDING, CONFIRMED kèm nút chuyển trạng thái nhanh 1 chạm. |
| **2** | **CRITICAL** | **Dashboard không phân quyền theo vai trò**: `BRANCH_MANAGER` xem được toàn bộ doanh thu, đơn hàng, khách hàng của chi nhánh khác. | Vi phạm bảo mật phân tán dữ liệu chi nhánh trong mô hình chuỗi cửa hàng O2O. | Khóa phạm vi Dashboard của Manager vào đúng `user.branch_id`, hiển thị rõ badge "Chi nhánh: [Tên]" và vô hiệu chọn chi nhánh khác. |
| **3** | **HIGH** | **Mất sạch bộ lọc khi F5 / chia sẻ link**: Tại `/admin/orders` và `/admin/inventory`, trạng thái filter lưu trong `useState` cục bộ. | Tải lại trang hoặc chuyển tab phải nhập lại mã tìm kiếm, chọn lại ngày và trạng thái từ đầu. | Đồng bộ 100% tham số bộ lọc (`status`, `search`, `page`, `branchId`, `fromDate`, `toDate`) vào URL SearchParams. |
| **4** | **HIGH** | **Thao tác chuyển trạng thái đơn hàng cồng kềnh**: Phải bấm vào xem đơn, tìm dropdown, bấm xác nhận qua nhiều bước. | Tốn nhiều thời gian xử lý khi vào ca cao điểm nhiều đơn hàng dồn dập. | Cung cấp các nút bấm nhanh theo đúng State Machine (`Xác nhận`, `Giao hàng/Hoàn tất`, `Hủy đơn`) với 1 lượt bấm kèm xác nhận. |
| **5** | **HIGH** | **Thiếu drawer xem nhanh đơn hàng**: Xem chi tiết đơn hiện mở modal pop-up chiếm giữa màn hình, che khuất toàn bộ danh sách. | Người vận hành mất ngữ cảnh danh sách đang làm việc khi kiểm tra đơn. | Tích hợp Drawer trượt từ cạnh phải (Side-sheet) để vừa xem đơn vừa đối chiếu bảng. |
| **6** | **HIGH** | **Số liệu và % Trend giả trên Dashboard**: Doanh thu tính sai (gồm cả đơn chưa trả tiền), % tăng trưởng hardcode `18.4%`, `12.6%`, `+14.5%`. | Người quản trị nhận thông tin sai lệch về tình hình tài chính thực tế. | Xóa bỏ mọi số giả; chỉ tính doanh thu từ đơn `PAID`; tính trend thật nếu có số hôm qua, nếu không ghi rõ "chưa có dữ liệu". |
| **7** | **MEDIUM** | **Bảng dữ liệu khó quét nhanh**: Cột trạng thái, phương thức thanh toán, thời gian hiển thị chưa tối ưu thị giác. | Mỏi mắt, dễ nhìn nhầm đơn hàng khi duyệt danh sách dài. | Dùng Badge màu Pastel chuẩn semantic (Success/Warning/Destructive), format tiền tệ VND đậm rõ ràng, hiện thời gian tương đối kèm tooltip ISO. |
| **8** | **MEDIUM** | **Không có chip đếm số lượng theo trạng thái đơn hàng**: Các nút lọc trạng thái chỉ có chữ, không hiển thị số lượng đơn hiện tại. | Người quản lý phải bấm vào từng tab mới biết có đơn nào hay không. | Hiển thị chip số lượng badge bên cạnh tên trạng thái: `Tất cả (12)`, `Chờ xác nhận (3)`, `Đã xác nhận (2)`. |
| **9** | **MEDIUM** | **Cảnh báo tồn kho không có nút điều hướng nhập kho nhanh**: Xem cảnh báo kho xong phải tự tìm menu Quản lý tồn kho để nhập. | Đứt đoạn luồng công việc của nhân viên kiểm kho. | Thêm nút "Nhập kho ngay" bên cạnh từng SKU sắp hết, mở thẳng form nhập kho của đúng sản phẩm và chi nhánh đó. |
| **10** | **MEDIUM** | **Nhập kho thiếu hiển thị tồn trước và sau**: Modal nhập kho chỉ có 1 ô nhập số lượng, không hiển thị số tồn hiện tại và số tồn sau khi nhập. | Dễ nhập nhầm số lượng do không ước tính được kết quả sau khi cộng dồn. | Hiển thị rõ: Tồn hiện tại (`x`) + Số lượng nhập (`+y`) = Tồn mới (`x + y`). Validate số lượng nguyên dương $> 0$. |
| **11** | **LOW** | **Sidebar điều hướng hiện tất cả mục cho mọi role**: `BRANCH_MANAGER` và `STAFF` vẫn thấy các mục Quản lý sản phẩm, Quản lý chi nhánh, Cài đặt. | Giao diện rối mắt và gây hiểu nhầm về quyền hạn của nhân viên. | Lọc danh sách menu navigation theo đúng role của người dùng hiện tại; gom nhóm menu (Tổng quan, Vận hành bán hàng, Quản trị hệ thống). |
| **12** | **LOW** | **Thiếu phản hồi và trạng thái rỗng / lỗi / đang tải nhất quán**: Một số bảng khi tải rỗng chỉ hiện dòng chữ trơn, không có nút Thử lại hoặc hướng dẫn rõ ràng. | Người dùng bối rối không biết hệ thống bị lỗi mạng hay thực sự không có dữ liệu. | Chuẩn hóa bảng bằng Skeleton khi tải, ErrorState kèm nút "Thử lại", và EmptyState có icon minh họa và hướng dẫn hành động tiếp theo. |

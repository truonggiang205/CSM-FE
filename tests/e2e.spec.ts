import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = path.resolve("e2e-artifacts");
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Mật khẩu tài khoản seed lấy từ biến môi trường E2E_* (fallback dev seed)
const CUSTOMER_PASSWORD = process.env.E2E_CUSTOMER_PASSWORD || "Customer@123456";
const MANAGER_PASSWORD = process.env.E2E_MANAGER_PASSWORD || "Manager@123456";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";

test.describe("CSM E2E Test Suite - Stack Thực", () => {
  test("1. Khách đăng ký, chọn chi nhánh, thêm giỏ, checkout COD, xem /orders, huỷ đơn", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `cust_${timestamp}@csm.vn`;
    const testName = `Khách Hàng E2E ${timestamp}`;

    // 1.1 Khách đăng ký tài khoản
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.fill("#register-name", testName);
    await page.fill("#register-email", testEmail);
    await page.fill("#register-password", "Password@123");
    await page.fill("#register-confirm-password", "Password@123");
    await page.click("form button:has-text('Đăng ký tài khoản')");
    await page.waitForTimeout(1500);

    // 1.2 Chọn chi nhánh CSM Bến Nghé - Quận 1 (br-01)
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const modal = page.locator("div.fixed.z-\\[999\\]");
    if (!(await modal.isVisible())) {
      const branchBtn = page.locator("button[title='Nhấn để đổi chi nhánh mua hàng']");
      if (await branchBtn.isVisible()) {
        await branchBtn.click();
        await page.waitForTimeout(500);
      }
    }
    if (await modal.isVisible()) {
      const branchCard = modal.locator("div.cursor-pointer:has-text('CSM Bến Nghé - Quận 1')").first();
      await expect(branchCard).toBeVisible({ timeout: 10000 });
      await branchCard.click();
      await page.waitForTimeout(500);
    }

    // 1.3 Thêm sản phẩm vào giỏ hàng từ trang danh sách sản phẩm
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const addToCartBtn = page.locator("button:has-text('Thêm giỏ')").first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    // 1.4 Tiến hành checkout COD
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const nameInput = page.locator("#checkout-name");
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill(testName);
    await page.fill("#checkout-phone", "0901234567");
    await page.fill("#checkout-address", "123 Đường Bến Nghé, Quận 1, TP.HCM");

    // Tiếp tục đến phương thức thanh toán
    await page.click("button:has-text('Tiếp tục đến phương thức thanh toán')");
    await page.waitForTimeout(800);

    // Chọn phương thức COD
    const codRadio = page.locator("input[value='COD']");
    await expect(codRadio).toBeVisible();
    await codRadio.check();

    // Xác nhận đặt hàng
    await page.click("button:has-text('Xác nhận đặt hàng')");

    // Đợi chuyển hướng tới trang chi tiết đơn hàng
    await page.waitForURL(/\/orders\//, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // 1.5 Kiểm tra xem danh sách đơn hàng tại /orders
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Mở trang chi tiết đơn hàng từ danh sách
    const detailBtn = page.locator("a:has-text('Chi tiết')").first();
    await expect(detailBtn).toBeVisible({ timeout: 10000 });
    await detailBtn.click();

    // 1.6 Huỷ đơn hàng từ trang chi tiết
    await page.waitForURL(/\/orders\//, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const cancelBtn = page.locator("button:has-text('Huỷ đơn hàng này')");
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });
    await cancelBtn.click();

    // Xác nhận huỷ trong modal
    const confirmCancelBtn = page.locator("button:has-text('Đồng ý huỷ đơn')");
    await expect(confirmCancelBtn).toBeVisible();
    await confirmCancelBtn.click();

    // Kiểm tra trạng thái đã chuyển sang "Đơn hàng này đã bị huỷ"
    await expect(page.locator("text=Đơn hàng này đã bị huỷ")).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario1_cod_cancel.png"), fullPage: true });
  });

  test("2. Checkout MOMO, trang mô phỏng, quay về /orders/:id thấy PAID", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `momo_${timestamp}@csm.vn`;
    const testName = `Khách MoMo ${timestamp}`;

    // 2.1 Đăng ký tài khoản
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.fill("#register-name", testName);
    await page.fill("#register-email", testEmail);
    await page.fill("#register-password", "Password@123");
    await page.fill("#register-confirm-password", "Password@123");
    await page.click("form button:has-text('Đăng ký tài khoản')");
    await page.waitForTimeout(1500);

    // 2.2 Chọn chi nhánh
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const modal = page.locator("div.fixed.z-\\[999\\]");
    if (!(await modal.isVisible())) {
      const branchBtn = page.locator("button[title='Nhấn để đổi chi nhánh mua hàng']");
      if (await branchBtn.isVisible()) {
        await branchBtn.click();
        await page.waitForTimeout(500);
      }
    }
    if (await modal.isVisible()) {
      const branchCard = modal.locator("div.cursor-pointer:has-text('CSM Bến Nghé - Quận 1')").first();
      await expect(branchCard).toBeVisible({ timeout: 10000 });
      await branchCard.click();
      await page.waitForTimeout(500);
    }

    // 2.3 Thêm sản phẩm vào giỏ
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const addToCartBtn = page.locator("button:has-text('Thêm giỏ')").first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    // 2.4 Vào Checkout
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await page.fill("#checkout-name", testName);
    await page.fill("#checkout-phone", "0987654321");
    await page.fill("#checkout-address", "456 Đường Lê Lợi, Bến Nghé, Quận 1, TP.HCM");
    await page.click("button:has-text('Tiếp tục đến phương thức thanh toán')");
    await page.waitForTimeout(800);

    // 2.5 Chọn phương thức MOMO
    const momoRadio = page.locator("input[value='MOMO']");
    await expect(momoRadio).toBeVisible();
    await momoRadio.check();

    // Click nút thanh toán MoMo
    await page.click("button:has-text('Xác nhận đặt hàng')");

    // 2.6 Chuyển hướng tới trang mô phỏng thanh toán MoMo
    await page.waitForURL(/\/payments\/simulate-success\//, { timeout: 15000 });
    const simulationBtn = page.locator("#payBtn");
    await expect(simulationBtn).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario2_momo_simulation_page.png") });

    // Click xác nhận thanh toán mô phỏng
    await simulationBtn.click();

    // 2.7 Tự động redirect về trang chi tiết đơn hàng /orders/:id và hiển thị trạng thái PAID
    await page.waitForURL(/\/orders\//, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Xác minh trạng thái hiển thị "Đã thanh toán"
    const paidIndicator = page.locator("text=Đã thanh toán").first();
    await expect(paidIndicator).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario2_momo_paid_success.png"), fullPage: true });
  });

  test("3. Khách hàng (CUSTOMER) truy cập /admin/orders bị chặn", async ({ page }) => {
    // 3.1 Đăng nhập tài khoản khách hàng seed
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#login-email", "customer@csm.vn");
    await page.fill("#login-password", CUSTOMER_PASSWORD);
    await page.click("form button:has-text('Đăng nhập')");

    await page.waitForTimeout(1500);

    // 3.2 Cố tình truy cập trang quản trị đơn hàng
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Phải bị chuyển hướng tới /unauthorized
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 10000 });
    await expect(page.locator("text=Không có quyền truy cập")).toBeVisible({ timeout: 8000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario3_customer_forbidden.png"), fullPage: true });
  });

  test("4. Manager br-01 chỉ thấy đơn hàng của chi nhánh br-01", async ({ page }) => {
    // 4.1 Đăng nhập tài khoản Branch Manager br-01
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#login-email", "manager.q1@csm.vn");
    await page.fill("#login-password", MANAGER_PASSWORD);
    await page.click("form button:has-text('Đăng nhập')");

    await page.waitForTimeout(1500);

    // 4.2 Vào trang quản lý đơn hàng
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Kiểm tra huy hiệu khoá chi nhánh br-01
    const lockIndicator = page.locator("text=Khoá chi nhánh: br-01");
    await expect(lockIndicator).toBeVisible({ timeout: 10000 });

    // Kiểm tra chip chi nhánh br-01 xuất hiện
    const branchChips = page.locator("span:has-text('br-01')");
    const count = await branchChips.count();
    expect(count).toBeGreaterThan(0);

    // Đảm bảo không có chip chi nhánh br-02 hoặc br-03 trong danh sách
    const otherBranch02 = page.locator("span:has-text('br-02')");
    await expect(otherBranch02).toHaveCount(0);

    const otherBranch03 = page.locator("span:has-text('br-03')");
    await expect(otherBranch03).toHaveCount(0);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario4_manager_br01_isolated.png"), fullPage: true });
  });
});

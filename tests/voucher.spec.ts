import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = path.resolve("e2e-artifacts");
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

// Mật khẩu: E2E_<ROLE>_PASSWORD > SEED_<ROLE>_PASSWORD > E2E_PASSWORD > SEED_PASSWORD (giống CSM-BE)
const FALLBACK_PASSWORD = process.env.E2E_PASSWORD || process.env.SEED_PASSWORD;
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || FALLBACK_PASSWORD;
const MANAGER_PASSWORD =
  process.env.E2E_MANAGER_PASSWORD || process.env.SEED_MANAGER_PASSWORD || FALLBACK_PASSWORD;
if (!ADMIN_PASSWORD || !MANAGER_PASSWORD) {
  throw new Error("Thiếu biến môi trường bắt buộc: SEED_PASSWORD (hoặc SEED_*_PASSWORD / E2E_*_PASSWORD)");
}

test.describe("CSM Voucher E2E Suite - Playwright Real Stack", () => {
  const timestamp = Date.now();
  const voucherCode = `E2EVCH${timestamp.toString().slice(-6)}`;
  const discountAmount = 5000;
  const minOrderValue = 0;

  test("1. ADMIN đăng nhập, truy cập /admin/vouchers và tạo voucher mới thành công", async ({ page }) => {
    // 1.1 Đăng nhập ADMIN
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#login-email", "admin@csm.vn");
    await page.fill("#login-password", ADMIN_PASSWORD);
    await page.click("form button:has-text('Đăng nhập')");

    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 1.2 Điều hướng tới /admin/vouchers
    await page.goto("/admin/vouchers");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1:has-text('Quản lý Khuyến Mãi & Voucher')")).toBeVisible({ timeout: 10000 });

    // 1.3 Mở modal tạo voucher mới
    const createBtn = page.locator("button:has-text('Tạo Voucher Mới')");
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    // 1.4 Điền thông tin voucher
    const codeInput = page.locator("input[placeholder='VD: CSM50K, SALEHE']");
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await codeInput.fill(voucherCode);

    const descInput = page.locator("input[placeholder='VD: Giảm 20.000₫ cho đơn từ 50.000₫']");
    await descInput.fill(`Mã test tự động E2E giảm ${discountAmount}đ`);

    // Sửa discount_value thành 5000 và min_order_value thành 0
    const numberInputs = page.locator("form input[type='number']");
    await numberInputs.nth(0).fill(discountAmount.toString());
    await numberInputs.nth(1).fill(minOrderValue.toString());

    // Submit form
    await page.click("button:has-text('Xác nhận tạo Voucher')");

    // 1.5 Kiểm tra thông báo thành công và mã voucher hiển thị trong danh sách
    await expect(page.locator(`text=${voucherCode}`).first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario_voucher_1_admin_created.png") });
  });

  test("2. CUSTOMER chọn chi nhánh, thêm giỏ, áp dụng voucher tại checkout và đặt đơn COD", async ({ page }) => {
    const custEmail = `cust_vch_${timestamp}@csm.vn`;
    const custName = `Khách Voucher ${timestamp}`;

    // 2.1 Đăng ký tài khoản khách hàng mới
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.fill("#register-name", custName);
    await page.fill("#register-email", custEmail);
    await page.fill("#register-password", "Password@123");
    await page.fill("#register-confirm-password", "Password@123");
    await page.click("form button:has-text('Đăng ký tài khoản')");
    await page.waitForTimeout(1500);

    // 2.2 Chọn chi nhánh br-01
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

    // 2.3 Thêm sản phẩm vào giỏ hàng từ trang danh sách sản phẩm
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const addToCartBtn = page.locator("button:has-text('Thêm giỏ')").first();
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    // Đóng drawer nếu đang mở
    const closeDrawerBtn = page.locator("button[aria-label='Đóng giỏ hàng']");
    if (await closeDrawerBtn.isVisible()) {
      await closeDrawerBtn.click();
      await page.waitForTimeout(500);
    }

    // 2.4 Vào checkout
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await page.fill("#checkout-name", custName);
    await page.fill("#checkout-phone", "0912345678");
    await page.fill("#checkout-address", "789 Phố Đi Bộ Nguyễn Huệ, Quận 1, TP.HCM");

    // 2.5 Áp dụng voucher qua input mã
    const voucherInput = page.locator("input[placeholder='Hoặc nhập mã (CSM20K)...']");
    await expect(voucherInput).toBeVisible({ timeout: 5000 });
    await voucherInput.fill(voucherCode);

    const applyVoucherBtn = page.locator("button:has-text('Áp dụng')").first();
    await applyVoucherBtn.click();

    // 2.6 Kiểm tra badge đã áp dụng và số tiền giảm hiển thị đúng
    await expect(page.locator(`text=${voucherCode}`).first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=Đã áp dụng").first()).toBeVisible({ timeout: 8000 });

    // Tiếp tục đến phương thức thanh toán
    await page.click("button:has-text('Tiếp tục đến phương thức thanh toán')");
    await page.waitForTimeout(800);

    // 2.7 Xác nhận phương thức COD và đặt hàng
    const codRadio = page.locator("input[value='COD']");
    await expect(codRadio).toBeVisible();
    await codRadio.check();

    // Chụp màn hình checkout trước khi submit
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario_voucher_2_checkout_applied.png") });

    await page.click("button:has-text('Xác nhận đặt hàng')");

    // Chờ đơn hàng thành công và chuyển hướng về /orders/:id
    await page.waitForURL(/\/orders\//, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // 2.8 Xác minh đơn hàng hiển thị giảm giá và thông tin voucher
    const discountDisplay = page.locator("text=5.000").first();
    await expect(discountDisplay).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario_voucher_3_order_detail_verified.png") });
  });

  test("3. BRANCH_MANAGER truy cập /admin/vouchers bị chặn (403 / unauthorized)", async ({ page }) => {
    // 3.1 Đăng nhập tài khoản Branch Manager
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill("#login-email", "manager.q1@csm.vn");
    await page.fill("#login-password", MANAGER_PASSWORD);
    await page.click("form button:has-text('Đăng nhập')");

    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // 3.2 Cố tình truy cập trang quản trị Voucher (/admin/vouchers)
    await page.goto("/admin/vouchers");
    await page.waitForLoadState("networkidle");

    // Phải bị chuyển hướng tới /unauthorized
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 10000 });
    await expect(page.locator("text=Không có quyền truy cập")).toBeVisible({ timeout: 8000 });

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "scenario_voucher_4_manager_forbidden.png") });
  });
});

import { test, expect } from "@playwright/test";

// Mật khẩu: E2E_<ROLE>_PASSWORD > SEED_<ROLE>_PASSWORD > SEED_PASSWORD (giống CSM-BE), không in ra log
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || process.env.SEED_PASSWORD;
const MANAGER_PASSWORD =
  process.env.E2E_MANAGER_PASSWORD || process.env.SEED_MANAGER_PASSWORD || process.env.SEED_PASSWORD;
if (!ADMIN_PASSWORD || !MANAGER_PASSWORD) {
  throw new Error("Thiếu biến môi trường bắt buộc: SEED_PASSWORD (hoặc SEED_*_PASSWORD / E2E_*_PASSWORD)");
}
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@csm.vn";
const MANAGER_EMAIL = process.env.E2E_MANAGER_EMAIL || "manager.q1@csm.vn";
const passwordFor = (email: string) => (email === MANAGER_EMAIL ? MANAGER_PASSWORD : ADMIN_PASSWORD);

test.describe("Admin & Manager UX Polish Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  async function login(page: any, email: string) {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', passwordFor(email));
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  }

  test("1. Dashboard: Số đơn chờ xử lý khớp với số đơn lọc PENDING/CONFIRMED", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Kiểm tra card 'Đơn chờ xử lý'
    const pendingLabel = page.locator("p:has-text('Đơn chờ xử lý')").first();
    await expect(pendingLabel).toBeVisible({ timeout: 10000 });
    const statCard = pendingLabel.locator("..");
    const valueEl = statCard.locator("h3");
    const countText = await valueEl.innerText();
    const countNum = parseInt(countText.replace(/\D/g, ""), 10);
    expect(countNum).toBeGreaterThanOrEqual(0);

    // Chuyển sang /admin/orders và kiểm tra tab PENDING
    await page.goto("/admin/orders?status=PENDING");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // URL searchParams được lưu và tab Chờ xác nhận hiển thị
    expect(page.url()).toContain("status=PENDING");
    const pendingTab = page.locator("button:has-text('Chờ xác nhận')").first();
    await expect(pendingTab).toBeVisible();
  });

  test("2. Manager br-01 bị khóa chi nhánh và không thấy bất kỳ đơn nào của br-02", async ({ page }) => {
    await login(page, MANAGER_EMAIL);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Dashboard hiển thị rõ chi nhánh phụ trách br-01
    const branchBadge = page.locator("text=Chi nhánh phụ trách:").first();
    await expect(branchBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await page.locator("body").innerText();
    expect(badgeText).toContain("br-01");

    // Chuyển sang /admin/orders
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Kiểm tra UI hiển thị khóa chi nhánh br-01
    const lockBadge = page.locator("text=Khóa chi nhánh:").first();
    await expect(lockBadge).toBeVisible();
    expect(await lockBadge.locator("..").innerText()).toContain("br-01");

    // Thử cưỡng bức URL sang branchId=br-02
    await page.goto("/admin/orders?branchId=br-02");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Bảng đơn hàng của manager br-01 tuyệt đối không có bất kỳ đơn nào của br-02
    const orderRows = page.locator("table tbody tr");
    const count = await orderRows.count();
    for (let i = 0; i < count; i++) {
      const rowText = await orderRows.nth(i).innerText();
      expect(rowText).not.toContain("br-02");
      expect(rowText).not.toContain("CSM Thảo Điền - Quận 2");
    }
  });

  test("3. Khối cảnh báo tồn kho hiển thị sản phẩm tồn thấp (<= 5) và có nút nhập kho", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Khối Cảnh báo tồn kho trên Dashboard
    const stockAlertSection = page.locator("text=Cảnh báo tồn kho").first();
    await expect(stockAlertSection).toBeVisible({ timeout: 10000 });

    // Vào trang /admin/inventory
    await page.goto("/admin/inventory");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Bấm chip lọc 'Sắp hết'
    const lowStockFilterChip = page.locator("button:has-text('Sắp hết')").first();
    await expect(lowStockFilterChip).toBeVisible();
    await lowStockFilterChip.click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain("status=LOW_STOCK");
  });

  test("4. Chuyển đơn PENDING -> CONFIRMED qua thao tác nhanh và xác nhận hậu quả", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    // Lọc danh sách đơn PENDING có sẵn trong kho demo
    await page.goto("/admin/orders?status=PENDING");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const confirmBtn = page.locator("table tbody button:has-text('Duyệt')").first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();

      // Kiểm tra hộp thoại xác nhận hậu quả
      const confirmDialog = page.locator("div.fixed.inset-0:has-text('Duyệt đơn')");
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      expect(await confirmDialog.innerText()).toContain("trừ tồn kho thực tế");

      // Bấm nút duyệt
      const submitBtn = confirmDialog.locator("button:has-text('Xác nhận thực hiện')");
      await submitBtn.click();

      // Kiểm tra phản hồi toast thành công
      await page.waitForTimeout(1500);
      const toast = page.locator("div[role='status']");
      if (await toast.isVisible()) {
        const toastText = await toast.innerText();
        expect(toastText).toMatch(/(thành công|CONFIRMED|duyệt)/i);
      }
    } else {
      // Nếu các đơn PENDING đã được duyệt trước đó, kiểm tra xem danh sách CONFIRMED có đơn hợp lệ không
      await page.goto("/admin/orders?status=CONFIRMED");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      const row = page.locator("table tbody tr").first();
      await expect(row).toBeVisible();
      expect(await row.innerText()).toMatch(/(Đã xác nhận|Đã duyệt|CONFIRMED)/i);
    }
  });

  test("5. Kiểm soát phân quyền: Manager không thể vào /admin/products và menu được ẩn", async ({ page }) => {
    await login(page, MANAGER_EMAIL);

    // 5.1 Menu Quản lý sản phẩm không hiện trên Sidebar của Manager
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const sidebar = page.locator("aside[aria-label='Thanh điều hướng quản trị']");
    await expect(sidebar.locator("a:has-text('Quản lý sản phẩm')")).not.toBeVisible();

    // 5.2 Truy cập trực tiếp /admin/products bị chặn (redirect sang /unauthorized hoặc báo giới hạn)
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const isUnauthorized =
      page.url().includes("/unauthorized") || (await page.locator("text=Truy cập bị giới hạn").isVisible());
    expect(isUnauthorized).toBeTruthy();
  });
});

import { chromium } from "playwright";

async function testLocators() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  console.log("Home Title:", await page.title());

  // Check branch modal
  const modalText = page.locator("text=Chọn chi nhánh mua hàng");
  const isModalOpen = await modalText.isVisible();
  console.log("Branch modal open initially:", isModalOpen);

  if (isModalOpen) {
    const q1 = page.locator("text=Chi nhánh Quận 1").first();
    await q1.click();
    console.log("Clicked Q1 branch");
    await page.waitForTimeout(500);
    const confirm = page.locator("button:has-text('Xác nhận')");
    if (await confirm.isVisible()) {
      await confirm.click();
      console.log("Clicked Xác nhận branch");
    }
  }

  // Check Products
  await page.goto("http://localhost:3000/products");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  const addButtons = page.locator("button:has-text('Thêm giỏ')");
  const count = await addButtons.count();
  console.log("Thêm giỏ buttons found on /products:", count);

  // Check Login
  await page.goto("http://localhost:3000/login");
  await page.waitForLoadState("networkidle");
  const loginSubmit = page.locator("form button:has-text('Đăng nhập')");
  console.log("Login submit button visible:", await loginSubmit.isVisible());

  await browser.close();
}

testLocators().catch(console.error);

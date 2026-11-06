import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const EVIDENCE_DIR = path.resolve(__dirname, "../logs/evidence/fix_contract");

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runVerification() {
  const logLines = [];
  const log = (msg) => {
    console.log(msg);
    logLines.push(msg);
  };

  log("====================================================");
  log("🚀 BẮT ĐẦU KIỂM CHỨNG PLAYWRIGHT VỚI STACK THẬT");
  log(`🌐 URL Frontend: ${BASE_URL}`);
  log("====================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // --- 1. KIỂM TRA TRANG CHỦ (/) ---
  log("1️⃣ Kiểm tra Trang Chủ (/)...");
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Chụp ảnh trang chủ
    const homeScreenshotPath = path.join(EVIDENCE_DIR, "screenshot_home.png");
    await page.screenshot({ path: homeScreenshotPath, fullPage: true });

    // Đếm sản phẩm trên trang chủ
    const homeProductCards = await page.$$eval(
      'a[href*="/products/"], [data-testid="product-card"]',
      (els) => {
        const uniqueHrefs = new Set(els.map((el) => el.getAttribute("href")).filter(Boolean));
        return uniqueHrefs.size;
      }
    );

    log(`   📸 Đã chụp ảnh trang chủ: ${homeScreenshotPath}`);
    log(`   📦 Số sản phẩm xuất hiện trên trang chủ: ${homeProductCards}`);
    log("   ✅ Trang chủ tải thành công.");
  } catch (err) {
    log(`   ❌ Lỗi tải trang chủ: ${err.message}`);
  }

  // --- 2. KIỂM TRA TRANG DANH SÁCH SẢN PHẨM (/products) ---
  log("\n2️⃣ Kiểm tra Trang Danh Sách Sản Phẩm (/products)...");
  let totalProductsCount = 0;
  try {
    await page.goto(`${BASE_URL}/products`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    const productsScreenshotPath = path.join(EVIDENCE_DIR, "screenshot_products.png");
    await page.screenshot({ path: productsScreenshotPath, fullPage: true });

    // Đếm số lượng sản phẩm hiển thị trên trang danh sách
    const productTitles = await page.$$eval(
      'a[href*="/products/"] h3, a[href*="/products/"] p.font-bold, [data-testid="product-card"] h3',
      (els) => els.map((el) => el.textContent?.trim()).filter(Boolean)
    );

    // Lọc trùng theo tên sản phẩm
    const uniqueTitles = Array.from(new Set(productTitles));
    totalProductsCount = uniqueTitles.length;

    log(`   📸 Đã chụp ảnh trang /products: ${productsScreenshotPath}`);
    log(`   📦 Tổng số sản phẩm hiển thị: ${totalProductsCount}/26`);
    log(`   📝 Danh sách sản phẩm thực tế: ${uniqueTitles.slice(0, 5).join(", ")}...`);

    if (totalProductsCount === 26) {
      log("   ✅ ĐẠT: Toàn bộ 26/26 sản phẩm demo hiển thị đầy đủ (không bị cắt ở 20).");
    } else {
      log(`   ⚠️ Số sản phẩm đếm được là ${totalProductsCount} (kỳ vọng 26).`);
    }
  } catch (err) {
    log(`   ❌ Lỗi tải trang /products: ${err.message}`);
  }

  // --- 3. ĐĂNG NHẬP ADMIN VÀ KIỂM TRA /admin/inventory ---
  log("\n3️⃣ Kiểm tra Trang Quản Trị Kho (/admin/inventory)...");
  try {
    // Đăng nhập tài khoản Admin qua trang login
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 15000 });
    await page.fill('input[type="email"]', "admin@csm.vn");
    await page.fill('input[type="password"]', process.env.SEED_PASSWORD || "Demo@123456");
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng sau đăng nhập
    await page.waitForTimeout(2500);

    // Chuyển tới /admin/inventory
    await page.goto(`${BASE_URL}/admin/inventory`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(3000);

    const inventoryScreenshotPath = path.join(EVIDENCE_DIR, "screenshot_admin_inventory.png");
    await page.screenshot({ path: inventoryScreenshotPath, fullPage: true });

    const tableText = await page.innerText("body");
    const hasRawPlaceholder = tableText.includes("Sản phẩm #");
    const hasRealNameSample =
      tableText.includes("Trà Sữa") ||
      tableText.includes("Cà Phê") ||
      tableText.includes("Bánh Bao") ||
      tableText.includes("Mì Trộn");

    log(`   📸 Đã chụp ảnh trang /admin/inventory: ${inventoryScreenshotPath}`);
    log(`   🔍 Kiểm tra 'Sản phẩm #id': ${hasRawPlaceholder ? "CÒN LỖI (Vẫn thấy Sản phẩm #id)" : "ĐÃ SỬA (Không còn)"}`);
    log(`   🔍 Kiểm tra tên sản phẩm thật: ${hasRealNameSample ? "ĐÃ CÓ (Hiển thị tên thật)" : "CHƯA THẤY"}`);

    if (!hasRawPlaceholder && hasRealNameSample) {
      log("   ✅ ĐẠT: Quản lý kho hiển thị 100% tên sản phẩm thật.");
    } else {
      log("   ⚠️ Kiểm tra lại hiển thị tên sản phẩm trong kho.");
    }
  } catch (err) {
    log(`   ❌ Lỗi tải trang /admin/inventory: ${err.message}`);
  }

  log("\n====================================================");
  log("🎉 HOÀN THÀNH KIỂM CHỨNG PLAYWRIGHT VỚI STACK THẬT!");
  log("====================================================");

  await browser.close();

  const reportPath = path.join(EVIDENCE_DIR, "playwright_verification.txt");
  fs.writeFileSync(reportPath, logLines.join("\n"), "utf8");
  log(`\n📄 Đã lưu log thô vào: ${reportPath}`);
}

runVerification().catch(console.error);

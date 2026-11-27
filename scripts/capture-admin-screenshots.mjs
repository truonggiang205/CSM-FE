import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const OUTPUT_DIR = path.resolve(__dirname, "../docs/admin-ux-before-after");
const SEED_PASSWORD = process.env.SEED_PASSWORD;
if (!SEED_PASSWORD) {
  console.error("❌ Thiếu biến môi trường bắt buộc: SEED_PASSWORD");
  process.exit(1);
}

// Prefix passed via cli, e.g.: node scripts/capture-admin-screenshots.mjs --prefix=before
const prefixArg = process.argv.find((a) => a.startsWith("--prefix="));
const PREFIX = prefixArg ? prefixArg.split("=")[1] : "before";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function login(page, email, password) {
  console.log(`🔑 Logging in as ${email}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function captureRoute(context, route, filename, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  console.log(`📸 Capturing ${route} (${viewport.width}px) -> ${filename}`);
  try {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500); // Wait for animations & charts to render
    const fullPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`   ✅ Saved: ${filename}`);
  } catch (err) {
    console.error(`   ❌ Failed to capture ${route}:`, err.message);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("====================================================");
  console.log(`📸 CHỤP ẢNH GIAO DIỆN ADMIN (Tiền tố: ${PREFIX})`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Thư mục lưu: ${OUTPUT_DIR}`);
  console.log("====================================================\n");

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "1280", width: 1280, height: 800 },
    { name: "375", width: 375, height: 812 },
  ];

  // --- 1. ADMIN USER ---
  console.log("\n--- SESSION 1: ADMIN (admin@csm.vn) ---");
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, "admin@csm.vn", SEED_PASSWORD);
  await adminPage.close();

  const adminRoutes = [
    { route: "/admin", name: "dashboard-admin" },
    { route: "/admin/orders", name: "orders" },
    { route: "/admin/inventory", name: "inventory" },
    { route: "/admin/products", name: "products" },
    { route: "/admin/branches", name: "branches" },
    { route: "/admin/customers", name: "customers" },
    { route: "/admin/settings", name: "settings" },
  ];

  for (const item of adminRoutes) {
    for (const vp of viewports) {
      const filename = `${PREFIX}-${item.name}-${vp.name}.png`;
      await captureRoute(adminContext, item.route, filename, { width: vp.width, height: vp.height });
    }
  }
  await adminContext.close();

  // --- 2. BRANCH MANAGER USER ---
  console.log("\n--- SESSION 2: BRANCH MANAGER (manager.q1@csm.vn) ---");
  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();
  await login(managerPage, "manager.q1@csm.vn", SEED_PASSWORD);
  await managerPage.close();

  const managerRoutes = [
    { route: "/admin", name: "dashboard-manager" },
    { route: "/admin/orders", name: "orders-manager" },
    { route: "/admin/inventory", name: "inventory-manager" },
  ];

  for (const item of managerRoutes) {
    for (const vp of viewports) {
      const filename = `${PREFIX}-${item.name}-${vp.name}.png`;
      await captureRoute(managerContext, item.route, filename, { width: vp.width, height: vp.height });
    }
  }
  await managerContext.close();

  await browser.close();
  console.log("\n====================================================");
  console.log(`🎉 HOÀN TẤT CHỤP ẢNH GIAO DIỆN (${PREFIX})!`);
  console.log("====================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});


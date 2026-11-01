import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const GATEWAY_URL = process.env.E2E_GATEWAY_URL || "http://localhost:8000/api/v1";
const EVIDENCE_DIR = path.resolve("logs/evidence");
const SCREENSHOT_DIR = path.resolve("docs/ui-before-after");

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const viewports = [
  { name: "375px", width: 375, height: 812 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1280px", width: 1280, height: 800 },
];

const pagesToAudit = [
  { key: "home", path: "/", authRole: null },
  { key: "products", path: "/products", authRole: null },
  { key: "product_detail", path: "/products/3378aeb6-143a-4228-a455-403e933cef4c", authRole: null },
  { key: "cart", path: "/cart", authRole: null },
  { key: "checkout", path: "/checkout", authRole: "CUSTOMER" },
  { key: "orders", path: "/orders", authRole: "CUSTOMER" },
  { key: "order_detail", path: "/orders/8cdb2c55-dc1d-46f3-a959-48a0fa4aa5f6", authRole: "CUSTOMER" },
  { key: "admin_inventory", path: "/admin/inventory", authRole: "BRANCH_MANAGER" },
  { key: "admin_orders", path: "/admin/orders", authRole: "ADMIN" },
  { key: "login", path: "/login", authRole: null },
  { key: "register", path: "/register", authRole: null },
  { key: "profile", path: "/profile", authRole: "CUSTOMER" },
];

async function getAuthTokens(role) {
  let email = "customer@csm.vn";
  let password = process.env.E2E_CUSTOMER_PASSWORD || "Customer@123456";
  if (role === "ADMIN") {
    email = "admin@csm.vn";
    password = process.env.E2E_ADMIN_PASSWORD || "Admin@123456";
  } else if (role === "BRANCH_MANAGER") {
    email = "manager.q1@csm.vn";
    password = process.env.E2E_MANAGER_PASSWORD || "Manager@123456";
  }

  const res = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Failed to login as ${role}: ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

async function runAudit() {
  const browser = await chromium.launch();
  const tokens = {
    CUSTOMER: await getAuthTokens("CUSTOMER"),
    ADMIN: await getAuthTokens("ADMIN"),
    BRANCH_MANAGER: await getAuthTokens("BRANCH_MANAGER"),
  };

  const auditResults = [];

  for (const vp of viewports) {
    for (const p of pagesToAudit) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      if (p.authRole) {
        const authData = tokens[p.authRole];
        await page.addInitScript((data) => {
          localStorage.setItem("csm_access_token", data.accessToken);
          localStorage.setItem("csm_refresh_token", data.refreshToken);
          localStorage.setItem("csm_auth_user", JSON.stringify(data.user));
        }, authData);
      }

      const fullUrl = `${BASE_URL}${p.path}`;
      let status = 200;
      let error = null;
      let hasOverflow = false;
      let scrollWidth = 0;
      let title = "";

      try {
        const resp = await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 15000 });
        if (resp) status = resp.status();
        await page.waitForTimeout(1000);
        title = await page.title();

        const overflowCheck = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          return {
            scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
            clientWidth: window.innerWidth,
            hasOverflow: Math.max(doc.scrollWidth, body.scrollWidth) > window.innerWidth,
          };
        });
        hasOverflow = overflowCheck.hasOverflow;
        scrollWidth = overflowCheck.scrollWidth;

        const shotPath = path.join(SCREENSHOT_DIR, `after_${p.key}_${vp.name}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (err) {
        error = err.message;
      }

      auditResults.push({
        page: p.key,
        path: p.path,
        viewport: vp.name,
        width: vp.width,
        status,
        title,
        hasOverflow,
        scrollWidth,
        consoleErrors: consoleErrors.slice(0, 5),
        error,
      });

      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "audit_after.json"),
    JSON.stringify(auditResults, null, 2)
  );

  console.log("=== AUDIT AFTER FINISHED ===");
  console.log(JSON.stringify(auditResults, null, 2));
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});

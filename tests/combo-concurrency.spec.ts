import { test, expect, APIRequestContext } from "@playwright/test";

/**
 * Issue #25: nhiều khách đặt cùng lúc combo/sản phẩm chỉ còn số lượng giới hạn.
 * Kịch bản chạy ở tầng API (qua gateway) để bắn các request thật sự song song:
 *  1. ADMIN tạo combo giới hạn max_quantity = 1 từ một sản phẩm còn hàng.
 *  2. Nhiều khách mới đăng ký cùng đặt combo đó đồng thời.
 *  3. Chỉ đúng 1 đơn thành công, các đơn còn lại bị từ chối (409 - hết suất),
 *     và sold_count của combo không vượt quá max_quantity.
 */
const API_URL = process.env.E2E_API_URL || "http://localhost:8000/api/v1";
const FALLBACK_PASSWORD = process.env.E2E_PASSWORD || process.env.SEED_PASSWORD;
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || FALLBACK_PASSWORD;
const PARALLEL_BUYERS = Number(process.env.E2E_PARALLEL_BUYERS || 5);

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/login`, { data: { email, password } });
  expect(res.ok(), `Đăng nhập ${email} thất bại: ${res.status()}`).toBeTruthy();
  return (await res.json()).accessToken as string;
}

async function registerCustomer(request: APIRequestContext, idx: number, stamp: number) {
  const email = `cust_race_${stamp}_${idx}@csm.vn`;
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { fullName: `Khách đua ${idx}`, email, password: "Password@123" },
  });
  expect(res.ok(), `Đăng ký ${email} thất bại: ${res.status()}`).toBeTruthy();
  return (await res.json()).accessToken as string;
}

test.describe("Issue #25 - Đặt combo đồng thời khi chỉ còn 1 suất", () => {
  test.skip(!ADMIN_PASSWORD, "Thiếu SEED_PASSWORD / E2E_ADMIN_PASSWORD");

  test("chỉ 1 đơn thành công, các đơn còn lại bị từ chối và không bán vượt", async ({ request }) => {
    const stamp = Date.now();
    const adminToken = await login(request, "admin@csm.vn", ADMIN_PASSWORD!);
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Tìm 1 chi nhánh có sản phẩm còn đủ hàng cho tất cả người mua
    const branches = await (await request.get(`${API_URL}/branches`)).json();
    let branchId = "";
    let productId = "";
    for (const br of branches) {
      const inv = await (await request.get(`${API_URL}/inventory/branch/${br.id}`, { headers: adminHeaders })).json();
      const item = (Array.isArray(inv) ? inv : []).find((i: { available?: number; quantity?: number; reserved_quantity?: number }) => {
        const avail = i.available ?? (Number(i.quantity) || 0) - (Number(i.reserved_quantity) || 0);
        return avail >= PARALLEL_BUYERS;
      });
      if (item) {
        branchId = br.id;
        productId = item.product_id;
        break;
      }
    }
    expect(branchId, "Không tìm thấy chi nhánh nào còn đủ hàng để chạy test").not.toBe("");

    // 1. ADMIN tạo combo chỉ còn 1 suất
    const createRes = await request.post(`${API_URL}/combos`, {
      headers: adminHeaders,
      data: {
        name: `Combo đua ${stamp}`,
        description: "Combo test đặt hàng đồng thời",
        combo_price: 10000,
        max_quantity: 1,
        is_active: true,
        items: [{ product_id: productId, quantity: 1 }],
      },
    });
    expect(createRes.ok(), `Tạo combo thất bại: ${await createRes.text()}`).toBeTruthy();
    const combo = await createRes.json();

    // 2. Nhiều khách cùng đặt combo đó song song
    const tokens = await Promise.all(
      Array.from({ length: PARALLEL_BUYERS }, (_, i) => registerCustomer(request, i, stamp)),
    );
    const results = await Promise.all(
      tokens.map((token) =>
        request.post(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            branchId,
            items: [],
            combos: [{ comboId: combo.id, quantity: 1 }],
            shippingAddress: "1 Võ Văn Ngân, Thủ Đức",
            paymentMethod: "COD",
          },
        }),
      ),
    );

    // 3. Kiểm tra kết quả
    const statuses = results.map((r) => r.status());
    const success = statuses.filter((s) => s >= 200 && s < 300);
    const rejected = statuses.filter((s) => s === 409 || s === 400);
    expect(success.length, `Trạng thái: ${statuses.join(", ")}`).toBe(1);
    expect(rejected.length, `Trạng thái: ${statuses.join(", ")}`).toBe(PARALLEL_BUYERS - 1);

    const after = await (await request.get(`${API_URL}/combos/${combo.id}`, { headers: adminHeaders })).json();
    expect(Number(after.sold_count ?? 0)).toBeLessThanOrEqual(1);

    // Dọn dẹp: tắt combo test để không hiện ngoài storefront
    await request.patch(`${API_URL}/combos/${combo.id}`, { headers: adminHeaders, data: { is_active: false } });
  });
});

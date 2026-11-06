import { spawnSync } from "child_process";

console.log("====================================================");
console.log("🧪 CHẠY KIỂM THỬ TỰ ĐỘNG MAPPER SẢN PHẨM (CSM-FE)");
console.log("====================================================\n");

// Sử dụng Playwright test runner để chạy trực tiếp tests/mapper.spec.ts với hỗ trợ TypeScript nguyên bản
const result = spawnSync("npx.cmd", ["playwright", "test", "tests/mapper.spec.ts", "--reporter=list"], {
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  console.error("\n❌ KIỂM THỬ THẤT BẠI!");
  process.exit(result.status || 1);
} else {
  console.log("\n✅ TẤT CẢ CÁC TRƯỜNG HỢP KIỂM THỬ MAPPER ĐÃ ĐẠT!");
  process.exit(0);
}


/**
 * Chuyển đường dẫn ảnh do Backend lưu (/uploads/xxx.jpg) thành URL đầy đủ qua API Gateway.
 * URL tuyệt đối (https://...) được giữ nguyên.
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) {
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const origin = rawApiUrl.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url}`;
  }
  return url;
}

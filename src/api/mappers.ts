import { Product, Category } from "../types/product";

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu sang slug URL an toàn
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu tiếng Việt
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Bỏ ký tự đặc biệt
    .trim()
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, "-");
}

const DEFAULT_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

/**
 * Chuyển đổi dữ liệu sản phẩm từ Backend hoặc Mock sang format chuẩn của Frontend.
 * An toàn tuyệt đối với dữ liệu rỗng / null để tránh TypeError trong UI.
 */
export function mapBackendProductToFrontend(raw: any): Product {
  if (!raw || typeof raw !== "object") {
    return {
      id: "unknown",
      sku: "SKU-UNKNOWN",
      name: "Sản phẩm tiện lợi",
      slug: "san-pham-tien-loi",
      price: 0,
      description: "",
      images: [DEFAULT_PLACEHOLDER_IMAGE],
      category: {
        id: "cat-general",
        name: "Hàng tổng hợp",
        slug: "hang-tong-hop",
      },
      stock: 0,
      rating: 4.8,
      reviewsCount: 12,
    };
  }

  const id = String(raw.id || "");
  const name = String(raw.name || "Sản phẩm");
  const sku = raw.sku ? String(raw.sku) : (id ? `SKU-${id.slice(0, 8)}` : "SKU-CSM");
  const slug = raw.slug ? String(raw.slug) : (name ? `${slugify(name)}-${id.slice(0, 6)}` : id);

  // Xử lý giá tiền (Backend trả base_price, mock trả price)
  const rawPrice = raw.base_price !== undefined && raw.base_price !== null 
    ? raw.base_price 
    : (raw.price !== undefined && raw.price !== null ? raw.price : 0);
  const price = Number(rawPrice) || 0;
  const discountPrice = raw.discountPrice !== undefined && raw.discountPrice !== null 
    ? Number(raw.discountPrice) 
    : undefined;

  // Xử lý hình ảnh (Backend trả image_url, mock trả images: string[])
  let images: string[] = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.filter(Boolean);
  } else if (raw.image_url && typeof raw.image_url === "string") {
    images = [raw.image_url];
  }
  if (images.length === 0) {
    images = [DEFAULT_PLACEHOLDER_IMAGE];
  }

  // Xử lý Category
  let category: Category;
  if (raw.category && typeof raw.category === "object") {
    const catName = raw.category.name || "Chưa phân loại";
    category = {
      id: String(raw.category.id || "cat-default"),
      name: catName,
      slug: raw.category.slug || slugify(catName),
      description: raw.category.description,
    };
  } else {
    category = {
      id: "cat-default",
      name: "Hàng tiện lợi",
      slug: "hang-tien-loi",
    };
  }

  return {
    id,
    sku,
    name,
    slug,
    price,
    discountPrice,
    description: raw.description ? String(raw.description) : "",
    images,
    category,
    stock: typeof raw.stock === "number" ? raw.stock : 0,
    rating: typeof raw.rating === "number" ? raw.rating : 4.8,
    reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 42,
  };
}

/**
 * Chuyển đổi danh sách sản phẩm an toàn
 */
export function mapBackendProductsToFrontend(rawList: any[]): Product[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapBackendProductToFrontend);
}

import { Product } from "../../../types/product";
import { CartItem } from "../../../store/useCartStore";

/**
 * Bảng ánh xạ Rule-based gợi ý mua kèm dựa trên danh mục trong giỏ
 * - Có đồ uống/trà sữa -> gợi ý snack, bánh mì, đồ ăn nhanh
 * - Có đồ ăn nhanh/mì -> gợi ý trà sữa, nước giải khát, cà phê
 * - Có snack/bánh kẹo -> gợi ý thức uống thanh mát
 */
export function getCartRecommendations(
  cartItems: CartItem[],
  allProducts: Product[],
  limit = 3
): Product[] {
  if (!allProducts || allProducts.length === 0) return [];

  const cartProductIds = new Set(cartItems.map((item) => item.product.id));
  const availableProducts = allProducts.filter((p) => !cartProductIds.has(p.id));

  if (cartItems.length === 0) {
    // Nếu giỏ trống, gợi ý 3 món bán chạy nhất
    return availableProducts.slice(0, limit);
  }

  // Thu thập danh mục hiện có trong giỏ
  const categoriesInCart = new Set(
    cartItems
      .map((item) => (item.product.category?.name || "").toLowerCase())
      .filter(Boolean)
  );

  const hasDrink = Array.from(categoriesInCart).some(
    (cat) => cat.includes("uống") || cat.includes("trà") || cat.includes("cà phê")
  );
  const hasFood = Array.from(categoriesInCart).some(
    (cat) => cat.includes("ăn nhanh") || cat.includes("mì") || cat.includes("cơm") || cat.includes("bánh mì")
  );
  const hasSnack = Array.from(categoriesInCart).some(
    (cat) => cat.includes("snack") || cat.includes("kẹo")
  );

  // Ánh xạ danh mục đích cần ưu tiên gợi ý
  const targetCategoryKeywords: string[] = [];

  if (hasDrink && !hasFood && !hasSnack) {
    // Chỉ có đồ uống -> gợi ý đồ ăn kèm và snack
    targetCategoryKeywords.push("snack", "ăn nhanh", "bánh");
  } else if (hasFood && !hasDrink) {
    // Có thức ăn nhưng chưa có nước -> gợi ý đồ uống & trà sữa
    targetCategoryKeywords.push("uống", "trà", "cà phê");
  } else if (hasSnack && !hasDrink) {
    // Có snack -> gợi ý trà sữa, nước ngọt
    targetCategoryKeywords.push("uống", "trà");
  } else {
    // Đã có cả hai -> gợi ý tráng miệng hoặc sản phẩm giá ưu đãi
    targetCategoryKeywords.push("snack", "uống", "ăn nhanh");
  }

  // Phân loại và xếp hạng sản phẩm
  const matchedProducts: Product[] = [];
  const otherProducts: Product[] = [];

  for (const product of availableProducts) {
    const catName = (product.category?.name || "").toLowerCase();
    const isMatch = targetCategoryKeywords.some((keyword) => catName.includes(keyword));

    if (isMatch) {
      matchedProducts.push(product);
    } else {
      otherProducts.push(product);
    }
  }

  // Lấy tối đa limit sản phẩm ưu tiên trước, bù sản phẩm khác nếu thiếu
  const finalRecommendations = [...matchedProducts, ...otherProducts].slice(0, limit);

  return finalRecommendations;
}

import { test, expect } from "@playwright/test";
import { mapBackendProductsToFrontend, mapBackendProductToFrontend } from "../src/api/mappers";
import { mockProducts, mockPaginatedProducts } from "../src/mocks/products";

test.describe("Unit Test: mapBackendProductsToFrontend contract compatibility", () => {
  test("1. Đầu vào là MẢNG SẢN PHẨM CŨ (Array)", () => {
    const rawLegacyArray = [
      {
        id: "prod-001",
        name: "Coca Cola lon 330ml",
        base_price: 10000,
        sku: "SKU-COCA-330",
        image_url: "https://example.com/coca.png",
        category: { id: "cat-drink", name: "Nước giải khát" },
        stock: 50,
      },
      {
        id: "prod-002",
        name: "Bánh mì que cay Hải Phòng",
        price: 15000,
        discountPrice: 12000,
        images: ["https://example.com/banh-mi.png"],
      },
    ];

    const result = mapBackendProductsToFrontend(rawLegacyArray);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    // Kiểm tra sản phẩm 1
    expect(result[0].id).toBe("prod-001");
    expect(result[0].name).toBe("Coca Cola lon 330ml");
    expect(result[0].price).toBe(10000);
    expect(result[0].sku).toBe("SKU-COCA-330");
    expect(result[0].images).toEqual(["https://example.com/coca.png"]);
    expect(result[0].category.name).toBe("Nước giải khát");

    // Kiểm tra sản phẩm 2 (giá mock/frontend format)
    expect(result[1].id).toBe("prod-002");
    expect(result[1].price).toBe(15000);
    expect(result[1].discountPrice).toBe(12000);
  });

  test("2. Đầu vào là ĐỐI TƯỢNG PHÂN TRANG MỚI ({ items, total, page, limit, totalPages })", () => {
    const rawPaginatedObject = {
      items: [
        {
          id: "prod-paginated-01",
          name: "Sữa tươi Vinamilk 180ml",
          base_price: 8500,
          category: { id: "cat-milk", name: "Sữa các loại" },
        },
        {
          id: "prod-paginated-02",
          name: "Snack khoai tây Lays 54g",
          base_price: 12000,
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    const result = mapBackendProductsToFrontend(rawPaginatedObject);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe("prod-paginated-01");
    expect(result[0].name).toBe("Sữa tươi Vinamilk 180ml");
    expect(result[0].price).toBe(8500);
    expect(result[0].category.name).toBe("Sữa các loại");
    expect(result[1].id).toBe("prod-paginated-02");
    expect(result[1].price).toBe(12000);

    // Kiểm tra biến thể { data: [...] }
    const rawDataObject = {
      data: [
        { id: "prod-data-01", name: "Nước tăng lực Redbull", base_price: 15000 },
      ],
    };
    const resultData = mapBackendProductsToFrontend(rawDataObject);
    expect(resultData.length).toBe(1);
    expect(resultData[0].name).toBe("Nước tăng lực Redbull");
  });

  test("3. Đầu vào là DỮ LIỆU RỖNG / HỎNG / SAI CẤU TRÚC", () => {
    // null
    expect(mapBackendProductsToFrontend(null)).toEqual([]);
    // undefined
    expect(mapBackendProductsToFrontend(undefined)).toEqual([]);
    // Object rỗng không có items / data
    expect(mapBackendProductsToFrontend({})).toEqual([]);
    // String
    expect(mapBackendProductsToFrontend("invalid string")).toEqual([]);
    // Number
    expect(mapBackendProductsToFrontend(12345)).toEqual([]);
    // Boolean
    expect(mapBackendProductsToFrontend(true)).toEqual([]);
    // Object có items nhưng items không phải là mảng
    expect(mapBackendProductsToFrontend({ items: null })).toEqual([]);
    expect(mapBackendProductsToFrontend({ items: "not-an-array" })).toEqual([]);
    expect(mapBackendProductsToFrontend({ items: 999 })).toEqual([]);
    // Mảng chứa các phần tử null / undefined / object rỗng
    const messyArray = [null, undefined, {}, { id: "valid-1", name: "Sản phẩm hợp lệ", base_price: 5000 }];
    const messyResult = mapBackendProductsToFrontend(messyArray);
    // null/undefined bị lọc bởi filter(Boolean), object rỗng được mapBackendProductToFrontend xử lý an toàn
    expect(Array.isArray(messyResult)).toBe(true);
    expect(messyResult.length).toBe(2);
    expect(messyResult[1].id).toBe("valid-1");
    expect(messyResult[1].price).toBe(5000);
  });

  test("4. Kiểm tra mockPaginatedProducts khớp với mockProducts", () => {
    const fromPaginated = mapBackendProductsToFrontend(mockPaginatedProducts);
    const fromDirectArray = mapBackendProductsToFrontend(mockProducts);

    expect(fromPaginated.length).toBe(mockProducts.length);
    expect(fromDirectArray.length).toBe(mockProducts.length);
    expect(fromPaginated[0].id).toBe(fromDirectArray[0].id);
    expect(fromPaginated[0].name).toBe(fromDirectArray[0].name);
  });
});


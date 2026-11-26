import apiClient from "./apiClient";
import { Product } from "../types/product";
import { mapBackendProductToFrontend } from "./mappers";

export type HomeSectionType = "FLASH_SALE" | "CSM_PICKS" | "NEW_ARRIVALS";

export const HOME_SECTION_META: Record<HomeSectionType, { label: string; description: string; max: number }> = {
  FLASH_SALE: {
    label: "Giờ vàng giảm giá",
    description: "Dải sản phẩm Flash Sale có đồng hồ đếm ngược (tối đa 8 món hiển thị).",
    max: 8,
  },
  CSM_PICKS: {
    label: "CSM Picks",
    description: "4 món do cửa hàng chọn, có lời giới thiệu riêng cho từng món.",
    max: 4,
  },
  NEW_ARRIVALS: {
    label: "Mới lên kệ",
    description: "4 sản phẩm mới về được làm nổi bật.",
    max: 4,
  },
};

export const HOME_SECTION_TYPES = Object.keys(HOME_SECTION_META) as HomeSectionType[];

export interface Banner {
  id: string;
  title: string;
  highlight?: string | null;
  badge?: string | null;
  description?: string | null;
  image_url: string;
  link_url?: string | null;
  cta_text?: string | null;
  sort_order: number;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  branch_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BannerInput = Partial<Omit<Banner, "id" | "created_at" | "updated_at">>;

export interface HomeSectionProduct extends Product {
  note?: string | null;
}

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title?: string | null;
  subtitle?: string | null;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  branch_id?: string | null;
  products: HomeSectionProduct[];
}

export interface StorefrontHome {
  branch_id: string | null;
  banners: Banner[];
  sections: Record<HomeSectionType, HomeSection | null>;
}

export interface UpsertSectionInput {
  title?: string | null;
  subtitle?: string | null;
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  branch_id?: string | null;
  items: { product_id: string; note?: string | null }[];
}

/** "global" = toàn chuỗi */
export const GLOBAL_SCOPE = "global";

function mapSection(raw: any): HomeSection | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    ...raw,
    products: Array.isArray(raw.products)
      ? raw.products.map((p: any) => ({ ...mapBackendProductToFrontend(p), note: p.note ?? null }))
      : [],
  };
}

function mapSections(raw: any): Record<HomeSectionType, HomeSection | null> {
  const result = {} as Record<HomeSectionType, HomeSection | null>;
  for (const type of HOME_SECTION_TYPES) {
    result[type] = mapSection(raw?.[type]);
  }
  return result;
}

export const storefrontApi = {
  /**
   * Dữ liệu trang chủ cho khách. Trả về null nếu Backend chưa sẵn sàng,
   * để trang chủ tiếp tục dùng nội dung mặc định (mock).
   */
  getHome: async (branchId?: string | null): Promise<StorefrontHome | null> => {
    try {
      const response = await apiClient.get<any>("/storefront/home", {
        params: branchId ? { branchId } : undefined,
      });
      const data = response.data || {};
      return {
        branch_id: data.branch_id ?? null,
        banners: Array.isArray(data.banners) ? data.banners : [],
        sections: mapSections(data.sections),
      };
    } catch (err) {
      console.warn("Backend /storefront/home chưa sẵn sàng, dùng nội dung trang chủ mặc định:", err);
      return null;
    }
  },

  listBanners: async (scope: string): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>("/storefront/banners", { params: { branchId: scope } });
    return Array.isArray(response.data) ? response.data : [];
  },

  createBanner: async (data: BannerInput): Promise<Banner> => {
    const response = await apiClient.post<Banner>("/storefront/banners", data);
    return response.data;
  },

  updateBanner: async (id: string, data: BannerInput): Promise<Banner> => {
    const response = await apiClient.put<Banner>(`/storefront/banners/${id}`, data);
    return response.data;
  },

  deleteBanner: async (id: string): Promise<void> => {
    await apiClient.delete(`/storefront/banners/${id}`);
  },

  reorderBanners: async (ids: string[]): Promise<void> => {
    await apiClient.put("/storefront/banners/reorder", { ids });
  },

  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post<{ image_url: string }>("/storefront/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.image_url;
  },

  listSections: async (scope: string): Promise<Record<HomeSectionType, HomeSection | null>> => {
    const response = await apiClient.get<any>("/storefront/sections", { params: { branchId: scope } });
    return mapSections(response.data?.sections);
  },

  upsertSection: async (type: HomeSectionType, data: UpsertSectionInput): Promise<HomeSection | null> => {
    const response = await apiClient.put<any>(`/storefront/sections/${type}`, data);
    return mapSection(response.data);
  },

  deleteSection: async (type: HomeSectionType, scope: string): Promise<void> => {
    await apiClient.delete(`/storefront/sections/${type}`, { params: { branchId: scope } });
  },
};

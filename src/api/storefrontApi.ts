import apiClient from "./apiClient";
import { Product } from "../types/product";
import { mapBackendProductToFrontend } from "./mappers";

export type HomeSectionType = "FLASH_SALE" | "CSM_PICKS" | "NEW_ARRIVALS";

export const HOME_SECTION_META: Record<HomeSectionType, { label: string; description: string; max: number }> = {
  FLASH_SALE: {
    label: "Giờ vàng giảm giá",
    description: "Dải Flash Sale có đồng hồ đếm ngược. Món, giá và kiểu giảm (% / tiền mặt) lấy từ Quản lý Giờ Vàng.",
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

export type BannerPlacement = "HOME_HERO" | "PRODUCTS_TOP" | "CART" | "POPUP";

export const BANNER_PLACEMENT_META: Record<BannerPlacement, { label: string; description: string }> = {
  HOME_HERO: { label: "Slider trang chủ", description: "Slider lớn ở đầu trang chủ, tự chuyển mỗi 5 giây." },
  PRODUCTS_TOP: { label: "Đầu trang sản phẩm", description: "Dải banner ngang phía trên danh sách Tất cả sản phẩm." },
  CART: { label: "Trang giỏ hàng", description: "Banner gợi ý mua thêm hiển thị trong trang Giỏ hàng." },
  POPUP: {
    label: "Popup khuyến mãi",
    description: "Hiện một lần mỗi ngày khi khách vào web. Chỉ banner đầu tiên đang hiệu lực được dùng.",
  },
};

export const BANNER_PLACEMENTS = Object.keys(BANNER_PLACEMENT_META) as BannerPlacement[];

export interface Banner {
  id: string;
  placement?: BannerPlacement;
  click_count?: number;
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

export type AnnouncementTone = "primary" | "accent" | "danger" | "info" | "dark";

export const ANNOUNCEMENT_TONE_META: Record<AnnouncementTone, { label: string; className: string }> = {
  primary: { label: "Xanh thương hiệu", className: "bg-primary-dark text-white" },
  accent: { label: "Cam nổi bật", className: "bg-accent-dark text-white" },
  danger: { label: "Đỏ khẩn", className: "bg-danger-dark text-white" },
  info: { label: "Xanh dương", className: "bg-info-dark text-white" },
  dark: { label: "Tối", className: "bg-foreground text-background" },
};

export interface Announcement {
  id: string;
  message: string;
  link_url?: string | null;
  link_text?: string | null;
  tone: AnnouncementTone;
  sort_order: number;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
  branch_id?: string | null;
}

export type AnnouncementInput = Partial<Omit<Announcement, "id">>;

export type HomeBlockKey =
  | "QUICK_MEAL"
  | "FLASH_SALE"
  | "CSM_PICKS"
  | "NEW_ARRIVALS"
  | "COMBO"
  | "SPIN_WHEEL"
  | "CATEGORIES"
  | "FEATURED_PRODUCTS"
  | "WHY_CHOOSE_US"
  | "TESTIMONIALS";

export interface HomeLayoutBlock {
  key: HomeBlockKey;
  visible: boolean;
}

/** Thứ tự mặc định đúng như trang chủ hiện tại */
export const HOME_BLOCK_META: Record<HomeBlockKey, { label: string; description: string }> = {
  QUICK_MEAL: { label: "Bữa ăn nhanh & combo", description: "Khối giới thiệu combo bữa ăn kèm banner xoay." },
  FLASH_SALE: { label: "Giờ vàng giảm giá", description: "Flash Sale có đồng hồ đếm ngược." },
  CSM_PICKS: { label: "CSM Picks", description: "4 món cửa hàng chọn lọc." },
  NEW_ARRIVALS: { label: "Mới lên kệ", description: "Sản phẩm mới về." },
  COMBO: { label: "Combo tiết kiệm", description: "Combo 3 món, giá gốc và giá combo." },
  SPIN_WHEEL: { label: "Vòng quay may mắn", description: "Quay thưởng mỗi ngày 1 lượt." },
  CATEGORIES: { label: "Danh mục", description: "Lối tắt theo danh mục sản phẩm." },
  FEATURED_PRODUCTS: { label: "Sản phẩm tại chi nhánh", description: "Lưới sản phẩm kèm tồn kho chi nhánh." },
  WHY_CHOOSE_US: { label: "Vì sao chọn CSM", description: "4 cam kết dịch vụ." },
  TESTIMONIALS: { label: "Đánh giá khách hàng", description: "Nhận xét của khách." },
};

export const DEFAULT_HOME_LAYOUT: HomeLayoutBlock[] = (Object.keys(HOME_BLOCK_META) as HomeBlockKey[]).map((key) => ({
  key,
  visible: true,
}));

export interface StorefrontHome {
  branch_id: string | null;
  /** Banner slider trang chủ (HOME_HERO) */
  banners: Banner[];
  placements: Record<Exclude<BannerPlacement, "HOME_HERO">, Banner[]>;
  announcements: Announcement[];
  sections: Record<HomeSectionType, HomeSection | null>;
  /** null = dùng bố cục mặc định */
  layout: HomeLayoutBlock[] | null;
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
      const list = (v: any) => (Array.isArray(v) ? v : []);
      return {
        branch_id: data.branch_id ?? null,
        banners: list(data.banners),
        placements: {
          PRODUCTS_TOP: list(data.placements?.PRODUCTS_TOP),
          CART: list(data.placements?.CART),
          POPUP: list(data.placements?.POPUP),
        },
        announcements: list(data.announcements),
        sections: mapSections(data.sections),
        layout: Array.isArray(data.layout) && data.layout.length > 0 ? data.layout : null,
      };
    } catch (err) {
      console.warn("Backend /storefront/home chưa sẵn sàng, dùng nội dung trang chủ mặc định:", err);
      return null;
    }
  },

  listBanners: async (scope: string, placement?: BannerPlacement): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>("/storefront/banners", {
      params: { branchId: scope, ...(placement ? { placement } : {}) },
    });
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

  /** Ghi nhận lượt bấm banner; lỗi được bỏ qua để không ảnh hưởng điều hướng của khách. */
  trackBannerClick: (id: string): void => {
    if (!id) return;
    apiClient.post(`/storefront/banners/${id}/click`).catch(() => undefined);
  },

  listAnnouncements: async (scope: string): Promise<Announcement[]> => {
    const response = await apiClient.get<Announcement[]>("/storefront/announcements", { params: { branchId: scope } });
    return Array.isArray(response.data) ? response.data : [];
  },

  createAnnouncement: async (data: AnnouncementInput): Promise<Announcement> => {
    const response = await apiClient.post<Announcement>("/storefront/announcements", data);
    return response.data;
  },

  updateAnnouncement: async (id: string, data: AnnouncementInput): Promise<Announcement> => {
    const response = await apiClient.put<Announcement>(`/storefront/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`/storefront/announcements/${id}`);
  },

  getLayout: async (scope: string): Promise<HomeLayoutBlock[] | null> => {
    const response = await apiClient.get<any>("/storefront/layout", { params: { branchId: scope } });
    return Array.isArray(response.data?.blocks) ? response.data.blocks : null;
  },

  saveLayout: async (scope: string, blocks: HomeLayoutBlock[]): Promise<HomeLayoutBlock[]> => {
    const response = await apiClient.put<any>("/storefront/layout", { branch_id: scope, blocks });
    return response.data?.blocks || blocks;
  },

  deleteLayout: async (scope: string): Promise<void> => {
    await apiClient.delete("/storefront/layout", { params: { branchId: scope } });
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

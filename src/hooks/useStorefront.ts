import { useQuery } from "@tanstack/react-query";
import { storefrontApi } from "../api/storefrontApi";
import { useBranchStore } from "../store/useBranchStore";

/**
 * Nội dung giao diện do Admin/Manager cấu hình (banner, thông báo, bố cục...) theo chi nhánh đang chọn.
 * Dùng chung một cache cho mọi trang; trả về null khi Backend chưa sẵn sàng.
 */
export function useStorefront() {
  const { selectedBranch } = useBranchStore();
  const branchId = selectedBranch?.id || null;
  return useQuery({
    queryKey: ["storefront", "home", branchId],
    queryFn: () => storefrontApi.getHome(branchId),
    staleTime: 60_000,
  });
}

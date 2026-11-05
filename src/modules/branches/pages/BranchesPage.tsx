import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
  RotateCcw,
  Navigation,
  Globe2,
  Lock,
} from "lucide-react";
import { branchApi, CreateBranchInput, UpdateBranchInput } from "../../../api/branchApi";
import { Branch } from "../../../types/branch";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { useAuthStore } from "../../../store/useAuthStore";

interface BranchFormData {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
}

const initialFormData: BranchFormData = {
  id: "",
  name: "",
  address: "",
  phone: "",
  latitude: "",
  longitude: "",
  is_active: true,
};

export function BranchesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete / Deactivate Dialog
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      // Gọi API lấy toàn bộ chi nhánh (cả active và inactive cho admin)
      const data = await branchApi.getAllBranchesAdmin();
      if (Array.isArray(data)) {
        setBranches(data);
      } else {
        setBranches([]);
      }
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setFormData(initialFormData);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      id: branch.id,
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      latitude: branch.latitude !== null && branch.latitude !== undefined ? String(branch.latitude) : "",
      longitude: branch.longitude !== null && branch.longitude !== undefined ? String(branch.longitude) : "",
      is_active: branch.is_active !== undefined ? branch.is_active : true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Trình duyệt không hỗ trợ xác định toạ độ GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
      },
      (err) => {
        setFormError(`Không thể lấy toạ độ: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Vui lòng nhập tên chi nhánh.");
      return;
    }
    if (!formData.address.trim()) {
      setFormError("Vui lòng nhập địa chỉ chi nhánh.");
      return;
    }

    const lat = formData.latitude ? parseFloat(formData.latitude) : null;
    const lng = formData.longitude ? parseFloat(formData.longitude) : null;

    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      setFormError("Vĩ độ (latitude) không hợp lệ (phải từ -90 đến 90).");
      return;
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      setFormError("Kinh độ (longitude) không hợp lệ (phải từ -180 đến 180).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBranch) {
        const updatePayload: UpdateBranchInput = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          latitude: lat,
          longitude: lng,
          is_active: formData.is_active,
        };
        await branchApi.updateBranch(editingBranch.id, updatePayload);
      } else {
        // ID khóa hệ thống tự sinh - không gửi id lên client để backend tự sinh UUID
        const createPayload: CreateBranchInput = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          latitude: lat,
          longitude: lng,
          is_active: formData.is_active,
        };
        await branchApi.createBranch(createPayload);
      }
      handleCloseModal();
      await fetchBranches();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Có lỗi xảy ra khi lưu chi nhánh.";
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    const nextStatus = !branch.is_active;
    try {
      await branchApi.updateBranch(branch.id, { is_active: nextStatus });
      await fetchBranches();
    } catch (err: any) {
      alert(`Không thể thay đổi trạng thái: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBranch) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await branchApi.deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
      await fetchBranches();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Không thể vô hiệu hoá chi nhánh này.";
      setDeleteError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.phone && b.phone.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && b.is_active !== false) ||
        (statusFilter === "INACTIVE" && b.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBranches.length / pageSize));
  const paginatedBranches = filteredBranches.slice((page - 1) * pageSize, page * pageSize);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.is_active !== false).length;
    const inactive = total - active;
    const withGps = branches.filter((b) => b.latitude && b.longitude).length;
    return { total, active, inactive, withGps };
  }, [branches]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tiêu đề & Hành động chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            <span>Quản Lý Chi Nhánh</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Theo dõi mạng lưới cửa hàng CSM, cập nhật vị trí GPS, thông tin liên hệ và trạng thái hoạt động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBranches}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          {isAdmin && (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Thêm chi nhánh
            </Button>
          )}
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-surface rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-tint/70 text-primary-dark flex items-center justify-center shrink-0 border border-primary/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-foreground">{stats.total}</div>
            <div className="text-xs text-muted font-medium">Tổng chi nhánh</div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-surface rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-600">{stats.active}</div>
            <div className="text-xs text-muted font-medium">Đang hoạt động</div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-surface rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-600">{stats.inactive}</div>
            <div className="text-xs text-muted font-medium">Tạm ngưng</div>
          </div>
        </Card>

        <Card className="p-4 border-border bg-surface rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-sky-600">{stats.withGps}</div>
            <div className="text-xs text-muted font-medium">Đã gắn GPS</div>
          </div>
        </Card>
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <Card className="p-4 border-border bg-surface rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Tìm theo tên chi nhánh, địa chỉ, số điện thoại, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl text-sm bg-background border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái ({branches.length})</option>
              <option value="ACTIVE">Đang hoạt động ({stats.active})</option>
              <option value="INACTIVE">Tạm ngưng ({stats.inactive})</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bảng dữ liệu / Danh sách chi nhánh */}
      <Card className="border-border bg-surface rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-muted space-y-3">
            <RefreshCw className="w-7 h-7 mx-auto animate-spin text-primary" />
            <p className="text-sm font-semibold">Đang tải danh sách chi nhánh...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center text-muted space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-muted/50" />
            <p className="text-base font-bold text-foreground">Không tìm thấy chi nhánh nào</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Thử thay đổi từ khoá tìm kiếm hoặc kiểm tra lại bộ lọc trạng thái.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-soft/60 text-xs text-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mã Chi Nhánh</th>
                    <th className="py-3 px-4">Tên & Địa Chỉ</th>
                    <th className="py-3 px-4">Số Điện Thoại</th>
                    <th className="py-3 px-4">Toạ Độ GPS</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedBranches.map((branch) => {
                    const isActive = branch.is_active !== false;
                    const hasCoords = branch.latitude !== null && branch.longitude !== null && branch.latitude !== undefined && branch.longitude !== undefined;

                    return (
                      <tr key={branch.id} className="hover:bg-surface-soft/40 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                            <span>{branch.id}</span>
                            <button
                              onClick={() => handleCopyId(branch.id)}
                              className="text-muted hover:text-primary transition-colors p-1 rounded-md"
                              title="Sao chép mã"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {copiedId === branch.id && (
                              <span className="text-[10px] text-primary font-sans font-bold">Đã chép</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top max-w-xs">
                          <div className="font-bold text-foreground text-sm">{branch.name}</div>
                          <div className="text-xs text-muted flex items-start gap-1 mt-1 leading-relaxed">
                            <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                            <span>{branch.address || "Chưa cập nhật địa chỉ"}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {branch.phone ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Phone className="w-3.5 h-3.5 text-muted" />
                              <a href={`tel:${branch.phone}`} className="hover:text-primary transition-colors">
                                {branch.phone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-muted italic">Chưa có SĐT</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {hasCoords ? (
                            <div className="space-y-1">
                              <div className="font-mono text-[11px] text-muted">
                                {branch.latitude?.toFixed(4)}, {branch.longitude?.toFixed(4)}
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                              >
                                <span>Xem bản đồ</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-muted/60 italic">Chưa gắn toạ độ</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {isActive ? (
                            <Badge variant="success" className="font-bold text-xs">
                              Đang hoạt động
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs">
                              Tạm ngưng
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(branch)}
                                  className="h-8 px-2.5 rounded-lg text-xs font-semibold hover:bg-surface-soft text-foreground"
                                  title="Chỉnh sửa chi nhánh"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  Sửa
                                </Button>

                                {isActive ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDeletingBranch(branch);
                                      setDeleteError(null);
                                    }}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                    title="Vô hiệu hoá chi nhánh"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Ngưng
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActive(branch)}
                                    className="h-8 px-2.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                    title="Kích hoạt lại chi nhánh"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    Kích hoạt
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border">
              {paginatedBranches.map((branch) => {
                const isActive = branch.is_active !== false;
                const hasCoords = branch.latitude !== null && branch.longitude !== null && branch.latitude !== undefined && branch.longitude !== undefined;

                return (
                  <div key={branch.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-foreground text-sm">{branch.name}</div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-muted mt-0.5">
                          <span>{branch.id}</span>
                          <button
                            onClick={() => handleCopyId(branch.id)}
                            className="text-muted hover:text-primary p-0.5"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {isActive ? (
                        <Badge variant="success" className="font-bold text-xs shrink-0">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs shrink-0">
                          Tạm ngưng
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                      <span>{branch.address || "Chưa cập nhật địa chỉ"}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1 border-t border-border/60">
                      {branch.phone ? (
                        <a href={`tel:${branch.phone}`} className="flex items-center gap-1 text-foreground font-semibold hover:text-primary">
                          <Phone className="w-3.5 h-3.5 text-muted" />
                          <span>{branch.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted italic">Chưa có SĐT</span>
                      )}

                      {hasCoords && (
                        <a
                          href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                        >
                          <span>Xem Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(branch)}
                          className="h-8 px-3 rounded-lg text-xs font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Sửa
                        </Button>

                        {isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingBranch(branch);
                              setDeleteError(null);
                            }}
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Ngưng
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(branch)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Kích hoạt
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
                <div>
                  Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredBranches.length)} trong tổng số {filteredBranches.length} chi nhánh
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                  >
                    Trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        p === page
                          ? "bg-primary text-white shadow-xs"
                          : "text-foreground hover:bg-surface-soft border border-border/60"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal Thêm / Chỉnh Sửa Chi Nhánh */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-soft/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-tint text-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {editingBranch ? "Chỉnh Sửa Chi Nhánh" : "Thêm Chi Nhánh Mới"}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-xl text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Mã chi nhánh (Khóa) */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted" />
                  <span>Mã chi nhánh (ID)</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={editingBranch ? formData.id : ""}
                    placeholder={editingBranch ? "" : "Tự động sinh khi tạo mới"}
                    disabled
                    readOnly
                    className="rounded-xl h-10 text-xs bg-surface-soft/80 border-border font-mono text-muted cursor-not-allowed select-none pl-9"
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Tên chi nhánh */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Tên chi nhánh <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Vd: CSM Quận 3 - Nam Kỳ Khởi Nghĩa"
                  value={formData.name}
                  required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl h-10 text-sm bg-background border-border"
                />
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Địa chỉ chi nhánh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  placeholder="Vd: 200 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM"
                  value={formData.address}
                  required
                  rows={2}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-background border border-border text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Số điện thoại liên hệ
                </label>
                <Input
                  type="text"
                  placeholder="Vd: 028.3930.0004"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl h-10 text-sm bg-background border-border"
                />
              </div>

              {/* Toạ độ GPS */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-primary" />
                    <span>Toạ độ GPS (Dùng tìm chi nhánh gần nhất)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetLiveLocation}
                    className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lấy vị trí của tôi</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">Vĩ độ (Latitude)</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Vd: 10.7850000"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="rounded-xl h-9 text-xs bg-background border-border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">Kinh độ (Longitude)</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Vd: 106.6900000"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="rounded-xl h-9 text-xs bg-background border-border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Trạng thái hoạt động */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span className="text-xs font-bold text-foreground">
                    Kích hoạt chi nhánh ngay (Đang hoạt động)
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold"
                >
                  Huỷ bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white px-5 shadow-sm"
                >
                  {isSubmitting ? "Đang lưu..." : editingBranch ? "Cập nhật" : "Tạo chi nhánh"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận Vô hiệu hoá / Xoá chi nhánh */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-foreground">Xác nhận tạm ngưng chi nhánh?</h3>
              <p className="text-xs text-muted leading-relaxed">
                Bạn sắp tạm ngưng hoạt động chi nhánh:{" "}
                <span className="font-bold text-foreground">{deletingBranch.name}</span> ({deletingBranch.id}).
              </p>
            </div>

            <div className="p-3 bg-surface-soft rounded-2xl text-xs text-muted space-y-1.5 border border-border/60">
              <div className="font-semibold text-foreground">⚠️ Quy tắc kiểm tra an toàn:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Hệ thống sẽ từ chối nếu chi nhánh còn hàng tồn kho &gt; 0.</li>
                <li>Hệ thống sẽ từ chối nếu còn đơn hàng đang Chờ xử lý hoặc Đã xác nhận.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => {
                  setDeletingBranch(null);
                  setDeleteError(null);
                }}
                className="rounded-xl text-xs font-semibold flex-1"
              >
                Giữ lại
              </Button>
              <Button
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex-1"
              >
                {isDeleting ? "Đang xử lý..." : "Xác nhận ngưng"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

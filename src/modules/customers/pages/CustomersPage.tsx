import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  UserCheck,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { authApi, UserProfile } from "../../../api/authApi";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";

export function CustomersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === "ALL" || u.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // Thống kê người dùng theo vai trò
  const counts = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter((u) => u.role === "CUSTOMER").length,
      managers: users.filter((u) => u.role === "BRANCH_MANAGER").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-pastel text-danger-dark border border-danger/25">
            <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên
          </span>
        );
      case "BRANCH_MANAGER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-tint text-accent-dark border border-accent/25">
            <Building2 className="w-3.5 h-3.5" /> Quản lý chi nhánh
          </span>
        );
      case "STAFF":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-info-pastel text-info-dark border border-info/25">
            <UserCheck className="w-3.5 h-3.5" /> Nhân viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-tint text-primary-dark border border-primary/25">
            <Users className="w-3.5 h-3.5" /> Khách hàng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Quản lý Người dùng
          </h1>
          <p className="text-sm text-muted">
            Danh sách tài khoản khách hàng, nhân viên và quản lý trong chuỗi cửa hàng CSM
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-primary-tint border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Tổng người dùng</p>
            <p className="text-xl font-bold text-foreground">{counts.total}</p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-primary-tint/60 border border-primary/20 flex items-center justify-center text-primary-dark shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Khách hàng</p>
            <p className="text-xl font-bold text-foreground">{counts.customers}</p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-accent-tint border border-accent/25 flex items-center justify-center text-accent-dark shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Quản lý chi nhánh</p>
            <p className="text-xl font-bold text-foreground">{counts.managers}</p>
          </div>
        </Card>

        <Card className="p-4 bg-surface border-border flex items-center gap-3 rounded-2xl">
          <div className="w-11 h-11 rounded-xl bg-danger-pastel border border-danger/25 flex items-center justify-center text-danger-dark shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Quản trị viên</p>
            <p className="text-xl font-bold text-foreground">{counts.admins}</p>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-surface border-border rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo email, họ tên, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-foreground hover:bg-surface-soft transition-colors"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 rounded-xl bg-surface-soft hover:bg-border/60 border border-border text-foreground text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all appearance-none"
                aria-label="Lọc theo vai trò"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="CUSTOMER">Khách hàng</option>
                <option value="BRANCH_MANAGER">Quản lý chi nhánh</option>
                <option value="STAFF">Nhân viên</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft text-muted text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Chi nhánh gán</th>
                <th className="px-4 py-3">Ngày tham gia</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <p className="font-medium text-foreground">Không tìm thấy người dùng nào</p>
                    <p className="text-xs mt-1">Thử đổi từ khóa tìm kiếm hoặc bộ lọc vai trò</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-tint border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {u.email.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {u.fullName || u.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-muted flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3.5">
                      {u.branch_id ? (
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-surface-soft border border-border text-foreground">
                          {u.branch_id}
                        </span>
                      ) : (
                        <span className="text-xs text-muted font-mono">_</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("vi-VN")
                          : "Gần đây"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyId(u.id)}
                        className="h-8 px-2 text-xs text-muted hover:text-foreground rounded-lg"
                        title="Sao chép ID người dùng"
                      >
                        {copiedId === u.id ? (
                          <span className="text-primary text-[11px] font-semibold">Đã copy!</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="w-3.5 h-3.5" /> ID
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang người dùng */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted bg-surface-soft/40">
          <div>
            Trang <b className="text-foreground">{page}</b> / <b className="text-foreground">{totalPages}</b> (Tổng <b className="text-foreground">{filteredUsers.length}</b> người dùng)
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl h-8 text-xs font-semibold"
              >
                &larr; Trước
              </Button>
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-muted">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          page === p
                            ? "bg-primary text-white shadow-2xs"
                            : "text-muted hover:text-foreground hover:bg-surface"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-xl h-8 text-xs font-semibold"
              >
                Sau &rarr;
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CustomersPage;


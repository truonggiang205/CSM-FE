import { useState } from "react";
import {
  Settings,
  Store,
  Truck,
  CreditCard,
  Save,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"store" | "delivery" | "payment">("store");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dữ liệu cài đặt mẫu
  const [settings, setSettings] = useState({
    storeName: "CSM Convenience Store System",
    hotline: "1900 6868",
    supportEmail: "support@csm.vn",
    headquarters: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    openingHours: "24/7 (Phục vụ cả ngày lẫn đêm)",
    baseShippingFee: 15000,
    freeShippingThreshold: 150000,
    maxDeliveryDistanceKm: 15,
    autoCancelMinutes: 30,
    enableMomo: true,
    enableCod: true,
    enableAtm: true,
    sagaStockReservationMinutes: 15,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Cài đặt Hệ thống
          </h1>
          <p className="text-sm text-muted">
            Quản lý thông tin chuỗi cửa hàng, chính sách giao hàng, cổng thanh toán và cấu hình Microservices
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-tint text-primary-dark border border-primary/25 text-sm font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Đã lưu cấu hình thành công!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { key: "store", label: "Cửa hàng & Liên hệ", icon: Store },
          { key: "delivery", label: "Vận chuyển & Giao hàng", icon: Truck },
          { key: "payment", label: "Thanh toán & Đơn hàng", icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface hover:bg-surface-soft text-muted hover:text-foreground border border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === "store" && (
          <Card className="p-6 bg-surface border-border rounded-2xl space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Store className="w-5 h-5 text-primary" /> Thông tin Chuỗi Cửa Hàng CSM
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName">Tên chuỗi cửa hàng</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hotline">Tổng đài hỗ trợ</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="hotline"
                    value={settings.hotline}
                    onChange={(e) => setSettings({ ...settings, hotline: e.target.value })}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supportEmail">Email hỗ trợ khách hàng</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="supportEmail"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="openingHours">Khung giờ hoạt động</Label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="openingHours"
                    value={settings.openingHours}
                    onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="headquarters">Địa chỉ trụ sở chính</Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="headquarters"
                    value={settings.headquarters}
                    onChange={(e) => setSettings({ ...settings, headquarters: e.target.value })}
                    className="pl-9 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "delivery" && (
          <Card className="p-6 bg-surface border-border rounded-2xl space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Truck className="w-5 h-5 text-primary" /> Cấu hình Giao hàng & Bán kính GPS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseShippingFee">Phí ship cơ bản (VNĐ)</Label>
                <Input
                  id="baseShippingFee"
                  type="number"
                  value={settings.baseShippingFee}
                  onChange={(e) => setSettings({ ...settings, baseShippingFee: Number(e.target.value) })}
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="freeShippingThreshold">Miễn phí ship cho đơn từ (VNĐ)</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })
                  }
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxDistance">Bán kính giao hàng tối đa từ chi nhánh (km)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={settings.maxDeliveryDistanceKm}
                  onChange={(e) =>
                    setSettings({ ...settings, maxDeliveryDistanceKm: Number(e.target.value) })
                  }
                  className="rounded-xl font-mono"
                />
                <p className="text-xs text-muted">
                  Được tính tự động theo công thức Haversine toạ độ GPS từ Inventory Service
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="autoCancel">Thời gian giữ đơn chờ thanh toán (phút)</Label>
                <Input
                  id="autoCancel"
                  type="number"
                  value={settings.autoCancelMinutes}
                  onChange={(e) => setSettings({ ...settings, autoCancelMinutes: Number(e.target.value) })}
                  className="rounded-xl font-mono"
                />
                <p className="text-xs text-muted">
                  Quá thời hạn trên, Saga sẽ tự động hủy đơn và hoàn lại số lượng tồn kho
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "payment" && (
          <Card className="p-6 bg-surface border-border rounded-2xl space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="w-5 h-5 text-primary" /> Phương thức Thanh toán & Saga
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-soft border border-border">
                <div>
                  <p className="font-semibold text-foreground">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-muted">Khách hàng thanh toán tiền mặt khi shipper giao hàng</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableCod}
                  onChange={(e) => setSettings({ ...settings, enableCod: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-soft border border-border">
                <div>
                  <p className="font-semibold text-foreground">Cổng thanh toán MoMo (Mô phỏng bảo mật)</p>
                  <p className="text-xs text-muted">Cấp token ký số 10 phút, kiểm tra chữ ký HMAC chống can thiệp</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableMomo}
                  onChange={(e) => setSettings({ ...settings, enableMomo: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-soft border border-border">
                <div>
                  <p className="font-semibold text-foreground">Chuyển khoản Ngân hàng / ATM VNPay</p>
                  <p className="text-xs text-muted">Hỗ trợ cổng thanh toán trực tuyến mô phỏng an toàn</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAtm}
                  onChange={(e) => setSettings({ ...settings, enableAtm: e.target.checked })}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" className="flex items-center gap-2 px-6 h-11 rounded-xl shadow-sm">
            <Save className="w-4 h-4" /> Lưu cấu hình
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;


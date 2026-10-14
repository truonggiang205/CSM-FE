// TODO: Replace with real Analytics & Reporting API when backend endpoints are ready
import { OrderStatus } from "../api/orderApi";

export interface RevenueDataPoint {
  date: string;
  dayName: string;
  revenue: number;
  orders: number;
}

export interface RecentOrderOverview {
  id: string;
  customerName: string;
  customerAvatar: string;
  itemsCount: number;
  totalAmount: number;
  status: OrderStatus;
  branchName: string;
  timeAgo: string;
}

export const mockRevenueWeeklyData: RevenueDataPoint[] = [
  { date: "08/10", dayName: "T2", revenue: 14200000, orders: 124 },
  { date: "09/10", dayName: "T3", revenue: 18500000, orders: 148 },
  { date: "10/10", dayName: "T4", revenue: 16800000, orders: 135 },
  { date: "11/10", dayName: "T5", revenue: 22400000, orders: 182 },
  { date: "12/10", dayName: "T6", revenue: 28900000, orders: 215 },
  { date: "13/10", dayName: "T7", revenue: 34500000, orders: 268 },
  { date: "14/10", dayName: "CN", revenue: 38200000, orders: 295 },
];

export const mockRecentOrders: RecentOrderOverview[] = [
  {
    id: "ord-9821",
    customerName: "Nguyễn Thị Mai",
    customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    itemsCount: 4,
    totalAmount: 145000,
    status: "PAID",
    branchName: "Chi nhánh Quận 1",
    timeAgo: "5 phút trước",
  },
  {
    id: "ord-9820",
    customerName: "Trần Minh Quân",
    customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    itemsCount: 2,
    totalAmount: 78000,
    status: "SHIPPED",
    branchName: "Chi nhánh Bình Thạnh",
    timeAgo: "18 phút trước",
  },
  {
    id: "ord-9819",
    customerName: "Lê Hoàng Yến",
    customerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    itemsCount: 6,
    totalAmount: 320000,
    status: "PENDING",
    branchName: "Chi nhánh Quận 7",
    timeAgo: "35 phút trước",
  },
  {
    id: "ord-9818",
    customerName: "Phạm Quốc Tuấn",
    customerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    itemsCount: 3,
    totalAmount: 95000,
    status: "SHIPPED",
    branchName: "Chi nhánh Thủ Đức",
    timeAgo: "1 giờ trước",
  },
  {
    id: "ord-9817",
    customerName: "Đỗ Bảo Trâm",
    customerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    itemsCount: 1,
    totalAmount: 35000,
    status: "CANCELLED",
    branchName: "Chi nhánh Quận 1",
    timeAgo: "2 giờ trước",
  },
];

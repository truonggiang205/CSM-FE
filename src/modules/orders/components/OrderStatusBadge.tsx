import React from "react";
import { OrderStatus } from "../../../api/orderApi";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className = "" }: OrderStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-pastel text-warning-dark border border-warning/30 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-warning-dark animate-pulse" />
          Chờ xử lý (Pending)
        </span>
      );
    case "CONFIRMED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-info-pastel text-info-dark border border-info/30 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-info-dark" />
          Đã xác nhận (Confirmed)
        </span>
      );
    case "PAID":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-tint text-primary-dark border border-primary/30 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Đã thanh toán (Paid)
        </span>
      );
    case "SHIPPED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-pastel text-success-dark border border-success/30 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Đang giao (Shipped)
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-pastel text-danger-dark border border-danger/30 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-danger-dark" />
          Đã hủy (Cancelled)
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-soft text-muted border border-border ${className}`}
        >
          {status}
        </span>
      );
  }
}

export default OrderStatusBadge;


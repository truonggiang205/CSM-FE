import React from "react";
import { OrderStatus } from "../../../api/orderApi";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  onClick?: () => void;
}

export function OrderStatusBadge({ status, className = "", onClick }: OrderStatusBadgeProps) {
  const clickableClass = onClick ? "cursor-pointer hover:opacity-85 transition-opacity" : "";

  switch (status) {
    case "PENDING":
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-pastel text-warning-dark border border-warning/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-warning-dark animate-pulse" />
          Chờ xử lý
        </span>
      );
    case "CONFIRMED":
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-info-pastel text-info-dark border border-info/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-info-dark" />
          Đã xác nhận
        </span>
      );
    case "PAID":
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-tint text-primary-dark border border-primary/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Đã thanh toán
        </span>
      );
    case "SHIPPED":
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-pastel text-success-dark border border-success/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Đang giao
        </span>
      );
    case "CANCELLED":
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-pastel text-danger-dark border border-danger/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-danger-dark" />
          Đã hủy
        </span>
      );
    default:
      return (
        <span
          onClick={onClick}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-soft text-muted border border-border ${clickableClass} ${className}`}
        >
          {status}
        </span>
      );
  }
}

export function PaymentStatusBadge({
  status,
  className = "",
  onClick,
}: {
  status: OrderStatus;
  className?: string;
  onClick?: () => void;
}) {
  const isPaid = status === "PAID" || status === "SHIPPED";
  const isCancelled = status === "CANCELLED";
  const clickableClass = onClick ? "cursor-pointer hover:shadow-xs hover:scale-105 active:scale-95 transition-all" : "";

  if (isCancelled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-pastel text-danger-dark border border-danger/30 shadow-xs ${clickableClass} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-danger-dark" />
        Đã hủy
      </button>
    );
  }

  if (isPaid) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-tint text-primary-dark border border-primary/30 shadow-xs ${clickableClass} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        Đã thanh toán
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-pastel text-warning-dark border border-warning/30 shadow-xs ${clickableClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-warning-dark animate-pulse" />
      Chưa thanh toán
    </button>
  );
}

export function DeliveryStatusBadge({
  status,
  className = "",
  onClick,
}: {
  status: OrderStatus;
  className?: string;
  onClick?: () => void;
}) {
  const clickableClass = onClick ? "cursor-pointer hover:shadow-xs hover:scale-105 active:scale-95 transition-all" : "";

  switch (status) {
    case "SHIPPED":
      return (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-pastel text-success-dark border border-success/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Đã giao hàng
        </button>
      );
    case "PAID":
      return (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-info-pastel text-info-dark border border-info/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-info-dark animate-pulse" />
          Đang giao hàng
        </button>
      );
    case "CONFIRMED":
      return (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          Chờ lấy hàng
        </button>
      );
    case "CANCELLED":
      return (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-pastel text-danger-dark border border-danger/30 shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-danger-dark" />
          Đã hủy
        </button>
      );
    case "PENDING":
    default:
      return (
        <button
          type="button"
          onClick={onClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-soft text-muted border border-border shadow-xs ${clickableClass} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-muted" />
          Chờ xử lý
        </button>
      );
  }
}

export default OrderStatusBadge;

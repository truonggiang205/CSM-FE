import React from "react";
import { Link } from "react-router-dom";
import { storefrontApi } from "../../api/storefrontApi";

interface BannerLinkProps {
  to?: string | null;
  bannerId?: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  "aria-label"?: string;
}

/** Link của banner: nội bộ dùng React Router, link ngoài mở tab mới; mỗi lần bấm được ghi nhận lượt click. */
export function BannerLink({ to, bannerId, className, children, onNavigate, ...rest }: BannerLinkProps) {
  const href = to || "/products";
  const handleClick = () => {
    if (bannerId) storefrontApi.trackBannerClick(bannerId);
    onNavigate?.();
  };

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

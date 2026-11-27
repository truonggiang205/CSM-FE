import { useState } from "react";
import { resolveAssetUrl } from "../../lib/assetUrl";
import { cn } from "../../lib/utils";
import { getInitials } from "../../lib/initials";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  textClassName?: string;
}

/**
 * Ảnh đại diện người dùng: hiện ảnh nếu có, lỗi tải ảnh hoặc chưa có thì hiện chữ viết tắt.
 * Kích thước, bo góc truyền qua className (VD: "w-8 h-8 rounded-xl").
 */
export function UserAvatar({ avatarUrl, name, email, className, textClassName }: UserAvatarProps) {
  const src = avatarUrl ? resolveAssetUrl(avatarUrl) : "";
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden shrink-0 bg-primary-tint border border-primary/25 text-primary-dark font-bold select-none",
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ? `Ảnh đại diện của ${name}` : "Ảnh đại diện"}
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(src)}
          draggable={false}
        />
      ) : (
        <span className={cn("leading-none", textClassName)} aria-hidden="true">
          {getInitials(name, email)}
        </span>
      )}
    </span>
  );
}

export default UserAvatar;

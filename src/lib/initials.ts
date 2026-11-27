/** Lấy chữ cái viết tắt từ họ tên (bỏ các từ bắt đầu bằng số), dự phòng bằng email */
export function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  const words = source.split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0]?.[0] || source[0] || "U").toUpperCase();
}

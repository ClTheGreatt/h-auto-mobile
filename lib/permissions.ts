import type { User } from "../types";

// Sino ang pwedeng i-manage (status change) ng kasalukuyang naka-login na user?
export function canManage(
  currentUser: User | null,
  target: { id: string; role: string },
): boolean {
  if (!currentUser) return false;
  if (target.id === currentUser.id) return false; // not yourself
  if (target.role === "SUPER_ADMIN") return false; // never from mobile
  if (target.role === "ADMIN" && currentUser.role !== "SUPER_ADMIN")
    return false; // only super admin manages admins
  return true;
}

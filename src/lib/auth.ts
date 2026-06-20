import { cookies } from "next/headers";

export const ADMIN_COOKIE = "onenav_admin";

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "1";
}

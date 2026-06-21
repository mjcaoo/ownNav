import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "onenav_admin";

const ADMIN_TOKEN_SECRET = process.env.ADMIN_PASSWORD || "admin123456";

/**
 * 生成带签名的管理令牌: "randomHex:hmacSignature"
 * 防止 Cookie 值被轻易伪造
 */
export function createAdminToken(): string {
  const randomPart = randomBytes(32).toString("hex");
  const signature = createHash("sha256")
    .update(randomPart + ":" + ADMIN_TOKEN_SECRET)
    .digest("hex");
  return randomPart + ":" + signature;
}

/**
 * 验证管理令牌是否有效
 */
export function verifyAdminToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [randomPart, signature] = parts;
  const expected = createHash("sha256")
    .update(randomPart + ":" + ADMIN_TOKEN_SECRET)
    .digest("hex");

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * 使用恒定时间比较验证密码，防时序攻击
 */
export function verifyAdminPassword(password: string): boolean {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD || "admin123456");
  const input = Buffer.from(password);

  if (expected.length !== input.length) {
    // 仍然做一次比较以避免泄露长度信息
    timingSafeEqual(expected, expected);
    return false;
  }

  return timingSafeEqual(input, expected);
}

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

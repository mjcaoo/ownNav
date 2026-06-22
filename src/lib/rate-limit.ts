/**
 * 内存级登录速率限制
 * 每个 IP 在 15 分钟内最多 5 次失败尝试，超出后冷却 15 分钟
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 分钟
const BLOCK_MS = 15 * 60 * 1000; // 封锁 15 分钟

type AttemptRecord = {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
};

const attempts = new Map<string, AttemptRecord>();

// 定时清理过期记录，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now > record.firstAttempt + BLOCK_MS * 2) {
      attempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // 每 5 分钟清理一次

export type RateLimitResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSeconds: number };

export function checkLoginRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    // 首次尝试
    attempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: null });
    return { ok: true };
  }

  // 检查是否处于封锁期
  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      ok: false,
      error: "登录尝试过多，请稍后再试",
      retryAfterSeconds,
    };
  }

  // 检查窗口是否过期
  if (now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: null });
    return { ok: true };
  }

  // 窗口内递增计数
  record.count += 1;

  if (record.count > MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
    const retryAfterSeconds = Math.ceil(BLOCK_MS / 1000);
    return {
      ok: false,
      error: "登录尝试过多，请 15 分钟后再试",
      retryAfterSeconds,
    };
  }

  return { ok: true };
}

export function clearLoginRateLimit(ip: string) {
  attempts.delete(ip);
}

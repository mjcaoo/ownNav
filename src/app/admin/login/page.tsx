import type { Metadata } from "next";
import Link from "next/link";
import { loginAdmin } from "../actions";

export const metadata: Metadata = {
  title: "登录",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_36%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200 backdrop-blur">
        <Link href="/" className="text-sm font-semibold text-blue-600">
          ← 返回首页
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-950">登录管理后台</h1>

        {params?.error === "rate_limit" ? (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            登录尝试次数过多，请 15 分钟后再试。
          </div>
        ) : params?.error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            密码不正确，请重新输入。
          </div>
        ) : null}

        <form action={loginAdmin} className="mt-6 grid gap-3">
          <label className="admin-label">
            管理密码
            <input
              name="password"
              type="password"
              required
              className="admin-input"
              placeholder="请输入后台管理密码"
            />
          </label>
          <button className="admin-button min-h-10" type="submit">
            登录
          </button>
        </form>
      </div>
    </main>
  );
}

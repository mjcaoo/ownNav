import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAdmin } from "./actions";

const navItems = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/links", label: "链接管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/settings", label: "站点设置" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 font-bold text-white">
            N
          </span>
          <span>
            <span className="block text-sm text-slate-500">OneNav MVP</span>
            <span className="font-semibold">管理后台</span>
          </span>
        </Link>

        <nav className="mt-10 grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logoutAdmin} className="absolute bottom-5 left-5 right-5">
          <button className="admin-button-secondary w-full" type="submit">
            退出登录
          </button>
        </form>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="font-semibold">
              管理后台
            </Link>
            <form action={logoutAdmin}>
              <button className="text-sm font-semibold text-slate-500" type="submit">
                退出
              </button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
      </div>
    </main>
  );
}

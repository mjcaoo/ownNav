"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Settings = {
  title: string;
  logoText: string;
  themeColor: string;
};

type NavItem = {
  href: string;
  label: string;
};

export function AdminShell({
  settings,
  navItems,
  logoutAction,
  children,
}: {
  settings: Settings;
  navItems: NavItem[];
  logoutAction: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();

  // 登录页不显示侧边栏和导航
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-slate-200 bg-white p-4 md:block">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white"
            style={{ backgroundColor: settings.themeColor }}
          >
            {settings.logoText}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{settings.title}</span>
            <span className="block truncate text-xs text-slate-500">管理后台</span>
          </span>
        </Link>

        <nav className="mt-6 grid gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[var(--admin-theme-color)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logoutAction} className="absolute bottom-4 left-4 right-4">
          <button className="admin-button-secondary w-full" type="submit">
            退出登录
          </button>
        </form>
      </aside>

      <div className="min-w-0 overflow-hidden md:pl-56">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex min-w-0 items-center gap-2 font-semibold">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: settings.themeColor }}
              >
                {settings.logoText}
              </span>
              <span className="truncate">{settings.title}</span>
            </Link>
            <form action={logoutAction}>
              <button className="text-sm font-semibold text-slate-500" type="submit">
                退出
              </button>
            </form>
          </div>
          <nav className="scrollbar-none scroll-fade-right mt-2 flex gap-1.5 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="mx-auto min-w-0 max-w-7xl px-4 py-5 md:px-6 md:py-6">{children}</div>
      </div>
    </>
  );
}

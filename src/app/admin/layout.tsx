import type { CSSProperties, ReactNode } from "react";
import { getSettings } from "@/lib/data";
import { logoutAdmin } from "./actions";
import { AdminShell } from "@/components/admin-shell";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/links", label: "链接管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/settings", label: "站点设置" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const adminStyle = {
    "--admin-theme-color": settings.themeColor,
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900" style={adminStyle}>
      <AdminShell
        settings={settings}
        navItems={navItems}
        logoutAction={logoutAdmin}
      >
        {children}
      </AdminShell>
    </main>
  );
}

import Link from "next/link";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { categoryCount, linkCount, activeLinkCount, latestLinks } = await getDashboardData();

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl bg-slate-950 p-5 md:p-6 text-white md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold">导航站管理后台</h1>
        </div>
        <Link href="/" className="admin-button bg-white text-slate-950 hover:bg-blue-50">
          查看前台
        </Link>
      </div>

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="admin-card">
          <p className="text-sm text-slate-500">分类数量</p>
          <strong className="mt-1 block text-2xl">{categoryCount}</strong>
        </div>
        <div className="admin-card">
          <p className="text-sm text-slate-500">链接总数</p>
          <strong className="mt-1 block text-2xl">{linkCount}</strong>
        </div>
        <div className="admin-card">
          <p className="text-sm text-slate-500">启用链接</p>
          <strong className="mt-1 block text-2xl">{activeLinkCount}</strong>
        </div>
      </section>

      <section className="admin-card min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <h2 className="text-lg font-bold">最近添加</h2>
          <Link href="/admin/links" className="admin-button-secondary">
            管理链接
          </Link>
        </div>

        <div className="mt-4 grid min-w-0 gap-2">
          {latestLinks.map((link) => (
            <div
              key={link.id}
              className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center"
            >
              <div className="min-w-0">
                <p className="font-semibold">{link.title}</p>
                <p className="truncate text-sm text-slate-500">
                  {link.category.name} · {link.url}
                </p>
              </div>
              <span className="text-sm text-slate-400">{link.isActive ? "已启用" : "已隐藏"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

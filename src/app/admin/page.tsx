import Link from "next/link";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { categoryCount, linkCount, activeLinkCount, latestLinks } = await getDashboardData();

  return (
    <div className="grid gap-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl bg-slate-950 p-5 md:p-6 text-white md:flex-row md:items-end">
        <div>
          <p className="text-sm text-blue-200">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold">导航站管理后台</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-300">
            在这里维护分类、链接和站点信息。前台页面会实时读取这些数据。
          </p>
        </div>
        <Link href="/" className="admin-button bg-white text-slate-950 hover:bg-blue-50">
          查看前台
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
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

      <section className="admin-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">最近添加</h2>
            <p className="mt-1 text-sm text-slate-500">快速查看最新维护的网站。</p>
          </div>
          <Link href="/admin/links" className="admin-button-secondary">
            管理链接
          </Link>
        </div>

        <div className="mt-4 grid gap-2">
          {latestLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center"
            >
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="text-sm text-slate-500">
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

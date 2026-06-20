import Link from "next/link";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { categoryCount, linkCount, activeLinkCount, latestLinks } = await getDashboardData();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-8 text-white md:flex-row md:items-end">
        <div>
          <p className="text-sm text-blue-200">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">导航站管理后台</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            在这里维护分类、链接和站点信息。前台页面会实时读取这些数据。
          </p>
        </div>
        <Link href="/" className="admin-button bg-white text-slate-950 hover:bg-blue-50">
          查看前台
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="admin-card">
          <p className="text-sm text-slate-500">分类数量</p>
          <strong className="mt-2 block text-3xl">{categoryCount}</strong>
        </div>
        <div className="admin-card">
          <p className="text-sm text-slate-500">链接总数</p>
          <strong className="mt-2 block text-3xl">{linkCount}</strong>
        </div>
        <div className="admin-card">
          <p className="text-sm text-slate-500">启用链接</p>
          <strong className="mt-2 block text-3xl">{activeLinkCount}</strong>
        </div>
      </section>

      <section className="admin-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">最近添加</h2>
            <p className="mt-1 text-sm text-slate-500">快速查看最新维护的网站。</p>
          </div>
          <Link href="/admin/links" className="admin-button-secondary">
            管理链接
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {latestLinks.map((link) => (
            <div
              key={link.id}
              className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center"
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

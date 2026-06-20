import Link from "next/link";
import { NavigationHome } from "@/components/navigation-home";
import { getCategoriesWithLinks, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategoriesWithLinks({ onlyActive: true }),
  ]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-5 py-8 text-slate-900">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl text-lg font-bold text-white shadow-lg"
            style={{ backgroundColor: settings?.themeColor ?? "#2563eb" }}
          >
            {settings?.logoText ?? "N"}
          </div>
          <div>
            <p className="text-sm text-slate-500">Personal Navigation</p>
            <h1 className="text-lg font-semibold">{settings?.title ?? "我的导航"}</h1>
          </div>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
        >
          管理后台
        </Link>
      </nav>

      <section className="mx-auto mt-16 max-w-4xl text-center">
        <div className="mb-5 inline-flex rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-sm">
          分类整理 · 快速搜索 · 后台管理
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          {settings?.title ?? "我的导航"}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
          {settings?.subtitle ?? "整理常用网站、工具与资料"}
        </p>
      </section>

      <NavigationHome categories={categories} />
    </main>
  );
}

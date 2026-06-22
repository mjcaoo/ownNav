import type { Metadata } from "next";
import { updateSettings } from "@/app/admin/actions";
import { DataRestoreForm } from "@/components/data-restore-form";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "站点设置",
};

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  const settings = await getSettings();

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">站点设置</h1>

      <section className="admin-card">
        <form action={updateSettings} className="grid gap-3 md:grid-cols-2">
          <label className="admin-label">
            网站标题
            <input
              name="title"
              required
              defaultValue={settings?.title ?? "我的导航"}
              className="admin-input"
            />
          </label>
          <label className="admin-label">
            Logo 文本
            <input
              name="logoText"
              required
              maxLength={4}
              defaultValue={settings?.logoText ?? "N"}
              className="admin-input"
            />
          </label>
          <label className="admin-label">
            主题颜色
            <input
              name="themeColor"
              type="color"
              defaultValue={settings?.themeColor ?? "#2563eb"}
              className="admin-input h-10"
            />
          </label>
          <label className="admin-label md:col-span-2">
            网站副标题
            <textarea
              name="subtitle"
              defaultValue={settings?.subtitle ?? "整理常用网站、工具与资料"}
              className="admin-input min-h-20"
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="admin-button">
              保存设置
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">数据管理</h2>
            <p className="mt-1 text-sm text-slate-500">
              导出全部导航数据为 JSON 文件，可用于备份或迁移
            </p>
          </div>
          <a
            href="/api/export"
            className="admin-button-secondary inline-flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出 JSON
          </a>
        </div>

        <hr className="my-4 border-slate-100" />

        <div>
          <h3 className="text-sm font-bold text-slate-700">从备份恢复</h3>
          <p className="mb-3 text-xs text-slate-500">
            上传之前导出的 JSON 备份文件，清空当前数据并替换为备份内容
          </p>
          <DataRestoreForm />
        </div>
      </section>
    </div>
  );
}

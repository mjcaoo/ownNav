import { updateSettings } from "@/app/admin/actions";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  const settings = await getSettings();

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-bold">站点设置</h1>
        <p className="mt-2 text-sm text-slate-500">修改前台标题、副标题、Logo 文本和主题颜色。</p>
      </header>

      <section className="admin-card">
        <form action={updateSettings} className="grid gap-4 md:grid-cols-2">
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
              className="admin-input h-12"
            />
          </label>
          <label className="admin-label md:col-span-2">
            网站副标题
            <textarea
              name="subtitle"
              defaultValue={settings?.subtitle ?? "整理常用网站、工具与资料"}
              className="admin-input min-h-24"
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="admin-button">
              保存设置
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-800">
        后台登录密码目前通过项目根目录的 <code>.env</code> 文件中的
        <code> ADMIN_PASSWORD </code> 配置。修改后重启开发服务即可生效。
      </section>
    </div>
  );
}

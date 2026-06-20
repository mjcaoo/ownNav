import {
  createLink,
  deleteLink,
  updateLink,
} from "@/app/admin/actions";
import { getLinksWithCategory, readNavigationData, bySortAndCreatedAt } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LinksAdminPage() {
  const [data, links] = await Promise.all([readNavigationData(), getLinksWithCategory()]);
  const categories = [...data.categories].sort(bySortAndCreatedAt);

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-bold">链接管理</h1>
        <p className="mt-2 text-sm text-slate-500">添加、编辑、隐藏或删除导航链接。</p>
      </header>

      <section className="admin-card">
        <h2 className="text-xl font-bold">新增链接</h2>
        {categories.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
            请先创建至少一个分类，再添加链接。
          </p>
        ) : (
          <form action={createLink} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="admin-label">
              网站名称
              <input name="title" required className="admin-input" placeholder="例如 GitHub" />
            </label>
            <label className="admin-label">
              网站 URL
              <input name="url" required type="url" className="admin-input" placeholder="https://..." />
            </label>
            <label className="admin-label">
              所属分类
              <select name="categoryId" required className="admin-input">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label">
              图标 URL
              <input name="icon" className="admin-input" placeholder="可填 favicon 地址" />
            </label>
            <label className="admin-label md:col-span-2">
              描述
              <textarea name="description" className="admin-input min-h-24" placeholder="简单介绍这个网站" />
            </label>
            <label className="admin-label">
              排序
              <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
            </label>
            <div className="flex items-end gap-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input name="isPinned" type="checkbox" className="h-4 w-4" />
                置顶
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
                启用
              </label>
              <button type="submit" className="admin-button ml-auto">
                添加链接
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="grid gap-4">
        {links.map((link) => (
          <div key={link.id} className="admin-card">
            <form action={updateLink} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={link.id} />
              <label className="admin-label">
                网站名称
                <input name="title" required defaultValue={link.title} className="admin-input" />
              </label>
              <label className="admin-label">
                URL
                <input name="url" required type="url" defaultValue={link.url} className="admin-input" />
              </label>
              <label className="admin-label">
                分类
                <select name="categoryId" required defaultValue={link.categoryId} className="admin-input">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-label">
                图标 URL
                <input name="icon" defaultValue={link.icon ?? ""} className="admin-input" />
              </label>
              <label className="admin-label md:col-span-2">
                描述
                <textarea
                  name="description"
                  defaultValue={link.description ?? ""}
                  className="admin-input min-h-20"
                />
              </label>
              <label className="admin-label">
                排序
                <input name="sortOrder" type="number" defaultValue={link.sortOrder} className="admin-input" />
              </label>
              <div className="flex flex-wrap items-end gap-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input name="isPinned" type="checkbox" defaultChecked={link.isPinned} className="h-4 w-4" />
                  置顶
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input name="isActive" type="checkbox" defaultChecked={link.isActive} className="h-4 w-4" />
                  启用
                </label>
                <button type="submit" className="admin-button ml-auto">
                  保存
                </button>
              </div>
            </form>
            <form action={deleteLink} className="mt-4 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={link.id} />
              <button type="submit" className="text-sm font-semibold text-red-600">
                删除这个链接
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/actions";
import { bySortAndCreatedAt, readNavigationData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CategoriesAdminPage() {
  const data = await readNavigationData();
  const categories = [...data.categories]
    .sort(bySortAndCreatedAt)
    .map((category) => ({
      ...category,
      linkCount: data.links.filter((link) => link.categoryId === category.id).length,
    }));

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-bold">分类管理</h1>
        <p className="mt-2 text-sm text-slate-500">维护首页中的导航分类、图标、颜色和排序。</p>
      </header>

      <section className="admin-card">
        <h2 className="text-xl font-bold">新增分类</h2>
        <form action={createCategory} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="admin-label">
            分类名称
            <input name="name" required className="admin-input" placeholder="例如 AI 工具" />
          </label>
          <label className="admin-label">
            英文标识
            <input name="slug" className="admin-input" placeholder="例如 ai-tools，可留空自动生成" />
          </label>
          <label className="admin-label">
            图标
            <input name="icon" defaultValue="📁" className="admin-input" />
          </label>
          <label className="admin-label">
            颜色
            <input name="color" type="color" defaultValue="#2563eb" className="admin-input h-12" />
          </label>
          <label className="admin-label">
            排序
            <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
          </label>
          <label className="admin-label md:col-span-2">
            描述
            <textarea name="description" className="admin-input min-h-20" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="admin-button">
              添加分类
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        {categories.map((category) => (
          <div key={category.id} className="admin-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl text-xl text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </span>
                <div>
                  <h2 className="font-bold">{category.name}</h2>
                  <p className="text-sm text-slate-500">{category.linkCount} 个链接</p>
                </div>
              </div>
            </div>

            <form action={updateCategory} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={category.id} />
              <label className="admin-label">
                分类名称
                <input name="name" required defaultValue={category.name} className="admin-input" />
              </label>
              <label className="admin-label">
                英文标识
                <input name="slug" required defaultValue={category.slug} className="admin-input" />
              </label>
              <label className="admin-label">
                图标
                <input name="icon" defaultValue={category.icon} className="admin-input" />
              </label>
              <label className="admin-label">
                颜色
                <input name="color" type="color" defaultValue={category.color} className="admin-input h-12" />
              </label>
              <label className="admin-label">
                排序
                <input name="sortOrder" type="number" defaultValue={category.sortOrder} className="admin-input" />
              </label>
              <label className="admin-label md:col-span-2">
                描述
                <textarea
                  name="description"
                  defaultValue={category.description ?? ""}
                  className="admin-input min-h-20"
                />
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="admin-button">
                  保存分类
                </button>
              </div>
            </form>

            <form action={deleteCategory} className="mt-4 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={category.id} />
              <button type="submit" className="text-sm font-semibold text-red-600">
                删除分类及其链接
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}

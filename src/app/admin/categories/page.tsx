import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/actions";
import { CategoryIconPicker } from "@/components/category-icon-picker";
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
    <div className="grid gap-4">
      <header>
        <h1 className="text-2xl font-bold">分类管理</h1>
        <p className="mt-1 text-sm text-slate-500">维护首页中的导航分类、图标、颜色和排序。</p>
      </header>

      <section className="admin-card">
        <h2 className="text-lg font-bold">新增分类</h2>
        <form action={createCategory} className="mt-4 grid gap-3 md:grid-cols-2">
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
            <CategoryIconPicker defaultValue="📁" />
          </label>
          <label className="admin-label">
            颜色
            <input name="color" type="color" defaultValue="#2563eb" className="admin-input h-10" />
          </label>
          <label className="admin-label">
            排序
            <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
          </label>
          <label className="admin-label md:col-span-2">
            描述
            <textarea name="description" className="admin-input min-h-16" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="admin-button">
              添加分类
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">已有分类</h2>
            <p className="mt-1 text-xs text-slate-500">列表式行内编辑，适合分类较多时快速扫视。</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {categories.length} 个分类
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
            >
              <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
                <form
                  action={updateCategory}
                  className="grid flex-1 gap-2 md:grid-cols-[minmax(140px,1.1fr)_minmax(120px,1fr)_64px_84px_72px_minmax(180px,1.4fr)_auto]"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <label className="sr-only" htmlFor={`category-name-${category.id}`}>
                    分类名称
                  </label>
                  <input
                    id={`category-name-${category.id}`}
                    name="name"
                    required
                    defaultValue={category.name}
                    className="admin-input h-9"
                    aria-label="分类名称"
                  />
                  <label className="sr-only" htmlFor={`category-slug-${category.id}`}>
                    英文标识
                  </label>
                  <input
                    id={`category-slug-${category.id}`}
                    name="slug"
                    required
                    defaultValue={category.slug}
                    className="admin-input h-9"
                    aria-label="英文标识"
                  />
                  <label className="sr-only" htmlFor={`category-icon-${category.id}`}>
                    图标
                  </label>
                  <CategoryIconPicker defaultValue={category.icon} compact />
                  <label className="sr-only" htmlFor={`category-color-${category.id}`}>
                    颜色
                  </label>
                  <input
                    id={`category-color-${category.id}`}
                    name="color"
                    type="color"
                    defaultValue={category.color}
                    className="admin-input h-9"
                    aria-label="颜色"
                  />
                  <label className="sr-only" htmlFor={`category-sort-${category.id}`}>
                    排序
                  </label>
                  <input
                    id={`category-sort-${category.id}`}
                    name="sortOrder"
                    type="number"
                    defaultValue={category.sortOrder}
                    className="admin-input h-9"
                    aria-label="排序"
                  />
                  <label className="sr-only" htmlFor={`category-description-${category.id}`}>
                    描述
                  </label>
                  <textarea
                    id={`category-description-${category.id}`}
                    name="description"
                    defaultValue={category.description ?? ""}
                    className="admin-input min-h-9 resize-y py-2"
                    aria-label="描述"
                    placeholder="描述"
                  />
                  <button type="submit" className="admin-button h-9 self-start whitespace-nowrap">
                    保存
                  </button>
                </form>

                <form action={deleteCategory} className="flex items-center gap-2 xl:self-start">
                  <input type="hidden" name="id" value={category.id} />
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {category.linkCount} 链接
                  </span>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    删除
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

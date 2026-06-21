import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/actions";
import { AdminModal } from "@/components/admin-modal";
import { AdminPagination, normalizePageParam, pageCount, pageSlice } from "@/components/admin-pagination";
import { CategoryIconPicker } from "@/components/category-icon-picker";
import { bySortAndCreatedAt, readNavigationData, type Category } from "@/lib/data";

export const dynamic = "force-dynamic";

const CATEGORY_PAGE_SIZE = 12;

export default async function CategoriesAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const data = await readNavigationData();
  const categories = [...data.categories]
    .sort(bySortAndCreatedAt)
    .map((category) => ({
      ...category,
      linkCount: data.links.filter((link) => link.categoryId === category.id).length,
      childCount: data.categories.filter((item) => item.parentId === category.id).length,
    }));
  const parentCategories = categories.filter((category) => !category.parentId);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const params = await searchParams;
  const totalCategoryPages = pageCount(categories.length, CATEGORY_PAGE_SIZE);
  const currentPage = normalizePageParam(params?.page, totalCategoryPages);
  const paginatedCategories = pageSlice(categories, currentPage, CATEGORY_PAGE_SIZE);

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">分类管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            支持一级分类和二级分类；前台会以一级分类为分区，二级分类作为子标签。
          </p>
        </div>
        <AdminModal
          triggerLabel="新增分类"
          title="新增分类"
          description="创建一级分类或挂在某个一级分类下作为二级分类。"
        >
          <form action={createCategory} className="grid gap-3 md:grid-cols-2">
            <label className="admin-label">
              分类名称
              <input name="name" required className="admin-input" placeholder="例如 AI 工具" />
            </label>
            <label className="admin-label">
              英文标识
              <input name="slug" className="admin-input" placeholder="例如 ai-tools，可留空自动生成" />
            </label>
            <label className="admin-label">
              上级分类
              <select name="parentId" className="admin-input">
                <option value="">作为一级分类</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
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
              <textarea name="description" className="admin-input min-h-20" />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="admin-button">
                添加分类
              </button>
            </div>
          </form>
        </AdminModal>
      </header>

      <section className="admin-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">已有分类</h2>
            <p className="mt-1 text-xs text-slate-500">
              列表式行内编辑；删除一级分类会同时删除其二级分类和相关链接。
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {categories.length} 个分类 · 第 {currentPage}/{totalCategoryPages} 页
          </span>
        </div>

        <div className="mx-auto mt-3 w-full overflow-x-auto rounded-2xl border border-slate-100">
          <div className="grid w-full min-w-[1270px] grid-cols-[minmax(150px,1.2fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(150px,1.15fr)_56px_76px_64px_minmax(170px,1.35fr)_112px_64px_56px] gap-2 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-500">
            <span>层级</span>
            <span>名称</span>
            <span>标识</span>
            <span>上级分类</span>
            <span>图标</span>
            <span>颜色</span>
            <span>排序</span>
            <span>描述</span>
            <span>统计</span>
            <span>保存</span>
            <span>删除</span>
          </div>

          {paginatedCategories.length > 0 ? (
            paginatedCategories.map((category) => (
              <div
                key={category.id}
                className="grid w-full min-w-[1270px] grid-cols-[minmax(150px,1.2fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(150px,1.15fr)_56px_76px_64px_minmax(170px,1.35fr)_112px_64px_56px] gap-2 border-t border-slate-100 bg-white px-2 py-2 text-sm transition hover:bg-slate-50/80"
              >
                <form action={updateCategory} className="contents">
                  <input type="hidden" name="id" value={category.id} />
                  <div className="flex h-9 items-center gap-1 truncate text-xs font-semibold text-slate-500">
                    <span className="truncate rounded-full bg-slate-100 px-2 py-1">
                      {categoryPath(category, categoryMap)}
                    </span>
                  </div>
                  <input
                    name="name"
                    required
                    defaultValue={category.name}
                    className="admin-input h-9"
                    aria-label="分类名称"
                  />
                  <input
                    name="slug"
                    required
                    defaultValue={category.slug}
                    className="admin-input h-9"
                    aria-label="英文标识"
                  />
                  <select
                    name="parentId"
                    defaultValue={category.parentId ?? ""}
                    className="admin-input h-9"
                    aria-label="上级分类"
                  >
                    <option value="">一级分类</option>
                    {parentCategories
                      .filter((parent) => parent.id !== category.id)
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.icon} {parent.name}
                        </option>
                      ))}
                  </select>
                  <input
                    name="icon"
                    defaultValue={category.icon}
                    className="admin-input h-9 text-center"
                    aria-label="图标"
                  />
                  <input
                    name="color"
                    type="color"
                    defaultValue={category.color}
                    className="admin-input h-9"
                    aria-label="颜色"
                  />
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={category.sortOrder}
                    className="admin-input h-9"
                    aria-label="排序"
                  />
                  <input
                    name="description"
                    defaultValue={category.description ?? ""}
                    className="admin-input h-9"
                    aria-label="描述"
                    placeholder="描述"
                  />
                  <div className="flex h-9 items-center gap-1 text-xs font-semibold text-slate-500">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                      {category.childCount} 子类
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      {category.linkCount} 链接
                    </span>
                  </div>
                  <button type="submit" className="admin-button h-9 px-3">
                    保存
                  </button>
                </form>

                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
                  >
                    删除
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="border-t border-slate-100 bg-white p-4 text-sm text-slate-500">暂无分类。</p>
          )}
        </div>

        <AdminPagination
          basePath="/admin/categories"
          currentPage={currentPage}
          totalItems={categories.length}
          pageSize={CATEGORY_PAGE_SIZE}
          itemName="分类"
        />
      </section>
    </div>
  );
}

function categoryPath(category: Category, categoryMap: Map<string, Category>) {
  if (!category.parentId) return "一级 / " + category.name;

  const parent = categoryMap.get(category.parentId);
  return (parent ? parent.name : "未知一级") + " / " + category.name;
}

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
    <div className="grid gap-4">
      <header>
        <h1 className="text-2xl font-bold">链接管理</h1>
        <p className="mt-1 text-sm text-slate-500">添加、编辑、隐藏或删除导航链接。</p>
      </header>

      <section className="admin-card">
        <h2 className="text-lg font-bold">新增链接</h2>
        {categories.length === 0 ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            请先创建至少一个分类，再添加链接。
          </p>
        ) : (
          <form action={createLink} className="mt-4 grid gap-3 md:grid-cols-2">
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
              <textarea name="description" className="admin-input min-h-16" placeholder="简单介绍这个网站" />
            </label>
            <label className="admin-label">
              排序
              <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
            </label>
            <div className="flex items-end gap-3">
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

      <section className="admin-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">已有链接</h2>
            <p className="mt-1 text-xs text-slate-500">紧凑行内编辑，减少多链接场景下的纵向滚动。</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {links.length} 个链接
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5"
            >
              <div className="flex flex-col gap-2 2xl:flex-row 2xl:items-start">
                <form
                  action={updateLink}
                  className="grid flex-1 gap-2 lg:grid-cols-[minmax(150px,1fr)_minmax(220px,1.45fr)_150px_150px_72px_auto]"
                >
                  <input type="hidden" name="id" value={link.id} />
                  <label className="sr-only" htmlFor={`link-title-${link.id}`}>
                    网站名称
                  </label>
                  <input
                    id={`link-title-${link.id}`}
                    name="title"
                    required
                    defaultValue={link.title}
                    className="admin-input h-9"
                    aria-label="网站名称"
                  />
                  <label className="sr-only" htmlFor={`link-url-${link.id}`}>
                    URL
                  </label>
                  <input
                    id={`link-url-${link.id}`}
                    name="url"
                    required
                    type="url"
                    defaultValue={link.url}
                    className="admin-input h-9"
                    aria-label="URL"
                  />
                  <label className="sr-only" htmlFor={`link-category-${link.id}`}>
                    分类
                  </label>
                  <select
                    id={`link-category-${link.id}`}
                    name="categoryId"
                    required
                    defaultValue={link.categoryId}
                    className="admin-input h-9"
                    aria-label="分类"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor={`link-icon-${link.id}`}>
                    图标 URL
                  </label>
                  <input
                    id={`link-icon-${link.id}`}
                    name="icon"
                    defaultValue={link.icon ?? ""}
                    className="admin-input h-9"
                    aria-label="图标 URL"
                    placeholder="图标 URL"
                  />
                  <label className="sr-only" htmlFor={`link-sort-${link.id}`}>
                    排序
                  </label>
                  <input
                    id={`link-sort-${link.id}`}
                    name="sortOrder"
                    type="number"
                    defaultValue={link.sortOrder}
                    className="admin-input h-9"
                    aria-label="排序"
                  />
                  <button type="submit" className="admin-button h-9 self-start whitespace-nowrap">
                    保存
                  </button>

                  <label className="sr-only" htmlFor={`link-description-${link.id}`}>
                    描述
                  </label>
                  <textarea
                    id={`link-description-${link.id}`}
                    name="description"
                    defaultValue={link.description ?? ""}
                    className="admin-input min-h-9 resize-y py-2 lg:col-span-3"
                    aria-label="描述"
                    placeholder="描述"
                  />

                  <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input name="isPinned" type="checkbox" defaultChecked={link.isPinned} className="h-4 w-4" />
                      置顶
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input name="isActive" type="checkbox" defaultChecked={link.isActive} className="h-4 w-4" />
                      启用
                    </label>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {link.category.icon} {link.category.name}
                    </span>
                  </div>
                </form>

                <form action={deleteLink} className="2xl:self-start">
                  <input type="hidden" name="id" value={link.id} />
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

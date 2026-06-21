import {
  createLink,
  deleteLink,
  importBookmarks,
  updateLink,
} from "@/app/admin/actions";
import { AdminModal } from "@/components/admin-modal";
import { AdminPagination, normalizePageParam, pageCount, pageSlice } from "@/components/admin-pagination";
import { getLinksWithCategory, readNavigationData, bySortAndCreatedAt, type Category } from "@/lib/data";

export const dynamic = "force-dynamic";

const LINK_PAGE_SIZE = 12;

export default async function LinksAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string | string[];
    imported?: string | string[];
    skipped?: string | string[];
    importError?: string | string[];
  }>;
}) {
  const [data, links] = await Promise.all([readNavigationData(), getLinksWithCategory()]);
  const categories = [...data.categories].sort(bySortAndCreatedAt);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const params = await searchParams;
  const importedCount = Number(params?.imported ?? 0);
  const skippedCount = Number(params?.skipped ?? 0);
  const totalLinkPages = pageCount(links.length, LINK_PAGE_SIZE);
  const currentPage = normalizePageParam(params?.page, totalLinkPages);
  const paginatedLinks = pageSlice(links, currentPage, LINK_PAGE_SIZE);

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">链接管理</h1>
        <div className="flex flex-wrap items-center gap-2">
          <AdminModal triggerLabel="导入书签" title="导入浏览器书签">
            <form action={importBookmarks} className="grid gap-3">
              <label className="admin-label">
                书签 HTML 文件
                <input name="bookmarksFile" type="file" required accept=".html,.htm,text/html" className="admin-input" />
              </label>
              <div className="flex justify-end">
                <button type="submit" className="admin-button whitespace-nowrap">导入书签文件</button>
              </div>
            </form>
          </AdminModal>

          {categories.length > 0 ? (
            <AdminModal triggerLabel="新增链接" title="新增链接">
              <form action={createLink} className="grid gap-3 md:grid-cols-2">
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
                      <option key={category.id} value={category.id}>{categoryLabel(category, categoryMap)}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-label">
                  图标 URL
                  <input name="icon" className="admin-input" placeholder="可填 favicon 地址" />
                </label>
                <label className="admin-label md:col-span-2">
                  描述
                  <textarea name="description" className="admin-input min-h-20" placeholder="简单介绍这个网站" />
                </label>
                <label className="admin-label">
                  排序
                  <input name="sortOrder" type="number" defaultValue="0" className="admin-input" />
                </label>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input name="isPinned" type="checkbox" className="h-4 w-4" /> 置顶
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" /> 启用
                  </label>
                  <button type="submit" className="admin-button ml-auto">添加链接</button>
                </div>
              </form>
            </AdminModal>
          ) : null}
        </div>
      </header>

      {params?.importError || params?.imported ? (
        <div className="flex flex-wrap items-center gap-2">
          {params?.importError ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">未识别到可导入链接</span>
          ) : null}
          {params?.imported ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              已导入 {importedCount} 个，跳过 {skippedCount} 个重复链接
            </span>
          ) : null}
        </div>
      ) : null}

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
          请先创建至少一个分类，再添加链接；也可以直接导入浏览器书签自动生成分类。
        </p>
      ) : null}

      <section className="admin-card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">已有链接</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {links.length} 个链接 · 第 {currentPage}/{totalLinkPages} 页
          </span>
        </div>

        {/* Mobile: card layout */}
        <div className="mt-3 grid gap-2 xl:hidden">
          {paginatedLinks.length > 0 ? paginatedLinks.map((link) => (
            <div key={link.id} className="rounded-xl border border-slate-100 bg-white p-3">
              <form action={updateLink} className="grid gap-2">
                <input type="hidden" name="id" value={link.id} />
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <input name="title" required defaultValue={link.title} className="admin-input h-9 font-bold" aria-label="网站名称" />
                  </div>
                  <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 shrink-0">
                    <label className="flex items-center gap-1">
                      <input name="isPinned" type="checkbox" defaultChecked={link.isPinned} className="h-3.5 w-3.5" /> 置顶
                    </label>
                    <label className="flex items-center gap-1">
                      <input name="isActive" type="checkbox" defaultChecked={link.isActive} className="h-3.5 w-3.5" /> 启用
                    </label>
                  </div>
                </div>

                <input name="url" required type="url" defaultValue={link.url} className="admin-input h-9" aria-label="URL" placeholder="https://..." />

                <div className="grid grid-cols-2 gap-2">
                  <label className="admin-label">
                    分类
                    <select name="categoryId" required defaultValue={link.categoryId} className="admin-input h-9">
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{categoryLabel(category, categoryMap)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-label">
                    排序
                    <input name="sortOrder" type="number" defaultValue={link.sortOrder} className="admin-input h-9" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input name="description" defaultValue={link.description ?? ""} className="admin-input h-9" placeholder="描述" aria-label="描述" />
                  <input name="icon" defaultValue={link.icon ?? ""} className="admin-input h-9" placeholder="图标 URL" aria-label="图标" />
                </div>

                <div className="flex items-center gap-2">
                  <button type="submit" className="admin-button h-9 flex-1">保存</button>
                  <form action={deleteLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <button type="submit" className="inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-red-600 transition hover:bg-red-50">删除</button>
                  </form>
                </div>
              </form>
            </div>
          )) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">暂无链接。</p>
          )}

          {Array.from({ length: LINK_PAGE_SIZE - paginatedLinks.length }, (_, i) => (
            <div key={"ph-" + i} className="h-0" />
          ))}
        </div>

        {/* Desktop: table layout */}
        <div className="mx-auto mt-3 hidden w-full overflow-x-auto rounded-2xl border border-slate-100 xl:block">
          <div className="grid w-full min-w-[1220px] grid-cols-[minmax(150px,1.05fr)_minmax(240px,1.8fr)_minmax(160px,1.05fr)_minmax(180px,1.35fr)_minmax(120px,0.9fr)_64px_112px_64px_56px] gap-2 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-500">
            <span>名称</span>
            <span>URL</span>
            <span>分类</span>
            <span>描述</span>
            <span>图标</span>
            <span>排序</span>
            <span>状态</span>
            <span>保存</span>
            <span>删除</span>
          </div>

          {paginatedLinks.length > 0 ? (
            paginatedLinks.map((link) => (
              <div
                key={link.id}
                className="grid w-full min-w-[1220px] grid-cols-[minmax(150px,1.05fr)_minmax(240px,1.8fr)_minmax(160px,1.05fr)_minmax(180px,1.35fr)_minmax(120px,0.9fr)_64px_112px_64px_56px] gap-2 border-t border-slate-100 bg-white px-2 py-2 text-sm transition hover:bg-slate-50/80"
              >
                <form action={updateLink} className="contents">
                  <input type="hidden" name="id" value={link.id} />
                  <input name="title" required defaultValue={link.title} className="admin-input h-9" aria-label="网站名称" />
                  <input name="url" required type="url" defaultValue={link.url} className="admin-input h-9" aria-label="URL" />
                  <select name="categoryId" required defaultValue={link.categoryId} className="admin-input h-9" aria-label="分类">
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{categoryLabel(category, categoryMap)}</option>
                    ))}
                  </select>
                  <input name="description" defaultValue={link.description ?? ""} className="admin-input h-9" aria-label="描述" placeholder="描述" />
                  <input name="icon" defaultValue={link.icon ?? ""} className="admin-input h-9" aria-label="图标 URL" placeholder="图标 URL" />
                  <input name="sortOrder" type="number" defaultValue={link.sortOrder} className="admin-input h-9" aria-label="排序" />
                  <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600">
                    <label className="flex items-center gap-1">
                      <input name="isPinned" type="checkbox" defaultChecked={link.isPinned} className="h-3.5 w-3.5" /> 置顶
                    </label>
                    <label className="flex items-center gap-1">
                      <input name="isActive" type="checkbox" defaultChecked={link.isActive} className="h-3.5 w-3.5" /> 启用
                    </label>
                  </div>
                  <button type="submit" className="admin-button h-9 px-3">保存</button>
                </form>
                <form action={deleteLink}>
                  <input type="hidden" name="id" value={link.id} />
                  <button type="submit" className="inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-red-600 transition hover:bg-red-50">删除</button>
                </form>
              </div>
            ))
          ) : (
            <p className="border-t border-slate-100 bg-white p-4 text-sm text-slate-500">暂无链接。</p>
          )}

          {Array.from({ length: LINK_PAGE_SIZE - paginatedLinks.length }, (_, i) => (
            <div
              key={"placeholder-" + i}
              className="grid w-full min-w-[1220px] grid-cols-[minmax(150px,1.05fr)_minmax(240px,1.8fr)_minmax(160px,1.05fr)_minmax(180px,1.35fr)_minmax(120px,0.9fr)_64px_112px_64px_56px] gap-2 border-t border-transparent bg-white px-2 py-2"
            >
              {Array.from({ length: 9 }).map((_, j) => (
                <div key={j} className="h-9" />
              ))}
            </div>
          ))}
        </div>

        <AdminPagination
          basePath="/admin/links"
          currentPage={currentPage}
          totalItems={links.length}
          pageSize={LINK_PAGE_SIZE}
          itemName="链接"
        />
      </section>
    </div>
  );
}

function categoryLabel(category: Category, categoryMap: Map<string, Category>) {
  if (!category.parentId) return category.icon + " " + category.name;

  const parent = categoryMap.get(category.parentId);
  return (parent ? parent.name : "未知一级") + " / " + category.icon + " " + category.name;
}

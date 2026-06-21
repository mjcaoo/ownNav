import Link from "next/link";
import type { ReactNode } from "react";

export type PageParam = string | string[] | undefined;

type AdminPaginationProps = {
  basePath: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  itemName: string;
  pageParam?: string;
};

type VisiblePage = number | "ellipsis";

export function pageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function normalizePageParam(value: PageParam, totalPages: number) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue ?? 1);

  if (!Number.isFinite(parsed)) return 1;

  return Math.min(Math.max(Math.trunc(parsed), 1), totalPages);
}

export function pageSlice<T>(items: T[], currentPage: number, pageSize: number) {
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function AdminPagination({
  basePath,
  currentPage,
  totalItems,
  pageSize,
  itemName,
  pageParam = "page",
}: AdminPaginationProps) {
  const totalPages = pageCount(totalItems, pageSize);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        显示 {rangeStart}-{rangeEnd} / {totalItems} 个{itemName}
      </p>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center gap-1" aria-label={itemName + "分页"}>
          <PageLink
            href={hrefForPage(basePath, Math.max(1, currentPage - 1), pageParam)}
            disabled={currentPage === 1}
          >
            上一页
          </PageLink>

          {visiblePages(currentPage, totalPages).map((page, index) =>
            page === "ellipsis" ? (
              <span key={"ellipsis-" + index} className="px-2 text-slate-300">
                ...
              </span>
            ) : (
              <PageLink
                key={page}
                href={hrefForPage(basePath, page, pageParam)}
                active={page === currentPage}
              >
                {page}
              </PageLink>
            ),
          )}

          <PageLink
            href={hrefForPage(basePath, Math.min(totalPages, currentPage + 1), pageParam)}
            disabled={currentPage === totalPages}
          >
            下一页
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  active = false,
  disabled = false,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = [
    "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 font-bold transition",
    active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
    disabled ? "pointer-events-none opacity-45" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

function hrefForPage(basePath: string, page: number, pageParam: string) {
  if (page <= 1) return basePath;

  return basePath + "?" + pageParam + "=" + page;
}

function visiblePages(currentPage: number, totalPages: number): VisiblePage[] {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalized = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const result: VisiblePage[] = [];

  for (const page of normalized) {
    const previous = result.at(-1);

    if (typeof previous === "number" && page - previous > 1) {
      result.push("ellipsis");
    }

    result.push(page);
  }

  return result;
}


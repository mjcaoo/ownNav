"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SiteSetting = {
  id: string;
  title: string;
  subtitle: string;
  logoText: string;
  themeColor: string;
};

type LinkItem = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  isPinned: boolean;
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  links: LinkItem[];
};

export function NavigationHome({
  settings,
  categories,
}: {
  settings: SiteSetting;
  categories: CategoryItem[];
}) {
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return categories
      .map((category) => ({
        ...category,
        links: category.links.filter((link) => {
          if (!normalizedKeyword) return true;

          return [link.title, link.url, link.description ?? "", category.name]
            .join(" ")
            .toLowerCase()
            .includes(normalizedKeyword);
        }),
      }))
      .filter((category) => category.links.length > 0 || !normalizedKeyword);
  }, [categories, keyword]);

  function jumpToCategory(category: CategoryItem) {
    setActiveCategory(category.id);
    document
      .getElementById(category.slug || category.id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white shadow-sm"
            style={{ backgroundColor: settings.themeColor }}
          >
            {settings.logoText}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black tracking-tight text-slate-950">
              {settings.title}
            </h1>
            <p className="truncate text-[11px] font-medium text-slate-500">
              {settings.subtitle}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2.5">
          <label className="hidden h-9 min-w-[260px] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-400 shadow-sm focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 md:flex lg:min-w-[340px]">
            <SearchIcon />
            <input
              ref={searchRef}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索站点、工具与资源"
              className="min-w-0 flex-1 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            />
            <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              Ctrl K
            </kbd>
          </label>

          <Link
            href="/admin"
            className="inline-flex h-9 items-center justify-center rounded-full bg-blue-500 px-4 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-600 md:px-5"
          >
            登录
          </Link>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-[236px_1fr]">
        <aside className="hidden border-r border-slate-200/80 bg-white/80 px-4 py-4 lg:block">
          <nav className="sticky top-20 grid gap-1.5">
            {categories.map((category) => (
              <CategoryNavButton
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => jumpToCategory(category)}
                variant="sidebar"
              />
            ))}
          </nav>
        </aside>

        <div className="px-4 py-5 sm:px-5 md:px-6 lg:px-8 xl:px-12">
          <label className="mb-4 flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-400 shadow-sm md:hidden">
            <SearchIcon />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索站点、工具与资源"
              className="min-w-0 flex-1 border-0 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {categories.map((category) => (
              <CategoryNavButton
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => jumpToCategory(category)}
                variant="compact"
              />
            ))}
          </nav>

          <div className="mx-auto grid max-w-[1240px] gap-7 md:gap-8">
            {visibleCategories.map((category) => (
              <section
                key={category.id}
                id={category.slug || category.id}
                className="scroll-mt-24"
                onMouseEnter={() => setActiveCategory(category.id)}
              >
                <h2 className="mb-3 text-xl font-black tracking-tight text-slate-950 md:text-[22px]">
                  {category.name}
                </h2>

                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.055)]">
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                    <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                      全部
                    </span>
                    {category.description ? (
                      <span className="truncate text-xs font-medium text-slate-400">
                        {category.description}
                      </span>
                    ) : null}
                  </div>

                  {category.links.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-5 gap-y-3 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {category.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex min-w-0 items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"
                        >
                          <SiteIcon link={link} color={category.color} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-600">
                                {link.title}
                              </span>
                              {link.isPinned ? (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  置顶
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] font-medium leading-4 text-slate-400">
                              {link.description || compactUrl(link.url)}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-6 text-sm font-medium text-slate-400">
                      这个分类暂时没有可显示的网站。
                    </div>
                  )}
                </div>
              </section>
            ))}

            {visibleCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-9 text-center text-sm font-medium text-slate-400">
                没有找到匹配的网站。换个关键词试试？
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function CategoryNavButton({
  category,
  isActive,
  onClick,
  variant,
}: {
  category: CategoryItem;
  isActive: boolean;
  onClick: () => void;
  variant: "sidebar" | "compact";
}) {
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold transition",
          isActive
            ? "border-blue-100 bg-blue-50 text-slate-950"
            : "border-slate-200 bg-white text-slate-500",
        ].join(" ")}
      >
        <span>{category.icon}</span>
        <span>{category.name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px] font-bold transition",
        isActive
          ? "bg-blue-50 text-slate-950 shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm transition",
          isActive ? "bg-white text-blue-600" : "bg-slate-100",
        ].join(" ")}
      >
        {category.icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{category.name}</span>
      <span
        className={[
          "text-base transition",
          isActive ? "text-slate-400" : "text-transparent group-hover:text-slate-300",
        ].join(" ")}
      >
        ›
      </span>
    </button>
  );
}

function SiteIcon({ link, color }: { link: LinkItem; color: string }) {
  if (link.icon) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50 shadow-sm ring-1 ring-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={link.icon} alt="" className="h-5 w-5 rounded object-contain" />
      </span>
    );
  }

  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      {link.title.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
      />
    </svg>
  );
}

function compactUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}


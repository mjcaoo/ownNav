"use client";

import { useMemo, useState } from "react";

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
  icon: string;
  color: string;
  description: string | null;
  links: LinkItem[];
};

export function NavigationHome({
  categories,
}: {
  categories: CategoryItem[];
}) {
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return categories
      .filter((category) => activeCategory === "all" || category.id === activeCategory)
      .map((category) => ({
        ...category,
        links: category.links.filter((link) => {
          if (!normalizedKeyword) return true;
          return [link.title, link.url, link.description ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedKeyword);
        }),
      }))
      .filter((category) => category.links.length > 0);
  }, [activeCategory, categories, keyword]);

  return (
    <>
      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/70 bg-white/80 p-3 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索网站名称、描述或 URL"
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <select
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-5 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">全部分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-8">
        {filteredCategories.map((category) => (
          <div key={category.id} className="scroll-mt-8">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-xl text-white shadow-lg"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{category.name}</h2>
                {category.description ? (
                  <p className="text-sm text-slate-500">{category.description}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/70"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-lg">
                      {link.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={link.icon} alt="" className="h-7 w-7 rounded-md" />
                      ) : (
                        <span>{link.title.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-950 group-hover:text-blue-600">
                          {link.title}
                        </h3>
                        {link.isPinned ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                            置顶
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {link.description || link.url}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-slate-500">
            没有找到匹配的网站。换个关键词试试？
          </div>
        ) : null}
      </section>
    </>
  );
}

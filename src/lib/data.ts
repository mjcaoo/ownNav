import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SiteSetting = {
  id: string;
  title: string;
  subtitle: string;
  logoText: string;
  themeColor: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NavLink = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  isPinned: boolean;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type NavigationData = {
  settings: SiteSetting;
  categories: Category[];
  links: NavLink[];
};

export type CategoryWithLinks = Category & {
  links: NavLink[];
};

export type LinkWithCategory = NavLink & {
  category: Category;
};

const dataDir = path.join(process.cwd(), "data");
const dataPath = path.join(dataDir, "navigation.json");

const defaultData: NavigationData = {
  settings: {
    id: "site",
    title: "我的导航",
    subtitle: "整理常用网站、工具与资料",
    logoText: "N",
    themeColor: "#2563eb",
  },
  categories: [],
  links: [],
};

export function createId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export async function readNavigationData(): Promise<NavigationData> {
  try {
    const raw = await readFile(dataPath, "utf-8");
    return JSON.parse(raw) as NavigationData;
  } catch {
    await writeNavigationData(defaultData);
    return defaultData;
  }
}

export async function writeNavigationData(data: NavigationData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function getSettings() {
  const data = await readNavigationData();
  return data.settings;
}

export async function getCategoriesWithLinks({ onlyActive = false } = {}) {
  const data = await readNavigationData();

  return [...data.categories]
    .sort(bySortAndCreatedAt)
    .map((category) => ({
      ...category,
      links: data.links
        .filter((link) => link.categoryId === category.id)
        .filter((link) => (onlyActive ? link.isActive : true))
        .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || bySortAndCreatedAt(a, b)),
    }));
}

export async function getLinksWithCategory() {
  const data = await readNavigationData();
  const categoryMap = new Map(data.categories.map((category) => [category.id, category]));

  return data.links
    .map((link) => ({
      ...link,
      category: categoryMap.get(link.categoryId) ?? data.categories[0],
    }))
    .filter((link): link is LinkWithCategory => Boolean(link.category))
    .sort(bySortAndCreatedAt);
}

export async function getDashboardData() {
  const data = await readNavigationData();
  const linksWithCategory = await getLinksWithCategory();

  return {
    categoryCount: data.categories.length,
    linkCount: data.links.length,
    activeLinkCount: data.links.filter((link) => link.isActive).length,
    latestLinks: [...linksWithCategory]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6),
  };
}

export function bySortAndCreatedAt(
  a: { sortOrder: number; createdAt: string },
  b: { sortOrder: number; createdAt: string },
) {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
}

export function uniqueSlug(slug: string, categories: Category[], currentId?: string) {
  let candidate = slug || String(Date.now());
  let index = 2;

  while (
    categories.some(
      (category) => category.slug === candidate && category.id !== currentId,
    )
  ) {
    candidate = `${slug}-${index}`;
    index += 1;
  }

  return candidate;
}

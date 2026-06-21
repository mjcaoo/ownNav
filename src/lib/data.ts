import "server-only";

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
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
  parentId: string | null;
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
  children: Category[];
  links: NavLink[];
};

export type LinkWithCategory = NavLink & {
  category: Category;
};

type LinkRow = Omit<NavLink, "isPinned" | "isActive"> & {
  isPinned: 0 | 1;
  isActive: 0 | 1;
};

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "navigation.sqlite");
const jsonSeedPath = path.join(dataDir, "navigation.json");

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

let database: Database.Database | null = null;

export function createId(prefix: string) {
  return prefix + "-" + randomUUID().slice(0, 8);
}

export async function readNavigationData(): Promise<NavigationData> {
  const db = getDatabase();
  const settings =
    db
      .prepare("SELECT id, title, subtitle, logoText, themeColor FROM settings WHERE id = ?")
      .get("site") as SiteSetting | undefined;

  const categories = db
    .prepare(
      "SELECT id, name, slug, icon, color, description, parentId, sortOrder, createdAt, updatedAt FROM categories ORDER BY sortOrder ASC, createdAt ASC",
    )
    .all() as Category[];

  const links = (db
    .prepare(
      "SELECT id, title, url, description, icon, isPinned, isActive, sortOrder, categoryId, createdAt, updatedAt FROM links ORDER BY sortOrder ASC, createdAt ASC",
    )
    .all() as LinkRow[]).map(rowToLink);

  return {
    settings: settings ?? defaultData.settings,
    categories: categories.map((category) => ({
      ...category,
      parentId: category.parentId ?? null,
    })),
    links,
  };
}

export async function writeNavigationData(data: NavigationData) {
  writeNavigationDataToDb(getDatabase(), normalizeNavigationData(data));
}

export async function getSettings() {
  const data = await readNavigationData();
  return data.settings;
}

export async function getCategoriesWithLinks({ onlyActive = false } = {}) {
  const data = await readNavigationData();
  const childMap = new Map<string, Category[]>();
  const categoryIds = new Set(data.categories.map((category) => category.id));

  for (const category of data.categories) {
    if (!category.parentId || !categoryIds.has(category.parentId)) continue;

    childMap.set(category.parentId, [...(childMap.get(category.parentId) ?? []), category]);
  }

  return data.categories
    .filter((category) => !category.parentId || !categoryIds.has(category.parentId))
    .sort(bySortAndCreatedAt)
    .map((category) => {
      const children = [...(childMap.get(category.id) ?? [])].sort(bySortAndCreatedAt);
      const categoryIdSet = new Set([category.id, ...children.map((child) => child.id)]);

      return {
        ...category,
        children,
        links: data.links
          .filter((link) => categoryIdSet.has(link.categoryId))
          .filter((link) => (onlyActive ? link.isActive : true))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || bySortAndCreatedAt(a, b)),
      };
    });
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
    candidate = slug + "-" + index;
    index += 1;
  }

  return candidate;
}

function getDatabase() {
  if (database) {
    ensureDatabaseSchema(database);
    return database;
  }

  mkdirSync(dataDir, { recursive: true });
  database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  ensureDatabaseSchema(database);
  seedDatabaseIfEmpty(database);

  return database;
}

function ensureDatabaseSchema(db: Database.Database) {
  createTables(db);
  migrateSchema(db);
  createIndexes(db);
}

function createTables(db: Database.Database) {
  db.exec([
    "CREATE TABLE IF NOT EXISTS settings (",
    "  id TEXT PRIMARY KEY,",
    "  title TEXT NOT NULL,",
    "  subtitle TEXT NOT NULL,",
    "  logoText TEXT NOT NULL,",
    "  themeColor TEXT NOT NULL",
    ");",
    "CREATE TABLE IF NOT EXISTS categories (",
    "  id TEXT PRIMARY KEY,",
    "  name TEXT NOT NULL,",
    "  slug TEXT NOT NULL UNIQUE,",
    "  icon TEXT NOT NULL,",
    "  color TEXT NOT NULL,",
    "  description TEXT,",
    "  parentId TEXT,",
    "  sortOrder INTEGER NOT NULL,",
    "  createdAt TEXT NOT NULL,",
    "  updatedAt TEXT NOT NULL",
    ");",
    "CREATE TABLE IF NOT EXISTS links (",
    "  id TEXT PRIMARY KEY,",
    "  title TEXT NOT NULL,",
    "  url TEXT NOT NULL,",
    "  description TEXT,",
    "  icon TEXT,",
    "  isPinned INTEGER NOT NULL DEFAULT 0,",
    "  isActive INTEGER NOT NULL DEFAULT 1,",
    "  sortOrder INTEGER NOT NULL,",
    "  categoryId TEXT NOT NULL,",
    "  createdAt TEXT NOT NULL,",
    "  updatedAt TEXT NOT NULL,",
    "  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE",
    ");",
  ].join("\n"));
}

function migrateSchema(db: Database.Database) {
  const columns = db.prepare("PRAGMA table_info(categories)").all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "parentId")) {
    db.prepare("ALTER TABLE categories ADD COLUMN parentId TEXT").run();
  }
}

function createIndexes(db: Database.Database) {
  db.exec([
    "CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parentId);",
    "CREATE INDEX IF NOT EXISTS idx_links_category_id ON links(categoryId);",
    "CREATE INDEX IF NOT EXISTS idx_links_url ON links(url);",
  ].join("\n"));
}

function seedDatabaseIfEmpty(db: Database.Database) {
  const settingsCount = (db.prepare("SELECT COUNT(*) AS count FROM settings").get() as {
    count: number;
  }).count;
  const categoryCount = (db.prepare("SELECT COUNT(*) AS count FROM categories").get() as {
    count: number;
  }).count;
  const linkCount = (db.prepare("SELECT COUNT(*) AS count FROM links").get() as {
    count: number;
  }).count;

  if (settingsCount + categoryCount + linkCount > 0) return;

  writeNavigationDataToDb(db, normalizeNavigationData(readJsonSeed() ?? defaultData));
}

function readJsonSeed() {
  if (!existsSync(jsonSeedPath)) return null;

  try {
    return JSON.parse(readFileSync(jsonSeedPath, "utf-8")) as NavigationData;
  } catch {
    return null;
  }
}

function normalizeNavigationData(data: NavigationData): NavigationData {
  return {
    ...data,
    categories: data.categories.map((category) => ({
      ...category,
      parentId: category.parentId ?? null,
    })),
  };
}

function writeNavigationDataToDb(db: Database.Database, data: NavigationData) {
  const write = db.transaction((payload: NavigationData) => {
    db.prepare("DELETE FROM links").run();
    db.prepare("DELETE FROM categories").run();
    db.prepare("DELETE FROM settings").run();

    db.prepare(
      "INSERT INTO settings (id, title, subtitle, logoText, themeColor) VALUES (@id, @title, @subtitle, @logoText, @themeColor)",
    ).run(payload.settings);

    const insertCategory = db.prepare(
      [
        "INSERT INTO categories (",
        "  id, name, slug, icon, color, description, parentId, sortOrder, createdAt, updatedAt",
        ") VALUES (",
        "  @id, @name, @slug, @icon, @color, @description, @parentId, @sortOrder, @createdAt, @updatedAt",
        ")",
      ].join("\n"),
    );

    for (const category of payload.categories) {
      insertCategory.run(category);
    }

    const insertLink = db.prepare(
      [
        "INSERT INTO links (",
        "  id, title, url, description, icon, isPinned, isActive, sortOrder, categoryId, createdAt, updatedAt",
        ") VALUES (",
        "  @id, @title, @url, @description, @icon, @isPinned, @isActive, @sortOrder, @categoryId, @createdAt, @updatedAt",
        ")",
      ].join("\n"),
    );

    for (const link of payload.links) {
      insertLink.run({
        ...link,
        isPinned: link.isPinned ? 1 : 0,
        isActive: link.isActive ? 1 : 0,
      });
    }
  });

  write(data);
}

function rowToLink(row: LinkRow): NavLink {
  return {
    ...row,
    isPinned: Boolean(row.isPinned),
    isActive: Boolean(row.isActive),
  };
}


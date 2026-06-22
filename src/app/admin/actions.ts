"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { pinyin } from "pinyin-pro";
import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/auth";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/rate-limit";
import type { Category, NavLink, NavigationData } from "@/lib/data";
import {
  bulkInsertCategories,
  bulkInsertLinks,
  createId,
  deleteCategoryById,
  deleteLinkById,
  insertCategory,
  insertLink,
  readNavigationData,
  resetAllData,
  uniqueSlug,
  updateCategory as updateCategoryDb,
  updateLink as updateLinkDb,
  upsertSetting,
} from "@/lib/data";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function intValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

// ============================================================
// 输入校验
// ============================================================

const MAX_NAME_LENGTH = 100;
const MAX_URL_LENGTH = 2048;

function validateUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 检测 Next.js redirect() 抛出的内部异常
 * redirect() 通过 throw 实现，不应被业务 catch 吞掉
 */
function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as Record<string, unknown>).digest === "string" &&
    (error as Record<string, string>).digest.startsWith("NEXT_REDIRECT")
  );
}

function slugify(value: string) {
  const pinyinValue = pinyin(value, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
    v: true,
  }).join(" ");

  return pinyinValue
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type ParsedBookmark = {
  title: string;
  url: string;
  folder: string;
  parentFolder: string | null;
};

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }

    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }

    return namedEntities[normalized] ?? match;
  });
}

function readHtmlAttribute(attributes: string, name: string) {
  const match = attributes.match(new RegExp(name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return match ? decodeHtml(match[2]).trim() : "";
}

function canImportUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 归一化 URL 用于去重比较
 * - 统一小写 hostname
 * - 移除路径末尾 /
 * - 忽略协议差异（http vs https）
 * - 去掉 www 前缀
 */
function normalizeImportUrl(url: string): string {
  try {
    const parsed = new URL(url.toLowerCase());
    const hostname = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return hostname + pathname;
  } catch {
    return url.toLowerCase().trim();
  }
}

function faviconForUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return "https://unavatar.io/" + hostname;
  } catch {
    return null;
  }
}

const BROWSER_BOOKMARK_ROOTS = new Set([
  "书签栏",
  "收藏夹栏",
  "个人收藏栏",
  "收藏夹",
  "bookmarks bar",
  "favorites bar",
  "书签菜单",
  "bookmarks menu",
  "其他书签",
  "other bookmarks",
  "移动设备书签",
  "mobile bookmarks",
]);

function normalizeBookmarkRootName(name: string) {
  return name.trim().toLowerCase();
}

function bookmarkCategoryPath(folderStack: string[]) {
  const normalized = folderStack.map((folder) => folder.trim()).filter(Boolean);

  while (
    normalized.length > 0 &&
    BROWSER_BOOKMARK_ROOTS.has(normalizeBookmarkRootName(normalized[0]))
  ) {
    normalized.shift();
  }

  return normalized;
}

function parseBookmarkHtml(html: string): ParsedBookmark[] {
  const bookmarks: ParsedBookmark[] = [];
  const folderStack: string[] = [];
  let pendingFolder: string | null = null;

  for (const rawLine of html.split(/\r?\n/)) {
    const line = rawLine.trim();
    const folderMatch = line.match(/<H3\b[^>]*>(.*?)<\/H3>/i);

    if (folderMatch) {
      pendingFolder = decodeHtml(stripTags(folderMatch[1])).trim();
    }

    if (/<DL\b/i.test(line)) {
      if (pendingFolder) {
        folderStack.push(pendingFolder);
        pendingFolder = null;
      }
      continue;
    }

    if (/<\/DL>/i.test(line)) {
      if (folderStack.length > 0) {
        folderStack.pop();
      }
      continue;
    }

    const linkMatch = line.match(/<A\b([^>]*)>(.*?)<\/A>/i);

    if (!linkMatch) continue;

    const url = readHtmlAttribute(linkMatch[1], "HREF");
    const title = decodeHtml(stripTags(linkMatch[2])).trim() || url;

    if (!url || !canImportUrl(url)) continue;

    const categoryPath = bookmarkCategoryPath(folderStack);

    bookmarks.push({
      title,
      url,
      folder: categoryPath.at(-1) || "导入书签",
      parentFolder: categoryPath.length > 1 ? categoryPath.at(-2) ?? null : null,
    });
  }

  return bookmarks;
}
export async function loginAdmin(formData: FormData) {
  const password = textValue(formData, "password");

  // 速率限制：基于客户端 IP
  const headersList = await headers();
  const clientIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  const rateLimit = checkLoginRateLimit(clientIp);
  if (!rateLimit.ok) {
    redirect("/admin/login?error=rate_limit");
  }

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  // 登录成功，清除限流记录
  clearLoginRateLimit(clientIp);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function createCategory(formData: FormData): Promise<void> {
  try {
    const name = textValue(formData, "name");
    const rawSlug = textValue(formData, "slug");
    const parentId = textValue(formData, "parentId") || null;

    if (!name || name.length > MAX_NAME_LENGTH) {
      redirect("/admin/categories?error=name");
    }

    const data = await readNavigationData();
    const now = new Date().toISOString();

    insertCategory({
      id: createId("cat"),
      name,
      slug: uniqueSlug(slugify(rawSlug || name), data.categories),
      icon: textValue(formData, "icon", "📁") || "📁",
      color: textValue(formData, "color", "#2563eb") || "#2563eb",
      description: textValue(formData, "description") || null,
      parentId,
      sortOrder: intValue(formData, "sortOrder"),
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/");
    revalidatePath("/admin/categories");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("createCategory failed:", error);
    redirect("/admin/categories?error=failed");
  }
}

export async function updateCategory(formData: FormData): Promise<void> {
  try {
    const id = textValue(formData, "id");
    const name = textValue(formData, "name");
    const rawSlug = textValue(formData, "slug");
    const parentId = textValue(formData, "parentId") || null;

    if (!id || !name || name.length > MAX_NAME_LENGTH) {
      redirect("/admin/categories?error=invalid");
    }

    const data = await readNavigationData();
    const existing = data.categories.find((cat) => cat.id === id);
    if (!existing) redirect("/admin/categories?error=notfound");

    updateCategoryDb({
      ...existing,
      name,
      slug: uniqueSlug(slugify(rawSlug || name), data.categories, id),
      icon: textValue(formData, "icon", existing.icon) || existing.icon,
      color: textValue(formData, "color", existing.color) || existing.color,
      description: textValue(formData, "description") || null,
      parentId,
      sortOrder: intValue(formData, "sortOrder"),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/admin/categories");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("updateCategory failed:", error);
    redirect("/admin/categories?error=failed");
  }
}

export async function deleteCategory(formData: FormData): Promise<void> {
  try {
    const id = textValue(formData, "id");
    if (!id) redirect("/admin/categories?error=invalid");

    deleteCategoryById(id);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/links");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("deleteCategory failed:", error);
    redirect("/admin/categories?error=failed");
  }
}

export async function createLink(formData: FormData): Promise<void> {
  try {
    const title = textValue(formData, "title");
    const url = textValue(formData, "url");
    const categoryId = textValue(formData, "categoryId");

    if (!title || !url || !categoryId) redirect("/admin/links?error=invalid");
    if (title.length > MAX_NAME_LENGTH || url.length > MAX_URL_LENGTH) redirect("/admin/links?error=invalid");
    if (!validateUrl(url)) redirect("/admin/links?error=url");

    const now = new Date().toISOString();

    insertLink({
      id: createId("link"),
      title,
      url,
      categoryId,
      description: textValue(formData, "description") || null,
      icon: textValue(formData, "icon") || faviconForUrl(url),
      isPinned: formData.get("isPinned") === "on",
      isActive: formData.get("isActive") !== null,
      sortOrder: intValue(formData, "sortOrder"),
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("createLink failed:", error);
    redirect("/admin/links?error=failed");
  }
}

export async function updateLink(formData: FormData): Promise<void> {
  try {
    const id = textValue(formData, "id");
    const title = textValue(formData, "title");
    const url = textValue(formData, "url");
    const categoryId = textValue(formData, "categoryId");

    if (!id || !title || !url || !categoryId) redirect("/admin/links?error=invalid");
    if (title.length > MAX_NAME_LENGTH || url.length > MAX_URL_LENGTH) redirect("/admin/links?error=invalid");
    if (!validateUrl(url)) redirect("/admin/links?error=url");

    const data = await readNavigationData();
    const existing = data.links.find((link) => link.id === id);
    if (!existing) redirect("/admin/links?error=notfound");

    updateLinkDb({
      ...existing,
      title,
      url,
      categoryId,
      description: textValue(formData, "description") || null,
      icon: textValue(formData, "icon") || faviconForUrl(url),
      isPinned: formData.get("isPinned") === "on",
      isActive: formData.get("isActive") === "on",
      sortOrder: intValue(formData, "sortOrder"),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("updateLink failed:", error);
    redirect("/admin/links?error=failed");
  }
}

export async function deleteLink(formData: FormData): Promise<void> {
  try {
    const id = textValue(formData, "id");
    if (!id) redirect("/admin/links?error=invalid");

    deleteLinkById(id);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("deleteLink failed:", error);
    redirect("/admin/links?error=failed");
  }
}

export async function importBookmarks(formData: FormData) {
  try {
    const file = formData.get("bookmarksFile");

    if (!(file instanceof File) || file.size === 0) {
      redirect("/admin/links?importError=empty");
    }

    const html = await file.text();
    const bookmarks = parseBookmarkHtml(html);

    if (bookmarks.length === 0) {
      redirect("/admin/links?importError=empty");
    }

    const data = await readNavigationData();
    const now = new Date().toISOString();
    const existingUrls = new Set(data.links.map((link) => normalizeImportUrl(link.url)));
    const categoryByKey = new Map(
      data.categories.map((category) => [categoryImportKey(category.parentId, category.name), category]),
    );
    let importedCount = 0;
    let skippedCount = 0;
    let nextCategorySortOrder =
      data.categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 1;
    let nextLinkSortOrder =
      data.links.reduce((max, link) => Math.max(max, link.sortOrder), 0) + 1;

    const newCategories: Category[] = [];
    const newLinks: NavLink[] = [];

    function ensureImportedCategory(name: string, parentId: string | null) {
      const key = categoryImportKey(parentId, name);
      let category = categoryByKey.get(key);

      if (category) return category;

      category = {
        id: createId("cat"),
        name,
        slug: uniqueSlug(slugify(parentId ? parentId + "-" + name : name), data.categories),
        icon: "🔖",
        color: "#2563eb",
        description: null,
        parentId,
        sortOrder: nextCategorySortOrder,
        createdAt: now,
        updatedAt: now,
      };

      nextCategorySortOrder += 1;
      data.categories.push(category);
      newCategories.push(category);
      categoryByKey.set(key, category);

      return category;
    }

    for (const bookmark of bookmarks) {
      const url = bookmark.url.trim();
      const urlKey = normalizeImportUrl(url);

      if (existingUrls.has(urlKey)) {
        skippedCount += 1;
        continue;
      }

      const parentCategory = bookmark.parentFolder
        ? ensureImportedCategory(bookmark.parentFolder, null)
        : null;
      const category = ensureImportedCategory(bookmark.folder || "导入书签", parentCategory?.id ?? null);

      const newLink: NavLink = {
        id: createId("link"),
        title: bookmark.title,
        url,
        categoryId: category.id,
        description: null,
        icon: faviconForUrl(url),
        isPinned: false,
        isActive: true,
        sortOrder: nextLinkSortOrder,
        createdAt: now,
        updatedAt: now,
      };

      nextLinkSortOrder += 1;
      newLinks.push(newLink);
      importedCount += 1;
      existingUrls.add(urlKey);
    }

    if (importedCount > 0) {
      if (newCategories.length > 0) bulkInsertCategories(newCategories);
      bulkInsertLinks(newLinks);
      revalidatePath("/");
      revalidatePath("/admin");
      revalidatePath("/admin/categories");
      revalidatePath("/admin/links");
    }

    redirect("/admin/links?imported=" + importedCount + "&skipped=" + skippedCount);
  } catch (error) {
    // redirect() 内部抛出异常，不要捕获它
    if (isNextRedirect(error)) throw error;
    console.error("importBookmarks failed:", error);
    redirect("/admin/links?importError=failed");
  }
}

function categoryImportKey(parentId: string | null, name: string) {
  return (parentId ?? "root") + "::" + name.trim().toLowerCase();
}
export async function updateSettings(formData: FormData): Promise<void> {
  try {
    upsertSetting({
      id: "site",
      title: textValue(formData, "title", "我的导航") || "我的导航",
      subtitle: textValue(formData, "subtitle", "整理常用网站、工具与资料"),
      logoText: textValue(formData, "logoText", "N") || "N",
      themeColor: textValue(formData, "themeColor", "#2563eb") || "#2563eb",
    });

    revalidatePath("/");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("updateSettings failed:", error);
    redirect("/admin/settings?error=failed");
  }
}

type JsonImportResult =
  | { ok: false; error: string }
  | { ok: true; categoryCount: number; linkCount: number };

export async function restoreFromJson(formData: FormData): Promise<JsonImportResult> {
  try {
    const file = formData.get("restoreFile");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "请选择有效的 JSON 备份文件" };
    }

    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "JSON 格式无效，请检查文件内容" };
    }

    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "JSON 文件结构无效：顶层不是对象" };
    }

    const data = parsed as Record<string, unknown>;

    // 验证 settings
    if (!data.settings || typeof data.settings !== "object") {
      return { ok: false, error: "JSON 缺少 settings 字段" };
    }

    const settings = data.settings as Record<string, unknown>;
    if (!settings.title || !settings.id || !settings.themeColor) {
      return { ok: false, error: "settings 字段不完整，缺少 title/id/themeColor" };
    }

    // 验证 categories
    if (!Array.isArray(data.categories)) {
      return { ok: false, error: "categories 必须是数组" };
    }

    // 验证 links
    if (!Array.isArray(data.links)) {
      return { ok: false, error: "links 必须是数组" };
    }

    const navigationData: NavigationData = {
      settings: {
        id: String(settings.id),
        title: String(settings.title),
        subtitle: String(settings.subtitle ?? ""),
        logoText: String(settings.logoText ?? "N"),
        themeColor: String(settings.themeColor),
      },
      categories: (data.categories as unknown[]).map((cat: unknown) => {
        const c = cat as Record<string, unknown>;
        return {
          id: String(c.id ?? ""),
          name: String(c.name ?? ""),
          slug: String(c.slug ?? ""),
          icon: String(c.icon ?? "📁"),
          color: String(c.color ?? "#2563eb"),
          description: c.description ? String(c.description) : null,
          parentId: c.parentId ? String(c.parentId) : null,
          sortOrder: Number(c.sortOrder ?? 0),
          createdAt: String(c.createdAt ?? new Date().toISOString()),
          updatedAt: String(c.updatedAt ?? new Date().toISOString()),
        };
      }),
      links: (data.links as unknown[]).map((link: unknown) => {
        const l = link as Record<string, unknown>;
        return {
          id: String(l.id ?? ""),
          title: String(l.title ?? ""),
          url: String(l.url ?? ""),
          description: l.description ? String(l.description) : null,
          icon: l.icon ? String(l.icon) : null,
          isPinned: Boolean(l.isPinned),
          isActive: l.isActive !== false,
          sortOrder: Number(l.sortOrder ?? 0),
          categoryId: String(l.categoryId ?? ""),
          createdAt: String(l.createdAt ?? new Date().toISOString()),
          updatedAt: String(l.updatedAt ?? new Date().toISOString()),
        };
      }),
    };

    if (navigationData.categories.length === 0 && navigationData.links.length === 0) {
      return { ok: false, error: "备份文件中没有分类和链接数据" };
    }

    resetAllData(navigationData);

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/links");
    revalidatePath("/admin/settings");

    return {
      ok: true,
      categoryCount: navigationData.categories.length,
      linkCount: navigationData.links.length,
    };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("restoreFromJson failed:", error);
    return { ok: false, error: "恢复失败，请稍后重试" };
  }
}

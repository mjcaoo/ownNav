"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pinyin } from "pinyin-pro";
import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/auth";
import type { Category, NavLink } from "@/lib/data";
import {
  bulkInsertCategories,
  bulkInsertLinks,
  createId,
  deleteCategoryById,
  deleteLinkById,
  insertCategory,
  insertLink,
  readNavigationData,
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

type ActionResult = { ok: true } | { ok: false; error: string };

function errorResult(message: string): ActionResult {
  return { ok: false, error: message };
}

function successResult(): ActionResult {
  return { ok: true };
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

function faviconForUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return "https://www.google.com/s2/favicons?sz=64&domain=" + hostname;
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

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

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

export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const name = textValue(formData, "name");
    const rawSlug = textValue(formData, "slug");
    const parentId = textValue(formData, "parentId") || null;

    if (!name) return errorResult("分类名称不能为空");
    if (name.length > MAX_NAME_LENGTH) return errorResult(`分类名称不能超过 ${MAX_NAME_LENGTH} 个字符`);

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
    return successResult();
  } catch (error) {
    console.error("createCategory failed:", error);
    return errorResult("创建分类失败，请稍后重试");
  }
}

export async function updateCategory(formData: FormData): Promise<ActionResult> {
  try {
    const id = textValue(formData, "id");
    const name = textValue(formData, "name");
    const rawSlug = textValue(formData, "slug");
    const parentId = textValue(formData, "parentId") || null;

    if (!id || !name) return errorResult("分类 ID 和名称不能为空");
    if (name.length > MAX_NAME_LENGTH) return errorResult(`分类名称不能超过 ${MAX_NAME_LENGTH} 个字符`);

    const data = await readNavigationData();
    const existing = data.categories.find((cat) => cat.id === id);
    if (!existing) return errorResult("分类不存在或已被删除");

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
    return successResult();
  } catch (error) {
    console.error("updateCategory failed:", error);
    return errorResult("更新分类失败，请稍后重试");
  }
}

export async function deleteCategory(formData: FormData): Promise<ActionResult> {
  try {
    const id = textValue(formData, "id");
    if (!id) return errorResult("分类 ID 不能为空");

    deleteCategoryById(id);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/links");
    return successResult();
  } catch (error) {
    console.error("deleteCategory failed:", error);
    return errorResult("删除分类失败，请稍后重试");
  }
}

export async function createLink(formData: FormData): Promise<ActionResult> {
  try {
    const title = textValue(formData, "title");
    const url = textValue(formData, "url");
    const categoryId = textValue(formData, "categoryId");

    if (!title || !url || !categoryId) return errorResult("网站名称、URL 和分类不能为空");
    if (title.length > MAX_NAME_LENGTH) return errorResult(`网站名称不能超过 ${MAX_NAME_LENGTH} 个字符`);
    if (url.length > MAX_URL_LENGTH) return errorResult(`URL 不能超过 ${MAX_URL_LENGTH} 个字符`);
    if (!validateUrl(url)) return errorResult("请输入有效的 http:// 或 https:// 链接");

    const now = new Date().toISOString();

    insertLink({
      id: createId("link"),
      title,
      url,
      categoryId,
      description: textValue(formData, "description") || null,
      icon: textValue(formData, "icon") || null,
      isPinned: formData.get("isPinned") === "on",
      isActive: formData.get("isActive") !== null,
      sortOrder: intValue(formData, "sortOrder"),
      createdAt: now,
      updatedAt: now,
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
    return successResult();
  } catch (error) {
    console.error("createLink failed:", error);
    return errorResult("创建链接失败，请稍后重试");
  }
}

export async function updateLink(formData: FormData): Promise<ActionResult> {
  try {
    const id = textValue(formData, "id");
    const title = textValue(formData, "title");
    const url = textValue(formData, "url");
    const categoryId = textValue(formData, "categoryId");

    if (!id || !title || !url || !categoryId) return errorResult("ID、网站名称、URL 和分类不能为空");
    if (title.length > MAX_NAME_LENGTH) return errorResult(`网站名称不能超过 ${MAX_NAME_LENGTH} 个字符`);
    if (url.length > MAX_URL_LENGTH) return errorResult(`URL 不能超过 ${MAX_URL_LENGTH} 个字符`);
    if (!validateUrl(url)) return errorResult("请输入有效的 http:// 或 https:// 链接");

    const data = await readNavigationData();
    const existing = data.links.find((link) => link.id === id);
    if (!existing) return errorResult("链接不存在或已被删除");

    updateLinkDb({
      ...existing,
      title,
      url,
      categoryId,
      description: textValue(formData, "description") || null,
      icon: textValue(formData, "icon") || null,
      isPinned: formData.get("isPinned") === "on",
      isActive: formData.get("isActive") === "on",
      sortOrder: intValue(formData, "sortOrder"),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
    return successResult();
  } catch (error) {
    console.error("updateLink failed:", error);
    return errorResult("更新链接失败，请稍后重试");
  }
}

export async function deleteLink(formData: FormData): Promise<ActionResult> {
  try {
    const id = textValue(formData, "id");
    if (!id) return errorResult("链接 ID 不能为空");

    deleteLinkById(id);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/links");
    return successResult();
  } catch (error) {
    console.error("deleteLink failed:", error);
    return errorResult("删除链接失败，请稍后重试");
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
    const existingUrls = new Set(data.links.map((link) => link.url.trim().toLowerCase()));
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
      const urlKey = url.toLowerCase();

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
    console.error("importBookmarks failed:", error);
    redirect("/admin/links?importError=failed");
  }
}

function categoryImportKey(parentId: string | null, name: string) {
  return (parentId ?? "root") + "::" + name.trim().toLowerCase();
}
export async function updateSettings(formData: FormData): Promise<ActionResult> {
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
    return successResult();
  } catch (error) {
    console.error("updateSettings failed:", error);
    return errorResult("更新设置失败，请稍后重试");
  }
}

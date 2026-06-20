"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/auth";
import {
  createId,
  readNavigationData,
  uniqueSlug,
  writeNavigationData,
} from "@/lib/data";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function intValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function slugify(value: string) {
  return value
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

    bookmarks.push({
      title,
      url,
      folder: folderStack.at(-1) || "导入书签",
    });
  }

  return bookmarks;
}
export async function loginAdmin(formData: FormData) {
  const password = textValue(formData, "password");
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123456";

  if (password !== expectedPassword) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
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

export async function createCategory(formData: FormData) {
  const name = textValue(formData, "name");
  const rawSlug = textValue(formData, "slug");

  if (!name) return;

  const data = await readNavigationData();
  const now = new Date().toISOString();

  data.categories.push({
    id: createId("cat"),
      name,
      slug: uniqueSlug(slugify(rawSlug || name), data.categories),
      icon: textValue(formData, "icon", "📁") || "📁",
      color: textValue(formData, "color", "#2563eb") || "#2563eb",
      description: textValue(formData, "description") || null,
      sortOrder: intValue(formData, "sortOrder"),
      createdAt: now,
      updatedAt: now,
  });

  await writeNavigationData(data);

  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function updateCategory(formData: FormData) {
  const id = textValue(formData, "id");
  const name = textValue(formData, "name");
  const rawSlug = textValue(formData, "slug");

  if (!id || !name) return;

  const data = await readNavigationData();
  const category = data.categories.find((item) => item.id === id);

  if (!category) return;

  Object.assign(category, {
      name,
      slug: uniqueSlug(slugify(rawSlug || name), data.categories, id),
      icon: textValue(formData, "icon", "📁") || "📁",
      color: textValue(formData, "color", "#2563eb") || "#2563eb",
      description: textValue(formData, "description") || null,
      sortOrder: intValue(formData, "sortOrder"),
      updatedAt: new Date().toISOString(),
  });

  await writeNavigationData(data);

  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;

  const data = await readNavigationData();
  data.categories = data.categories.filter((category) => category.id !== id);
  data.links = data.links.filter((link) => link.categoryId !== id);
  await writeNavigationData(data);
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function createLink(formData: FormData) {
  const title = textValue(formData, "title");
  const url = textValue(formData, "url");
  const categoryId = textValue(formData, "categoryId");

  if (!title || !url || !categoryId) return;

  const data = await readNavigationData();
  const now = new Date().toISOString();

  data.links.push({
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

  await writeNavigationData(data);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/links");
}

export async function updateLink(formData: FormData) {
  const id = textValue(formData, "id");
  const title = textValue(formData, "title");
  const url = textValue(formData, "url");
  const categoryId = textValue(formData, "categoryId");

  if (!id || !title || !url || !categoryId) return;

  const data = await readNavigationData();
  const link = data.links.find((item) => item.id === id);

  if (!link) return;

  Object.assign(link, {
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

  await writeNavigationData(data);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/links");
}

export async function deleteLink(formData: FormData) {
  const id = textValue(formData, "id");
  if (!id) return;

  const data = await readNavigationData();
  data.links = data.links.filter((link) => link.id !== id);
  await writeNavigationData(data);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/links");
}

export async function importBookmarks(formData: FormData) {
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
  const categoryByName = new Map(
    data.categories.map((category) => [category.name.trim().toLowerCase(), category]),
  );
  let importedCount = 0;
  let skippedCount = 0;
  let nextCategorySortOrder =
    data.categories.reduce((max, category) => Math.max(max, category.sortOrder), 0) + 1;
  let nextLinkSortOrder =
    data.links.reduce((max, link) => Math.max(max, link.sortOrder), 0) + 1;

  for (const bookmark of bookmarks) {
    const url = bookmark.url.trim();
    const urlKey = url.toLowerCase();

    if (existingUrls.has(urlKey)) {
      skippedCount += 1;
      continue;
    }

    const categoryName = bookmark.folder || "导入书签";
    const categoryKey = categoryName.trim().toLowerCase();
    let category = categoryByName.get(categoryKey);

    if (!category) {
      category = {
        id: createId("cat"),
        name: categoryName,
        slug: uniqueSlug(slugify(categoryName), data.categories),
        icon: "🔖",
        color: "#2563eb",
        description: "从浏览器书签文件导入",
        sortOrder: nextCategorySortOrder,
        createdAt: now,
        updatedAt: now,
      };

      nextCategorySortOrder += 1;
      data.categories.push(category);
      categoryByName.set(categoryKey, category);
    }

    data.links.push({
      id: createId("link"),
      title: bookmark.title,
      url,
      categoryId: category.id,
      description: "从浏览器书签文件导入",
      icon: faviconForUrl(url),
      isPinned: false,
      isActive: true,
      sortOrder: nextLinkSortOrder,
      createdAt: now,
      updatedAt: now,
    });

    nextLinkSortOrder += 1;
    importedCount += 1;
    existingUrls.add(urlKey);
  }

  if (importedCount > 0) {
    await writeNavigationData(data);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/links");
  }

  redirect("/admin/links?imported=" + importedCount + "&skipped=" + skippedCount);
}
export async function updateSettings(formData: FormData) {
  const data = await readNavigationData();

  data.settings = {
    id: "site",
    title: textValue(formData, "title", "我的导航") || "我的导航",
    subtitle: textValue(formData, "subtitle", "整理常用网站、工具与资料"),
    logoText: textValue(formData, "logoText", "N") || "N",
    themeColor: textValue(formData, "themeColor", "#2563eb") || "#2563eb",
  };

  await writeNavigationData(data);

  revalidatePath("/");
  revalidatePath("/admin/settings");
}

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

import type { Metadata } from "next";
import { NavigationHome } from "@/components/navigation-home";
import { getCategoriesWithLinks, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.title,
    description: settings.subtitle,
    openGraph: {
      title: settings.title,
      description: settings.subtitle,
    },
  };
}

export default async function Home() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategoriesWithLinks({ onlyActive: true }),
  ]);

  return <NavigationHome settings={settings} categories={categories} />;
}


import { NavigationHome } from "@/components/navigation-home";
import { getCategoriesWithLinks, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategoriesWithLinks({ onlyActive: true }),
  ]);

  return <NavigationHome settings={settings} categories={categories} />;
}


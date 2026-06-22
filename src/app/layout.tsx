import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "我的导航",
    template: "%s | 我的导航",
  },
  description: "整理常用网站、工具与资料的个人导航站",
  keywords: ["导航", "书签", "工具", "常用网站"],
  authors: [{ name: "个人导航" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "我的导航",
    title: "我的导航 - 个人导航站",
    description: "整理常用网站、工具与资料",
  },
  twitter: {
    card: "summary",
    title: "我的导航 - 个人导航站",
    description: "整理常用网站、工具与资料",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

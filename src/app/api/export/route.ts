import { NextResponse } from "next/server";
import { readNavigationData } from "@/lib/data";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // 验证管理员登录
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const data = await readNavigationData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `navigation-backup-${timestamp}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

"use client";

import { useState, useTransition } from "react";
import { restoreFromJson } from "@/app/admin/actions";

export function DataRestoreForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await restoreFromJson(formData);
      if (res.ok) {
        setResult({
          ok: true,
          message: `✅ 恢复成功！导入 ${res.categoryCount} 个分类、${res.linkCount} 个链接`,
        });
      } else {
        setResult({ ok: false, message: res.error });
      }
    });
  }

  return (
    <div className="space-y-3">
      <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="admin-label flex-1 min-w-48">
          JSON 备份文件
          <input
            name="restoreFile"
            type="file"
            required
            accept=".json,application/json"
            className="admin-input"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="admin-button min-h-10"
        >
          {isPending ? "恢复中..." : "恢复数据"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            result.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {result.message}
        </div>
      )}

      <p className="text-xs text-slate-400">
        此操作将清空当前所有数据并替换为备份文件内容，请确认备份文件无误。
      </p>
    </div>
  );
}

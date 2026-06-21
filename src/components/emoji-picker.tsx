"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EmojiEntry = { emoji: string; name: string };
type EmojiGroup = { label: string; emojis: EmojiEntry[] };

const EMOJI_DATA: EmojiGroup[] = [
  {
    label: "常用",
    emojis: [
      { emoji: "📁", name: "文件夹" },
      { emoji: "📂", name: "打开文件夹" },
      { emoji: "⭐", name: "星标" },
      { emoji: "🔖", name: "书签" },
      { emoji: "📌", name: "图钉" },
      { emoji: "🏷️", name: "标签" },
      { emoji: "💡", name: "灯泡" },
      { emoji: "🔥", name: "火焰" },
      { emoji: "❤️", name: "红心" },
      { emoji: "✅", name: "勾选" },
      { emoji: "🏠", name: "房子" },
      { emoji: "🔗", name: "链接" },
      { emoji: "📎", name: "回形针" },
      { emoji: "📢", name: "喇叭" },
      { emoji: "🎯", name: "靶心" },
      { emoji: "🏆", name: "奖杯" },
    ],
  },
  {
    label: "工具",
    emojis: [
      { emoji: "🧰", name: "工具箱" },
      { emoji: "🛠️", name: "锤子扳手" },
      { emoji: "🔧", name: "扳手" },
      { emoji: "⚙️", name: "齿轮" },
      { emoji: "🔩", name: "螺栓" },
      { emoji: "🪛", name: "螺丝刀" },
      { emoji: "🧲", name: "磁铁" },
      { emoji: "📦", name: "包裹" },
      { emoji: "🗄️", name: "文件柜" },
      { emoji: "🗃️", name: "卡片盒" },
      { emoji: "📋", name: "剪贴板" },
      { emoji: "📊", name: "图表" },
      { emoji: "📈", name: "上升图表" },
      { emoji: "🧮", name: "算盘" },
      { emoji: "💻", name: "笔记本电脑" },
      { emoji: "🖥️", name: "台式电脑" },
    ],
  },
  {
    label: "网络",
    emojis: [
      { emoji: "🌐", name: "地球" },
      { emoji: "☁️", name: "云" },
      { emoji: "🔍", name: "搜索" },
      { emoji: "🧭", name: "指南针" },
      { emoji: "📡", name: "卫星天线" },
      { emoji: "🛰️", name: "卫星" },
      { emoji: "🔌", name: "插头" },
      { emoji: "💾", name: "软盘" },
      { emoji: "💿", name: "光盘" },
      { emoji: "📱", name: "手机" },
      { emoji: "⌨️", name: "键盘" },
      { emoji: "🖱️", name: "鼠标" },
      { emoji: "🖨️", name: "打印机" },
      { emoji: "📹", name: "摄像机" },
      { emoji: "🎥", name: "电影摄影机" },
      { emoji: "📺", name: "电视" },
    ],
  },
  {
    label: "学习",
    emojis: [
      { emoji: "📚", name: "书堆" },
      { emoji: "📖", name: "打开的书" },
      { emoji: "📝", name: "备忘录" },
      { emoji: "✏️", name: "铅笔" },
      { emoji: "🖊️", name: "笔" },
      { emoji: "📐", name: "三角尺" },
      { emoji: "📏", name: "直尺" },
      { emoji: "🧷", name: "安全别针" },
      { emoji: "🧪", name: "试管" },
      { emoji: "🔬", name: "显微镜" },
      { emoji: "🔭", name: "望远镜" },
      { emoji: "🧬", name: "DNA" },
      { emoji: "🎓", name: "毕业帽" },
      { emoji: "🏫", name: "学校" },
      { emoji: "🧠", name: "大脑" },
      { emoji: "💬", name: "对话气泡" },
    ],
  },
  {
    label: "创意",
    emojis: [
      { emoji: "🎨", name: "调色板" },
      { emoji: "🖌️", name: "画笔" },
      { emoji: "🎭", name: "面具" },
      { emoji: "🎬", name: "场记板" },
      { emoji: "🎵", name: "音符" },
      { emoji: "🎶", name: "双音符" },
      { emoji: "🎸", name: "吉他" },
      { emoji: "🎹", name: "钢琴" },
      { emoji: "🎤", name: "麦克风" },
      { emoji: "🎧", name: "耳机" },
      { emoji: "📷", name: "相机" },
      { emoji: "🖼️", name: "画框" },
      { emoji: "🎪", name: "马戏团帐篷" },
      { emoji: "✨", name: "闪光" },
      { emoji: "💎", name: "宝石" },
      { emoji: "🌟", name: "闪耀" },
    ],
  },
  {
    label: "游戏",
    emojis: [
      { emoji: "🎮", name: "游戏手柄" },
      { emoji: "🕹️", name: "摇杆" },
      { emoji: "🎲", name: "骰子" },
      { emoji: "♟️", name: "棋子" },
      { emoji: "🧩", name: "拼图" },
      { emoji: "🃏", name: "小丑牌" },
      { emoji: "🎰", name: "老虎机" },
      { emoji: "🏆", name: "奖杯" },
      { emoji: "🥇", name: "金牌" },
      { emoji: "🥈", name: "银牌" },
      { emoji: "🥉", name: "铜牌" },
      { emoji: "🏅", name: "奖章" },
      { emoji: "⚽", name: "足球" },
      { emoji: "🏀", name: "篮球" },
      { emoji: "🎾", name: "网球" },
      { emoji: "🎳", name: "保龄球" },
    ],
  },
  {
    label: "科技",
    emojis: [
      { emoji: "🤖", name: "机器人" },
      { emoji: "🚀", name: "火箭" },
      { emoji: "🛸", name: "飞碟" },
      { emoji: "⚡", name: "闪电" },
      { emoji: "🔮", name: "水晶球" },
      { emoji: "🧫", name: "培养皿" },
      { emoji: "🔋", name: "电池" },
      { emoji: "🧲", name: "磁铁" },
      { emoji: "🌀", name: "漩涡" },
      { emoji: "💫", name: "眩晕" },
      { emoji: "🌈", name: "彩虹" },
      { emoji: "☀️", name: "太阳" },
      { emoji: "🌙", name: "月亮" },
      { emoji: "⭐", name: "星星" },
      { emoji: "❄️", name: "雪花" },
      { emoji: "🔑", name: "钥匙" },
    ],
  },
  {
    label: "安全",
    emojis: [
      { emoji: "🔐", name: "锁" },
      { emoji: "🔒", name: "挂锁" },
      { emoji: "🛡️", name: "盾牌" },
      { emoji: "🔑", name: "钥匙" },
      { emoji: "🗝️", name: "老式钥匙" },
      { emoji: "👁️", name: "眼睛" },
      { emoji: "🚨", name: "警灯" },
      { emoji: "⚠️", name: "警告" },
      { emoji: "⛔", name: "禁止" },
      { emoji: "🛑", name: "停止标志" },
      { emoji: "🚧", name: "施工" },
      { emoji: "🔔", name: "铃铛" },
      { emoji: "📣", name: "扩音器" },
      { emoji: "✅", name: "勾选" },
      { emoji: "🚷", name: "禁止通行" },
      { emoji: "🔞", name: "18禁" },
    ],
  },
  {
    label: "生活",
    emojis: [
      { emoji: "💼", name: "公文包" },
      { emoji: "🧳", name: "行李箱" },
      { emoji: "🎒", name: "背包" },
      { emoji: "👓", name: "眼镜" },
      { emoji: "⌚", name: "手表" },
      { emoji: "💰", name: "钱袋" },
      { emoji: "💳", name: "信用卡" },
      { emoji: "🧾", name: "收据" },
      { emoji: "📝", name: "备忘录" },
      { emoji: "📅", name: "日历" },
      { emoji: "⏰", name: "闹钟" },
      { emoji: "📞", name: "电话" },
      { emoji: "📧", name: "邮件" },
      { emoji: "✉️", name: "信封" },
      { emoji: "📮", name: "邮箱" },
      { emoji: "🏠", name: "房子" },
    ],
  },
  {
    label: "食物",
    emojis: [
      { emoji: "☕", name: "咖啡" },
      { emoji: "🍵", name: "茶" },
      { emoji: "🧃", name: "果汁" },
      { emoji: "🍺", name: "啤酒" },
      { emoji: "🍕", name: "披萨" },
      { emoji: "🍔", name: "汉堡" },
      { emoji: "🍜", name: "面条" },
      { emoji: "🍰", name: "蛋糕" },
      { emoji: "🎂", name: "生日蛋糕" },
      { emoji: "🍎", name: "苹果" },
      { emoji: "🍊", name: "橙子" },
      { emoji: "🍋", name: "柠檬" },
      { emoji: "🍇", name: "葡萄" },
      { emoji: "🍓", name: "草莓" },
      { emoji: "🥝", name: "猕猴桃" },
      { emoji: "🧊", name: "冰块" },
    ],
  },
  {
    label: "自然",
    emojis: [
      { emoji: "🌿", name: "草药" },
      { emoji: "🌱", name: "幼苗" },
      { emoji: "🌳", name: "树" },
      { emoji: "🌴", name: "棕榈树" },
      { emoji: "🌵", name: "仙人掌" },
      { emoji: "🍄", name: "蘑菇" },
      { emoji: "🐶", name: "狗" },
      { emoji: "🐱", name: "猫" },
      { emoji: "🐻", name: "熊" },
      { emoji: "🐼", name: "熊猫" },
      { emoji: "🦁", name: "狮子" },
      { emoji: "🐸", name: "青蛙" },
      { emoji: "🦋", name: "蝴蝶" },
      { emoji: "🐝", name: "蜜蜂" },
      { emoji: "🌊", name: "海浪" },
      { emoji: "🏔️", name: "雪山" },
    ],
  },
  {
    label: "符号",
    emojis: [
      { emoji: "💯", name: "一百分" },
      { emoji: "❗", name: "感叹号" },
      { emoji: "❓", name: "问号" },
      { emoji: "💢", name: "愤怒" },
      { emoji: "💥", name: "碰撞" },
      { emoji: "💫", name: "眩晕" },
      { emoji: "💧", name: "水滴" },
      { emoji: "💨", name: "尾气" },
      { emoji: "🎵", name: "音符" },
      { emoji: "➕", name: "加号" },
      { emoji: "➖", name: "减号" },
      { emoji: "➗", name: "除号" },
      { emoji: "✖️", name: "乘号" },
      { emoji: "♾️", name: "无限" },
      { emoji: "🔁", name: "循环" },
      { emoji: "🔃", name: "顺时针" },
    ],
  },
];

export function EmojiPicker({
  name = "icon",
  defaultValue = "📁",
  compact = false,
}: {
  name?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  const [icon, setIcon] = useState(defaultValue || "📁");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    searchRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return EMOJI_DATA;

    const keyword = search.trim().toLowerCase();
    return EMOJI_DATA.map((group) => ({
      ...group,
      emojis: group.emojis.filter((e) => e.name.toLowerCase().includes(keyword)),
    })).filter((group) => group.emojis.length > 0);
  }, [search]);

  return (
    <div ref={pickerRef} className="relative">
      <input type="hidden" name={name} value={icon} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "admin-input flex items-center gap-2 text-left",
          compact ? "h-9 w-9 justify-center p-0" : "h-10",
        ].join(" ")}
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-base">
          {icon}
        </span>
        {compact ? null : (
          <>
            <span className="text-xs font-semibold text-slate-500">选择图标</span>
            <span aria-hidden className="ml-auto text-xs text-slate-400">
              ▾
            </span>
          </>
        )}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm">
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label="选择 Emoji 图标"
            className="relative flex h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-slate-900">选择图标</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-slate-100 px-4 py-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索 emoji 名称..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category tabs */}
            {!search.trim() && (
              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 scrollbar-none">
                {EMOJI_DATA.map((group, index) => (
                  <button
                    key={group.label}
                    type="button"
                    onClick={() => setActiveGroup(index)}
                    className={[
                      "shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                      index === activeGroup
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-500 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {filteredGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">没有匹配的 emoji</p>
              ) : search.trim() ? (
                filteredGroups.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400">{group.label}</p>
                    <div className="grid grid-cols-8 gap-1">
                      {group.emojis.map((entry) => (
                        <EmojiButton
                          key={entry.emoji + entry.name}
                          entry={entry}
                          selected={entry.emoji === icon}
                          onSelect={() => {
                            setIcon(entry.emoji);
                            setOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_DATA[activeGroup]?.emojis.map((entry) => (
                    <EmojiButton
                      key={entry.emoji + entry.name}
                      entry={entry}
                      selected={entry.emoji === icon}
                      onSelect={() => {
                        setIcon(entry.emoji);
                        setOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer: current selection */}
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-xl">
                {icon}
              </span>
              <span className="text-xs text-slate-500">当前选择</span>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EmojiButton({
  entry,
  selected,
  onSelect,
}: {
  entry: EmojiEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      title={entry.name}
      onClick={onSelect}
      className={[
        "grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:scale-110 hover:bg-blue-50",
        selected ? "bg-blue-50 ring-2 ring-blue-300" : "bg-white",
      ].join(" ")}
    >
      {entry.emoji}
    </button>
  );
}

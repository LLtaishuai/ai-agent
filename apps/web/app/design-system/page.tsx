"use client";

/**
 * 设计系统检查台。
 *
 * 目的不是展示组件，而是集中核对两件事：
 * 1. theme.css 里的基础令牌是否真的被浏览器解析到（缺失 / 命名漂移会立刻暴露）；
 * 2. @repo/ui 组件的默认约束（变体、状态、覆盖、槽位间距、描边）之间是否互相冲突。
 *
 * 所有结论都在浏览器里用 getComputedStyle 实测得出，不做静态臆测。
 */

import { useEffect, useState } from "react";

import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";

/* ------------------------------------------------------------------ */
/* 颜色计算                                                            */
/* ------------------------------------------------------------------ */

type Rgb = { r: number; g: number; b: number; a: number };

function parseColor(input: string): Rgb | null {
  const value = input.trim();
  if (!value) return null;

  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  const rawHex = hex?.[1];
  if (rawHex) {
    const digits =
      rawHex.length <= 4
        ? rawHex
            .split("")
            .map((c) => c + c)
            .join("")
        : rawHex;
    const int = Number.parseInt(digits.slice(0, 6), 16);
    const alpha =
      digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : 1;
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
      a: alpha,
    };
  }

  const fn = value.match(/^rgba?\(([^)]+)\)$/i);
  const channels = fn?.[1];
  if (channels) {
    const parts = channels
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    const [r, g, b, a] = parts;
    if (
      r === undefined ||
      g === undefined ||
      b === undefined ||
      parts.some(Number.isNaN)
    )
      return null;
    return { r, g, b, a: a ?? 1 };
  }

  return null;
}

/** 把半透明前景叠加到实色背景上，得到肉眼看到的颜色 */
function compositeOver(fg: Rgb, bg: Rgb): Rgb {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
    a,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 对比度，返回值 1 ~ 21 */
function contrastRatio(fg: string, bg: string): number | null {
  const parsedFg = parseColor(fg);
  const parsedBg = parseColor(bg);
  if (!parsedFg || !parsedBg) return null;

  // 背景若带透明度，先落到画布底色上
  const canvas = parseColor("#0a0f1e")!;
  const solidBg = parsedBg.a < 1 ? compositeOver(parsedBg, canvas) : parsedBg;
  const solidFg = parsedFg.a < 1 ? compositeOver(parsedFg, solidBg) : parsedFg;

  const l1 = relativeLuminance(solidFg);
  const l2 = relativeLuminance(solidBg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------------ */
/* 检查项定义                                                          */
/* ------------------------------------------------------------------ */

type TokenKind = "color" | "radius" | "shadow" | "text" | "font";

type TokenSpec = {
  name: string;
  kind: TokenKind;
  usage: string;
  /** 用工具类渲染样例，可同时验证「令牌存在」和「令牌接到了工具类」 */
  demoClass?: string;
};

const TOKEN_GROUPS: { group: string; items: TokenSpec[] }[] = [
  {
    group: "Brand",
    items: [
      { name: "--color-brand-50", kind: "color", usage: "浅底徽标" },
      { name: "--color-brand-100", kind: "color", usage: "浅底徽标" },
      { name: "--color-brand-200", kind: "color", usage: "描边 / 分隔" },
      { name: "--color-brand-300", kind: "color", usage: "深底上的文字" },
      { name: "--color-brand-400", kind: "color", usage: "链接文字" },
      { name: "--color-brand-500", kind: "color", usage: "主色 / 选区底色" },
      { name: "--color-brand-600", kind: "color", usage: "主按钮底" },
      {
        name: "--color-brand-700",
        kind: "color",
        usage: "主按钮悬停底 / 浅底文字",
      },
      { name: "--color-brand-800", kind: "color", usage: "深色底" },
      { name: "--color-brand-900", kind: "color", usage: "深色底" },
    ],
  },
  {
    group: "Surface",
    items: [
      { name: "--color-surface-canvas", kind: "color", usage: "页面底色" },
      { name: "--color-surface-panel", kind: "color", usage: "卡片 / 面板" },
      {
        name: "--color-surface-elevated",
        kind: "color",
        usage: "次级按钮 / 输入框",
      },
      { name: "--color-surface-overlay", kind: "color", usage: "遮罩层" },
    ],
  },
  {
    group: "Content",
    items: [
      { name: "--color-content-primary", kind: "color", usage: "标题 / 正文" },
      { name: "--color-content-secondary", kind: "color", usage: "次级正文" },
      {
        name: "--color-content-tertiary",
        kind: "color",
        usage: "辅助说明 / placeholder",
      },
      { name: "--color-content-disabled", kind: "color", usage: "禁用文字" },
      {
        name: "--color-content-inverse",
        kind: "color",
        usage: "浅色底上的文字",
      },
    ],
  },
  {
    group: "Border",
    items: [
      {
        name: "--color-border-default",
        kind: "color",
        usage: "默认描边 / 分隔线",
      },
      { name: "--color-border-strong", kind: "color", usage: "表单控件描边" },
      { name: "--color-border-focus", kind: "color", usage: "焦点环" },
      { name: "--color-border-error", kind: "color", usage: "错误态描边" },
    ],
  },
  {
    group: "Feedback",
    items: [
      { name: "--color-state-success", kind: "color", usage: "成功色" },
      {
        name: "--color-state-success-subtle",
        kind: "color",
        usage: "成功底色",
      },
      { name: "--color-state-warning", kind: "color", usage: "警告色" },
      {
        name: "--color-state-warning-subtle",
        kind: "color",
        usage: "警告底色",
      },
      {
        name: "--color-state-error",
        kind: "color",
        usage: "错误色 / 错误文字",
      },
      {
        name: "--color-state-error-strong",
        kind: "color",
        usage: "危险按钮底",
      },
      { name: "--color-state-error-subtle", kind: "color", usage: "错误底色" },
      { name: "--color-state-info", kind: "color", usage: "信息色" },
      { name: "--color-state-info-subtle", kind: "color", usage: "信息底色" },
    ],
  },
  {
    group: "Radius",
    items: [
      {
        name: "--radius-sm",
        kind: "radius",
        usage: "小控件",
        demoClass: "rounded-sm",
      },
      {
        name: "--radius-md",
        kind: "radius",
        usage: "按钮 / 输入框",
        demoClass: "rounded-md",
      },
      {
        name: "--radius-lg",
        kind: "radius",
        usage: "次级容器",
        demoClass: "rounded-lg",
      },
      {
        name: "--radius-xl",
        kind: "radius",
        usage: "卡片",
        demoClass: "rounded-xl",
      },
    ],
  },
  {
    group: "Shadow",
    items: [
      {
        name: "--shadow-xs",
        kind: "shadow",
        usage: "描边替代 / 按钮",
        demoClass: "shadow-xs",
      },
      {
        name: "--shadow-sm",
        kind: "shadow",
        usage: "卡片",
        demoClass: "shadow-sm",
      },
      {
        name: "--shadow-md",
        kind: "shadow",
        usage: "浮层",
        demoClass: "shadow-md",
      },
      {
        name: "--shadow-lg",
        kind: "shadow",
        usage: "模态 / 强调块",
        demoClass: "shadow-lg",
      },
      {
        name: "--shadow-glow",
        kind: "shadow",
        usage: "品牌辉光",
        demoClass: "shadow-glow",
      },
    ],
  },
  {
    group: "Typography",
    items: [
      {
        name: "--font-sans",
        kind: "font",
        usage: "正文（preflight 默认）",
        demoClass: "font-sans",
      },
      {
        name: "--font-mono",
        kind: "font",
        usage: "代码",
        demoClass: "font-mono",
      },
      {
        name: "--text-xs",
        kind: "text",
        usage: "辅助标签",
        demoClass: "text-xs",
      },
      {
        name: "--text-sm",
        kind: "text",
        usage: "组件默认字号",
        demoClass: "text-sm",
      },
      {
        name: "--text-base",
        kind: "text",
        usage: "输入框",
        demoClass: "text-base",
      },
      {
        name: "--text-lg",
        kind: "text",
        usage: "小标题",
        demoClass: "text-lg",
      },
      { name: "--text-xl", kind: "text", usage: "标题", demoClass: "text-xl" },
      {
        name: "--text-2xl",
        kind: "text",
        usage: "页面标题",
        demoClass: "text-2xl",
      },
      {
        name: "--text-3xl",
        kind: "text",
        usage: "主标题",
        demoClass: "text-3xl",
      },
    ],
  },
];

type ContrastCase = {
  fg: string;
  bg: string;
  usage: string;
  min: number;
  /** min 为 0 的行不计入失败统计，这里写明豁免原因，避免把参考项误标成禁用态 */
  exempt?: string;
};

const SURFACE_TOKENS = [
  "--color-surface-canvas",
  "--color-surface-panel",
  "--color-surface-elevated",
];

const CONTENT_TOKENS: {
  name: string;
  usage: string;
  min: number;
  exempt?: string;
}[] = [
  { name: "--color-content-primary", usage: "标题 / 正文", min: 4.5 },
  { name: "--color-content-secondary", usage: "次级正文", min: 4.5 },
  { name: "--color-content-tertiary", usage: "辅助说明", min: 4.5 },
  {
    name: "--color-content-disabled",
    usage: "禁用文字（豁免）",
    min: 0,
    exempt: "禁用态豁免",
  },
];

const CONTRAST_CASES: ContrastCase[] = [
  ...SURFACE_TOKENS.flatMap((bg) =>
    CONTENT_TOKENS.map((fg) => ({
      fg: fg.name,
      bg,
      usage: `${fg.usage} / ${bg.replace("--color-", "")}`,
      min: fg.min,
      exempt: fg.exempt,
    })),
  ),
  {
    fg: "--color-content-primary",
    bg: "--color-brand-500",
    usage: "参考 / brand-500 底（未达 4.5:1，不作按钮底色）",
    min: 0,
    exempt: "参考项",
  },
  {
    fg: "--color-content-primary",
    bg: "--color-brand-600",
    usage: "主按钮文字 / brand-600 底（Button default）",
    min: 4.5,
  },
  {
    fg: "--color-content-primary",
    bg: "--color-brand-700",
    usage: "主按钮悬停文字 / brand-700 底（Button hover）",
    min: 4.5,
  },
  {
    fg: "--color-content-inverse",
    bg: "--color-brand-400",
    usage: "深色文字 / 浅色按钮底",
    min: 4.5,
  },
  {
    fg: "--color-content-primary",
    bg: "--color-state-error-strong",
    usage: "危险按钮文字 / state-error-strong 底（Button destructive）",
    min: 4.5,
  },
  {
    fg: "--color-brand-400",
    bg: "--color-surface-panel",
    usage: "链接文字（Button link）",
    min: 4.5,
  },
  {
    fg: "--color-state-success",
    bg: "--color-surface-panel",
    usage: "成功色作文字",
    min: 3,
  },
  {
    fg: "--color-state-warning",
    bg: "--color-surface-panel",
    usage: "警告色作文字",
    min: 3,
  },
  {
    fg: "--color-state-error",
    bg: "--color-surface-panel",
    usage: "错误色作文字",
    min: 3,
  },
  {
    fg: "--color-state-info",
    bg: "--color-surface-panel",
    usage: "信息色作文字",
    min: 3,
  },
];

type MergeCase = {
  label: string;
  classes: string[];
  expect: "last-wins" | "keep-both";
};

const MERGE_CASES: MergeCase[] = [
  {
    label: "背景色被外部 className 覆盖",
    classes: ["bg-brand-500", "bg-brand-600"],
    expect: "last-wins",
  },
  {
    label: "文字层级被外部 className 覆盖",
    classes: ["text-content-tertiary", "text-content-primary"],
    expect: "last-wins",
  },
  {
    label: "描边色覆盖",
    classes: ["border-border-default", "border-border-strong"],
    expect: "last-wins",
  },
  {
    label: "圆角覆盖",
    classes: ["rounded-md", "rounded-xl"],
    expect: "last-wins",
  },
  {
    label: "阴影覆盖",
    classes: ["shadow-sm", "shadow-lg"],
    expect: "last-wins",
  },
  {
    label: "焦点环覆盖（带变体前缀）",
    classes: [
      "focus-visible:ring-border-focus",
      "focus-visible:ring-border-error/40",
    ],
    expect: "last-wins",
  },
  {
    label: "hover 背景覆盖（带变体前缀）",
    classes: ["hover:bg-surface-elevated", "hover:bg-brand-500"],
    expect: "last-wins",
  },
  {
    label: "不同分组不应被误删",
    classes: ["bg-surface-panel", "text-content-primary"],
    expect: "keep-both",
  },
];

const BUTTON_VARIANTS = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;
const BUTTON_SIZES = ["sm", "default", "lg", "icon"] as const;

/* ------------------------------------------------------------------ */
/* 运行时读取令牌                                                      */
/* ------------------------------------------------------------------ */

const ALL_TOKEN_NAMES = TOKEN_GROUPS.flatMap((g) => g.items.map((i) => i.name));

function useResolvedTokens() {
  const [tokens, setTokens] = useState<Record<string, string> | null>(null);
  const [appFonts, setAppFonts] = useState<{
    geistSans: string;
    sans: string;
  } | null>(null);
  const [baseline, setBaseline] = useState<{
    background: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    for (const name of ALL_TOKEN_NAMES) {
      map[name] = root.getPropertyValue(name).trim();
    }
    const bodyStyle = getComputedStyle(document.body);

    setTokens(map);
    setBaseline({
      background: bodyStyle.backgroundColor,
      color: bodyStyle.color,
    });
    setAppFonts({
      geistSans: bodyStyle.getPropertyValue("--font-geist-sans").trim(),
      sans: map["--font-sans"] ?? "",
    });
  }, []);

  return { tokens, appFonts, baseline };
}

/** 把计算后的颜色归一成 r,g,b，用于让「实际继承值」与「令牌值」可比较 */
function colorKey(value: string): string {
  const parsed = parseColor(value);
  if (!parsed) return "";
  return `${Math.round(parsed.r)},${Math.round(parsed.g)},${Math.round(parsed.b)}`;
}

/* ------------------------------------------------------------------ */
/* 展示用小件                                                          */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          <a href={`#${id}`} className="hover:text-brand-400">
            {title}
          </a>
        </h2>
        <p className="text-sm text-content-tertiary">{desc}</p>
      </div>
      {children}
    </section>
  );
}

type Tone = "ok" | "warn" | "info" | "neutral";

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const toneClass: Record<Tone, string> = {
    ok: "bg-state-success-subtle text-state-success border-state-success/30",
    warn: "bg-state-error-subtle text-state-error border-state-error/40",
    info: "bg-state-info-subtle text-state-info border-state-info/30",
    neutral: "bg-surface-elevated text-content-tertiary border-border-default",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-default bg-surface-panel p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CheckRow({
  label,
  tone,
  status,
  detail,
}: {
  label: string;
  tone: Tone;
  status: string;
  detail?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border-default py-2 last:border-b-0">
      <span className="text-sm text-content-secondary">{label}</span>
      {detail}
      <span className="ml-auto">
        <Badge tone={tone}>{status}</Badge>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 页面                                                                */
/* ------------------------------------------------------------------ */

export default function DesignSystemPage() {
  const { tokens, appFonts, baseline } = useResolvedTokens();
  const ready = tokens !== null;

  const missing = ready ? ALL_TOKEN_NAMES.filter((n) => !tokens[n]) : [];

  // 令牌存在不等于被应用：用 body 的实际继承值对照令牌，能抓出「令牌定义了但没人接」的情况
  const baselineChecks = ready
    ? [
        {
          label: "body 背景色接上 --color-surface-canvas",
          actual: baseline?.background ?? "",
          expected: tokens["--color-surface-canvas"] ?? "",
        },
        {
          label: "body 文字色接上 --color-content-primary",
          actual: baseline?.color ?? "",
          expected: tokens["--color-content-primary"] ?? "",
        },
      ].map((item) => ({
        ...item,
        ok:
          colorKey(item.actual) !== "" &&
          colorKey(item.actual) === colorKey(item.expected),
      }))
    : [];
  const baselineFailures = baselineChecks.filter((c) => !c.ok);

  const contrastResults = ready
    ? CONTRAST_CASES.map((c) => {
        const ratio = contrastRatio(tokens[c.fg] ?? "", tokens[c.bg] ?? "");
        return {
          ...c,
          ratio,
          failed: c.min > 0 && (ratio === null || ratio < c.min),
        };
      })
    : [];
  const contrastFailures = contrastResults.filter((r) => r.failed);

  const mergeResults = MERGE_CASES.map((c) => {
    const merged = cn(...c.classes);
    const survived = merged.split(/\s+/).filter(Boolean);
    const ok =
      c.expect === "last-wins"
        ? survived.length === 1 &&
          survived[0] === c.classes[c.classes.length - 1]
        : c.classes.every((cls) => survived.includes(cls));
    return { ...c, merged, ok };
  });
  const mergeFailures = mergeResults.filter((r) => !r.ok);

  const conflictCount =
    missing.length +
    baselineFailures.length +
    contrastFailures.length +
    mergeFailures.length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 bg-surface-canvas px-6 py-12 text-content-primary">
      <header className="space-y-4">
        <p className="text-sm font-medium text-content-tertiary">
          web · 设计系统
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          令牌与组件约束检查台
        </h1>
        <p className="max-w-2xl text-content-secondary">
          这里不追求好看，只回答一个问题：theme.css 的基础令牌与 @repo/ui
          组件的默认约束之间有没有冲突。下列结论全部在浏览器中实测得出。
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-content-tertiary">
          {[
            ["baseline", "全局基线"],
            ["tokens", "令牌清单"],
            ["contrast", "对比度"],
            ["primitives", "圆角 / 阴影 / 字体"],
            ["components", "组件约束"],
            ["merge", "类名合并"],
            ["border", "描边与焦点"],
          ].map(([id, text]) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-brand-400 hover:underline"
            >
              {text}
            </a>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <p className="text-xs font-medium text-content-tertiary">缺失令牌</p>
          <p className="mt-1 text-2xl font-semibold">
            {ready ? missing.length : "—"}
          </p>
          <p className="mt-1 text-xs text-content-tertiary">
            共检查 {ALL_TOKEN_NAMES.length} 项
          </p>
        </Panel>
        <Panel>
          <p className="text-xs font-medium text-content-tertiary">
            全局基线未接令牌
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {ready ? baselineFailures.length : "—"}
          </p>
          <p className="mt-1 text-xs text-content-tertiary">
            共检查 {baselineChecks.length} 项
          </p>
        </Panel>
        <Panel>
          <p className="text-xs font-medium text-content-tertiary">
            对比度不达标
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {ready ? contrastFailures.length : "—"}
          </p>
          <p className="mt-1 text-xs text-content-tertiary">
            共检查 {CONTRAST_CASES.length} 组前景 / 背景
          </p>
        </Panel>
        <Panel>
          <p className="text-xs font-medium text-content-tertiary">
            类名冲突未消解
          </p>
          <p className="mt-1 text-2xl font-semibold">{mergeFailures.length}</p>
          <p className="mt-1 text-xs text-content-tertiary">
            共检查 {MERGE_CASES.length} 组
          </p>
        </Panel>
      </div>

      <Panel className="flex items-center gap-3">
        <Badge tone={ready && conflictCount === 0 ? "ok" : "warn"}>
          {ready
            ? conflictCount === 0
              ? "无冲突"
              : `待处理 ${conflictCount} 项`
            : "检测中"}
        </Badge>
        <span className="text-sm text-content-tertiary">
          对比度按 WCAG 计算：正文 4.5:1，图形/大字
          3:1；禁用态与参考项不计入失败。
        </span>
      </Panel>

      {/* ---------------- 全局基线 ---------------- */}
      <Section
        id="baseline"
        title="全局基线"
        desc="令牌被定义 ≠ 令牌被应用。这里把 body 的实际计算样式与令牌对照，专门抓「令牌存在但没有任何地方接上」的情况。本页自身的画布与文字色写在 main 上，不改动应用全局样式。"
      >
        <Panel className="space-y-1">
          {baselineChecks.length === 0 ? (
            <p className="text-sm text-content-tertiary">读取中…</p>
          ) : (
            baselineChecks.map((row) => (
              <CheckRow
                key={row.label}
                label={row.label}
                tone={row.ok ? "ok" : "warn"}
                status={row.ok ? "已接上" : "未接上"}
                detail={
                  <span className="font-mono text-xs text-content-tertiary">
                    实际 {row.actual || "—"} / 期望 {row.expected || "—"}
                  </span>
                }
              />
            ))
          )}
        </Panel>
      </Section>

      {/* ---------------- 令牌清单 ---------------- */}
      <Section
        id="tokens"
        title="令牌清单"
        desc="逐项读取 :root 上的自定义属性。显示为空说明令牌缺失或改名，色块/样例同时验证令牌是否接上了工具类。"
      >
        <div className="flex flex-col gap-6">
          {TOKEN_GROUPS.map((group) => (
            <div key={group.group} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-content-secondary">
                {group.group}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const value = ready ? tokens[item.name] : "";
                  const isMissing = ready && !value;
                  return (
                    <div
                      key={item.name}
                      className={cn(
                        "flex items-center gap-3 rounded-md border p-2",
                        isMissing
                          ? "border-border-error bg-state-error-subtle"
                          : "border-border-default",
                      )}
                    >
                      {item.kind === "color" ? (
                        <span
                          className="size-10 shrink-0 rounded-sm border border-border-strong"
                          style={{ background: `var(${item.name})` }}
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface-elevated">
                          {item.kind === "radius" ? (
                            <span
                              className={cn(
                                "size-6 border border-border-strong bg-surface-panel",
                                item.demoClass,
                              )}
                            />
                          ) : null}
                          {item.kind === "shadow" ? (
                            <span
                              className={cn(
                                "size-5 rounded-sm bg-surface-elevated",
                                item.demoClass,
                              )}
                            />
                          ) : null}
                          {item.kind === "text" ? (
                            <span
                              className={cn("leading-none", item.demoClass)}
                            >
                              A
                            </span>
                          ) : null}
                          {item.kind === "font" ? (
                            <span
                              className={cn(
                                "text-sm leading-none",
                                item.demoClass,
                              )}
                            >
                              Ag
                            </span>
                          ) : null}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs text-content-secondary">
                          {item.name}
                        </span>
                        <span className="block truncate font-mono text-xs text-content-tertiary">
                          {ready ? value || "未定义" : "读取中…"}
                        </span>
                        <span className="block truncate text-xs text-content-tertiary">
                          {item.usage}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- 对比度 ---------------- */}
      <Section
        id="contrast"
        title="对比度矩阵"
        desc="文字令牌 × 表面令牌逐个实测。这里最容易暴露的冲突是：按钮背景用了主色，但文字色与主色的对比度不够正文标准。"
      >
        <Panel className="p-0">
          <div className="divide-y divide-border-default">
            {contrastResults.length === 0 ? (
              <p className="p-4 text-sm text-content-tertiary">读取中…</p>
            ) : (
              contrastResults.map((row) => (
                <div
                  key={`${row.fg}-${row.bg}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                >
                  <span
                    className="flex h-9 w-32 shrink-0 items-center justify-center rounded-md border border-border-default text-xs"
                    style={{
                      background: `var(${row.bg})`,
                      color: `var(${row.fg})`,
                    }}
                  >
                    Aa 示例
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-content-secondary">
                      {row.usage}
                    </span>
                    <span className="block truncate font-mono text-xs text-content-tertiary">
                      {row.fg} on {row.bg}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-content-secondary">
                    {row.ratio === null
                      ? "无法解析"
                      : `${row.ratio.toFixed(2)}:1`}
                  </span>
                  <Badge
                    tone={row.exempt ? "neutral" : row.failed ? "warn" : "ok"}
                  >
                    {row.exempt ??
                      (row.ratio === null
                        ? "解析失败"
                        : row.failed
                          ? `不达标（需 ${row.min}:1）`
                          : row.ratio >= 7
                            ? "AAA"
                            : row.ratio >= 4.5
                              ? "AA"
                              : "AA 大字")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Panel>
      </Section>

      {/* ---------------- 圆角 / 阴影 / 字体 ---------------- */}
      <Section
        id="primitives"
        title="圆角 / 阴影 / 字体"
        desc="令牌本身是嵌套的：卡片用 rounded-xl + shadow-sm，输入框与按钮共用 rounded-md。放大对照可确认层级没有被写错。"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="space-y-3">
            <p className="text-sm font-medium">圆角层级</p>
            <div className="flex items-end gap-3">
              {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"].map(
                (cls) => (
                  <div key={cls} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "size-12 border border-border-strong bg-surface-elevated",
                        cls,
                      )}
                    />
                    <span className="font-mono text-xs text-content-tertiary">
                      {cls}
                    </span>
                  </div>
                ),
              )}
            </div>
          </Panel>
          <Panel className="space-y-3">
            <p className="text-sm font-medium">阴影层级</p>
            <div className="flex items-end gap-3">
              {[
                "shadow-xs",
                "shadow-sm",
                "shadow-md",
                "shadow-lg",
                "shadow-glow",
              ].map((cls) => (
                <div key={cls} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "size-12 rounded-md bg-surface-elevated",
                      cls,
                    )}
                  />
                  <span className="font-mono text-xs text-content-tertiary">
                    {cls.replace("shadow-", "")}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="space-y-3">
            <p className="text-sm font-medium">字号 / 字体</p>
            <div className="space-y-1">
              <p className="text-xs text-content-tertiary">xs 辅助标签</p>
              <p className="text-sm text-content-secondary">sm 组件默认字号</p>
              <p className="text-base">base 输入框文字</p>
              <p className="text-lg">lg 小标题</p>
              <p className="text-xl">xl 标题</p>
              <p className="text-2xl">2xl 页面标题</p>
              <p className="text-3xl">3xl 主标题</p>
              <p className="font-mono text-sm text-content-secondary">
                mono 代码 0O1lI
              </p>
            </div>
          </Panel>
        </div>

        <Panel className="space-y-2">
          <p className="text-sm font-medium">字体接入检查</p>
          <CheckRow
            label="--font-sans 是否为主题声明值"
            tone={ready && appFonts?.sans ? "ok" : "warn"}
            status={ready && appFonts?.sans ? "已声明" : "缺失"}
            detail={
              <span className="font-mono text-xs text-content-tertiary">
                {appFonts?.sans ? appFonts.sans.slice(0, 48) + "…" : ""}
              </span>
            }
          />
          <CheckRow
            label="next/font Geist 变量是否参与 --font-sans"
            tone={
              appFonts?.geistSans && appFonts.sans.includes("geist")
                ? "ok"
                : "info"
            }
            status={
              appFonts?.geistSans && appFonts.sans.includes("geist")
                ? "已接入"
                : "已挂载但未使用"
            }
            detail={
              <span className="font-mono text-xs text-content-tertiary">
                body 上声明了 --font-geist-sans，但 preflight 取的是 --font-sans
              </span>
            }
          />
        </Panel>
      </Section>

      {/* ---------------- 组件约束 ---------------- */}
      <Section
        id="components"
        title="组件约束"
        desc="把组件的变体、状态、槽位组合全部摆开，检查默认样式之间是否互相打架（例如间距、层级、状态色）。"
      >
        <div className="grid gap-4">
          <Panel className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Button 变体 × 尺寸</p>
              <p className="text-xs text-content-tertiary">
                同一变体在不同尺寸下只应改变高度与内边距；若描边或文字色随尺寸变化，即为约束冲突。
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-130 border-collapse text-left">
                <thead>
                  <tr>
                    {["variant", ...BUTTON_SIZES].map((head) => (
                      <th
                        key={head}
                        className="border-b border-border-default pb-2 text-xs font-medium text-content-tertiary"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BUTTON_VARIANTS.map((variant) => (
                    <tr key={variant}>
                      <td className="py-2 pr-3 font-mono text-xs text-content-tertiary">
                        {variant}
                      </td>
                      {BUTTON_SIZES.map((size) => (
                        <td key={size} className="py-2">
                          <Button variant={variant} size={size}>
                            {size === "icon" ? "+" : "按钮"}
                          </Button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="space-y-3">
            <p className="text-sm font-medium">Button 状态约束</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled>禁用</Button>
              <Button variant="outline" disabled>
                禁用描边
              </Button>
              <Button aria-invalid>aria-invalid</Button>
              <Button variant="outline" aria-invalid>
                aria-invalid 描边
              </Button>
            </div>
            <p className="text-xs text-content-tertiary">
              检查点：disabled 应为 opacity-50 且不响应指针；aria-invalid
              应同时改描边与焦点环（Tab 依次聚焦
              上面四个按钮，对比焦点环颜色是否一致）。
            </p>
          </Panel>

          <Panel className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Input 状态与覆盖</p>
              <p className="text-xs text-content-tertiary">
                输入框共用 rounded-md 与 border-strong 描边；最后一组用外部
                className 覆盖描边与底色，验证覆盖能力。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-input-default">默认（含 placeholder）</Label>
                <Input id="ds-input-default" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-input-value">带值</Label>
                <Input id="ds-input-value" defaultValue="hello@taishuai.dev" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-input-invalid">错误态</Label>
                <Input
                  id="ds-input-invalid"
                  aria-invalid
                  defaultValue="格式错误"
                />
                <p className="text-xs text-state-error">请输入有效邮箱</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-input-override">外部覆盖描边与底色</Label>
                <Input
                  id="ds-input-override"
                  className="border-border-error bg-state-error-subtle"
                  placeholder="覆盖后仍应保持圆角与高度"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-input-disabled">
                  禁用（Label 未挂 peer）
                </Label>
                <Input
                  id="ds-input-disabled"
                  disabled
                  defaultValue="不可编辑"
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="ds-input-peer"
                  className="peer"
                  disabled
                  defaultValue="peer"
                />
                <Label htmlFor="ds-input-peer">
                  禁用 + peer（Label 应同步变淡）
                </Label>
              </div>
            </div>
            <p className="text-xs text-content-tertiary">
              检查点：Label 自带的 peer-disabled 规则要求输入框带 peer 类且排在
              Label 之前。若使用方不写 peer，禁用时 Label
              不会同步变淡——上面两组即为对照，属于组件约束缺口。
            </p>
          </Panel>

          <Panel className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Card 槽位与分隔线约束</p>
              <p className="text-xs text-content-tertiary">
                Card 默认 gap-6 / py-6；Header 带 border-b 时会补 pb-6，Footer
                带 border-t 时会补 pt-6。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>带分隔线的 Header</CardTitle>
                  <CardDescription>
                    标题与说明应分别落在 primary / tertiary 层级。
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-content-secondary">
                  正文使用次级文字色，与说明文字拉开层级。
                </CardContent>
                <CardFooter className="gap-3 border-t">
                  <Button size="sm">主操作</Button>
                  <Button size="sm" variant="ghost">
                    取消
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>默认 Card</CardTitle>
                  <CardDescription>
                    与左侧对比：padding 是否因 border-b / border-t 而变化。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Separator />
                  <div className="flex h-12 items-center gap-3 text-sm text-content-tertiary">
                    <span>水平分隔线</span>
                    <Separator orientation="vertical" />
                    <span>垂直分隔线（需要父级高度）</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Panel>
        </div>
      </Section>

      {/* ---------------- 类名合并 ---------------- */}
      <Section
        id="merge"
        title="类名合并（tailwind-merge）"
        desc="组件默认样式与外部 className 靠 cn() 消解冲突。若自定义令牌类名没被 tailwind-merge 识别，两个冲突类会同时留在 class 上，胜负改由 CSS 顺序决定——属于隐患。"
      >
        <Panel className="p-0">
          <div className="divide-y divide-border-default">
            {mergeResults.map((row) => (
              <div key={row.label} className="space-y-1 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm text-content-secondary">
                    {row.label}
                  </span>
                  <span className="ml-auto">
                    <Badge tone={row.ok ? "ok" : "warn"}>
                      {row.ok ? "已消解" : "未消解"}
                    </Badge>
                  </span>
                </div>
                <p className="font-mono text-xs text-content-tertiary">
                  入参 {row.classes.join(" + ")}
                </p>
                <p className="font-mono text-xs text-content-secondary">
                  输出 {row.merged}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      {/* ---------------- 描边与焦点 ---------------- */}
      <Section
        id="border"
        title="描边与焦点"
        desc="主题不再提供全局 border-color 兜底，裸 border 会退回 currentColor。这里并排对照，确认组件与页面的描边都来自 border 令牌。"
      >
        <Panel className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border px-3 py-2 text-xs text-content-tertiary">
              裸 border（取 currentColor）
            </div>
            <div className="rounded-md border border-border-default px-3 py-2 text-xs text-content-tertiary">
              border-default
            </div>
            <div className="rounded-md border border-border-focus px-3 py-2 text-xs text-content-secondary">
              border-focus（模拟聚焦）
            </div>
          </div>
          <p className="text-xs text-content-tertiary">
            检查点：三块描边若明显不一致，说明有地方漏写 border 令牌；裸 border
            继承文字色，透明度与 border-default 并不等价。
          </p>
        </Panel>

        <Panel className="space-y-3">
          <p className="text-sm font-medium">焦点环</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-md border border-border-focus p-2 ring-[3px] ring-border-focus">
              <Button size="sm" variant="outline">
                默认焦点环
              </Button>
            </div>
            <div className="rounded-md border border-border-error p-2 ring-[3px] ring-border-error/40">
              <Button size="sm" variant="outline" aria-invalid>
                错误态焦点环
              </Button>
            </div>
            <div className="rounded-md border border-border-focus p-2 ring-[3px] ring-border-focus/50">
              <Button size="sm" variant="outline">
                叠加 /50 后的焦点环
              </Button>
            </div>
          </div>
          <p className="text-xs text-content-tertiary">
            focus 令牌已内置 48% 透明度，再叠加 /50
            会淡到接近不可见——第三块即为此类误用。键盘 Tab
            依次聚焦可复核组件实际焦点环。
          </p>
        </Panel>
      </Section>

      <footer className="border-t border-border-default pt-6 text-xs text-content-tertiary">
        令牌来源 packages/ui/src/theme.css　·　组件来源
        packages/ui/src　·　本页只做检查，不承担视觉展示职责
      </footer>
    </main>
  );
}

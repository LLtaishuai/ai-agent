import { cn } from "./lib/utils";

interface TailwindCheckProps {
  /** 使用方名称，用于确认这份样式是在哪个子站编译的 */
  appName: string;
  className?: string;
}

const checks = [
  "@theme 共享令牌",
  "@source 扫描 ui 包",
  "sm: 响应式生效",
  "dark: 暗色生效",
];

/**
 * 用于验证 Tailwind 在 monorepo 中是否接通的探针组件。
 * 它位于共享包里，只要子站页面里能看到带品牌色的卡片，就说明
 * 共享主题 + 共享包源码扫描都正常。
 */
export function TailwindCheck({ appName, className }: TailwindCheckProps) {
  return (
    <section
      data-testid="tailwind-check"
      className={cn(
        "flex w-full max-w-md flex-col gap-3 rounded-card border border-brand-200 bg-brand-50 p-5",
        "dark:border-brand-700 dark:bg-brand-500/10",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white">
          Tailwind OK
        </span>
        <span className="font-mono text-xs text-brand-700 dark:text-brand-300">
          @repo/ui · {appName}
        </span>
      </div>

      <p className="text-sm text-foreground/70">
        样式来自共享包 <code className="font-mono text-brand-700 dark:text-brand-300">packages/ui</code>
        ，由 {appName} 的 Tailwind 编译。
      </p>

      <ul className="grid grid-cols-1 gap-2 text-xs text-foreground/70 sm:grid-cols-2">
        {checks.map((check) => (
          <li
            key={check}
            className="rounded-md bg-brand-100 px-2 py-1.5 dark:bg-brand-500/15"
          >
            {check}
          </li>
        ))}
      </ul>
    </section>
  );
}

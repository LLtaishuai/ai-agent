/** 使用方名称，用于确认这份样式是在哪个子站编译的 */
type TailwindDemoProps = {
  appName: string;
};

const features = [
  "Shared Tailwind utilities",
  "Shared theme tokens",
  "Rendered from @repo/ui",
];

/**
 * 用于验证 Tailwind 在 monorepo 中是否接通的探针组件。
 * 它位于共享包里，只要子站页面里能看到带品牌色的卡片，就说明
 * 共享主题 + 共享包源码扫描都正常。
 */
export function TailwindDemo({ appName }: TailwindDemoProps) {
  return (
    <section
      data-testid="tailwind-demo"
      className="w-full max-w-4xl rounded-card bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(49,94,232,0.45))] p-6 shadow-card backdrop-blur md:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <span className="inline-flex w-fit items-center rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-brand-700 uppercase">
            shared ui · {appName}
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Tailwind runs in {appName} and still styles shared TSX.
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm shadow-black/10"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
import { TailwindDemo } from "@repo/ui/tailwind-demo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          web · @repo/ui
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          shadcn/ui 基础组件已在共享包中就绪
        </h1>
        <p className="text-muted-foreground">
          下面的卡片与表单元素全部来自共享包，样式由 theme.css 的语义令牌驱动。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>订阅产品更新</CardTitle>
          <CardDescription>
            验证 Card / Label / Input / Button 的组合与默认间距。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="web-email">邮箱</Label>
          <Input id="web-email" type="email" placeholder="you@example.com" />
        </CardContent>
        <CardFooter className="gap-3">
          <Button>订阅</Button>
          <Button variant="outline">稍后再说</Button>
        </CardFooter>
      </Card>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground">
          Tailwind 探针
        </span>
        <Separator className="flex-1" />
      </div>

      <TailwindDemo appName="web" />
    </main>
  );
}

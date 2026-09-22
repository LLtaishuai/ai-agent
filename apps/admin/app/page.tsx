import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Separator } from "@repo/ui/separator";

const metrics = [
  { label: "今日请求", value: "12,480" },
  { label: "平均延迟", value: "312 ms" },
  { label: "失败率", value: "0.4%" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            admin · @repo/ui
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">控制台</h1>
        </div>
        <Button variant="secondary">刷新数据</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="gap-2 py-5">
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-2xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Separator />

      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>使用控制台账号继续。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-account">账号</Label>
            <Input id="admin-account" placeholder="admin" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">密码</Label>
            <Input id="admin-password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">登录</Button>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground">或</span>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" className="w-full">
            使用 SSO 登录
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

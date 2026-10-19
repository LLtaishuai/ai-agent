import { type PingRequest } from "@repo/contracts";
import { Card, CardContent } from "@repo/ui/card";

import { postPing } from "../api/system/ping.api";

const rpcPayload: PingRequest = { name: "web" };

export default async function Home() {
  const requestBody = JSON.stringify(rpcPayload, null, 2);
  const pingResult = await postPing();
  const responseBody = JSON.stringify(pingResult, null, 2);
  return (
    <section className="py-10">
      <Card className="overflow-hidden border border-border bg-background shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              RPC validation
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Shared request and response contract
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">
              POST /rpc/system/ping
            </span>
            <span className="rounded-full border border-border px-3 py-1">
              {pingResult.ok ? "ok=true" : `code=${pingResult.error.code}`}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Request</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-muted-foreground">
                {requestBody}
              </pre>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Response</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all text-xs leading-6 text-muted-foreground">
                {responseBody}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

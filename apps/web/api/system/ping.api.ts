import type { ApiResponse, PingRequest, PingResponse } from "@repo/contracts";
import { BizCode } from "@repo/contracts";
import type { AppType } from "@repo/api";
import { hc } from "hono/client";
import { getWebServerEnv } from "../../env.server";

const rpcPayload: PingRequest = { name: "web" };

const env = getWebServerEnv();

export async function postPing(): Promise<ApiResponse<PingResponse>> {
  const client = hc<AppType>(env.API_BASE_URL);
  try {
    const response = await client.rpc.system.ping.$post({
      json: rpcPayload,
    });

    return await response.json();
  } catch (error) {
    return {
      ok: false,
      error: {
        code: BizCode.SYSTEM_UPSTREAM_TIMEOUT,
        message: error instanceof Error ? error.message : "API request failed",
      },
      meta: {
        requestId: "unavailable",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

import type { ApiResponse, PingRequest } from "@repo/contracts";
import { BizCode } from "@repo/contracts";
import type { AppType } from "@repo/api";
import { hc, type InferResponseType } from "hono/client";
import { getWebServerEnv } from "../../env.server";

const rpcPayload: PingRequest = { name: "web" };

type PingRpcResponse = InferResponseType<
  ReturnType<typeof hc<AppType>>["rpc"]["system"]["ping"]["$post"]
>;

const env = getWebServerEnv();

export async function postPing(): Promise<PingRpcResponse> {
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

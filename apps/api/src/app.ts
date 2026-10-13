import {
  BizCode,
  PingRequestSchema,
  buildFailure,
  buildSuccess,
  type ApiMeta,
} from '@repo/contracts'
import { flattenError, type ZodType } from 'zod'
import { Hono, type Env } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator, type Hook } from '@hono/zod-validator'
import { getApiEnv } from './env'

/**
 * JSON 请求校验失败时的统一处理函数。
 * 使用项目约定的失败响应结构返回 400 错误。
 * 泛型 S 约束为 zod v4 schema，确保 error 类型为 $ZodError。
 */
const onJsonValidationError = <S extends ZodType>(
  result: Parameters<Hook<unknown, Env, string, 'json', {}, S>>[0],
  c: Parameters<Hook<unknown, Env, string, 'json', {}, S>>[1],
) => {
  if (!result.success) {
    const errorMsg = {
      code: BizCode.COMMON_INVALID_REQUEST,
      message: 'Invalid request payload',
      details: flattenError(result.error),
    }
    return c.json(buildFailure(errorMsg, createMeta()), 400)
  }
}

type AppErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500 | 504

/**
 * Worker 运行时绑定类型。
 * 显式定义以避免依赖 wrangler 生成的全局 CloudflareBindings 类型，
 * 使依赖 @repo/api 的消费方（如 web）无需引入该全局声明。
 * 字段需与 wrangler.toml 中的 vars 保持同步。
 */
interface ApiBindings {
  APP_ENV: string
}

class AppError extends Error {
  constructor(
    readonly code: BizCode,
    message: string,
    readonly status: AppErrorStatus,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

const app = new Hono<{ Bindings: ApiBindings }>()

function createMeta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
}

app.onError((error, c) => {
  const meta = createMeta()

  if (error instanceof AppError) {
    const errorMsg = { code: error.code, message: error.message, details: error.details }
    const res = buildFailure(errorMsg, meta);
    return c.json(res, error.status);
  }

  if (error instanceof HTTPException) {
    const errorMsg = { code: BizCode.COMMON_INVALID_REQUEST, message: error.message }
    const res = buildFailure(errorMsg, meta);
    return c.json(res, error.status);
  }

  console.error(error)

  const errorMsg = { code: BizCode.SYSTEM_INTERNAL_ERROR, message: 'Internal server error' }
  const res = buildFailure(errorMsg, meta);
  return c.json(res, 500);
})

app.notFound((c) => {
  const errorMsg = { code: BizCode.COMMON_NOT_FOUND, message: 'Not found' }
  const res = buildFailure(errorMsg, createMeta());
  return c.json(res, 404);
})

const routes = app
  .get('/health', (c) => {
    const env = getApiEnv(c.env)
    const res = buildSuccess({ service: 'api', env: env.APP_ENV }, createMeta());
    return c.json(res);
  })
  .post('/rpc/system/ping', zValidator('json', PingRequestSchema, onJsonValidationError),
    (c) => {
      const env = getApiEnv(c.env)
      const payload = c.req.valid('json')
      const successMsg = { service: 'api', message: `pong, ${payload.name}`, env: env.APP_ENV } 
      const res = buildSuccess(successMsg, createMeta());
    return c.json(res);
  });

export type AppType = typeof routes;

export default app;
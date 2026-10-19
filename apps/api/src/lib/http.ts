import { BizCode, buildFailure, type ApiMeta } from '@repo/contracts'
import type { Hook } from '@hono/zod-validator'
import type { Env } from 'hono'
import { flattenError, type ZodType } from 'zod'

/**
 * 创建响应元信息
 */
export function createMeta(): ApiMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
}

/**
 * JSON 请求校验失败时的统一处理函数。
 * 使用项目约定的失败响应结构返回 400 错误。
 * 泛型 S 约束为 zod v4 schema，确保 error 类型为 $ZodError。
 */
export const onJsonValidationError = <S extends ZodType>(
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

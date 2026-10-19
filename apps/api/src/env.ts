import { z } from 'zod'

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>

/**
 * Worker 运行时绑定类型。
 * 显式定义以避免依赖 wrangler 生成的全局 CloudflareBindings 类型，
 * 使依赖 @repo/api 的消费方（如 web）无需引入该全局声明。
 * 字段需与 wrangler 配置中的 vars 保持同步。
 */
export type ApiBindings = ApiEnv

export function getApiEnv(bindings: unknown): ApiEnv {
  return apiEnvSchema.parse({
    APP_ENV: (bindings as Record<string, unknown> | undefined)?.APP_ENV,
  })
}
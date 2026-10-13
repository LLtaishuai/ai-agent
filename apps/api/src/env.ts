import { z } from 'zod'

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>

export function getApiEnv(bindings: unknown): ApiEnv {
  return apiEnvSchema.parse({
    APP_ENV: (bindings as Record<string, unknown> | undefined)?.APP_ENV,
  })
}
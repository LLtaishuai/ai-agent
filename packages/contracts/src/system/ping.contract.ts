import z from "zod"

/**
 * Ping请求参数Schema
 */
export const PingRequestSchema = z.object({
  name: z.string().trim().min(1),
})

/**
 * Ping请求响应体Schema
 */
export const PingResponseSchema = z.object({
  service: z.literal('api'),
  message: z.string(),
})

/**
 * Ping请求参数
 */
export type PingRequest = z.infer<typeof PingRequestSchema>
/**
 * Ping响应数据
 */
export type PingResponse = z.infer<typeof PingResponseSchema>
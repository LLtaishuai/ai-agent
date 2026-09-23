import { z } from 'zod'

/**
 * 业务错误码
 */
export const BizCode = {
  COMMON_INVALID_REQUEST: 'COMMON.INVALID_REQUEST',
  COMMON_NOT_FOUND: 'COMMON.NOT_FOUND',
  AUTH_UNAUTHORIZED: 'AUTH.UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH.FORBIDDEN',
  BIZ_CONFLICT: 'BIZ.CONFLICT',
  BIZ_RULE_VIOLATION: 'BIZ.RULE_VIOLATION',
  SYSTEM_INTERNAL_ERROR: 'SYSTEM.INTERNAL_ERROR',
  SYSTEM_UPSTREAM_TIMEOUT: 'SYSTEM.UPSTREAM_TIMEOUT',
} as const

export type BizCode = (typeof BizCode)[keyof typeof BizCode]

/**
 * API元数据
 */
export interface ApiMeta {
  requestId: string
  timestamp: string
}

/**
 * API成功响应
 */
export interface ApiSuccess<T> {
  ok: true
  data: T
  meta: ApiMeta
}

/**
 * API错误接口
 */
export interface ApiError<E = unknown> {
  code: BizCode
  message: string
  details?: E
}

/**
 * API失败响应
 */
export interface ApiFailure<E = unknown> {
  ok: false
  error: ApiError<E>
  meta: ApiMeta
}

export type ApiResponse<T, E = unknown> = ApiSuccess<T> | ApiFailure<E>

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

/**
 * 构建成功响应
 */
export function buildSuccess<T>(data: T, meta: ApiMeta): ApiSuccess<T> {
  return { ok: true, data, meta }
}

/**
 * 构建失败响应
 */
export function buildFailure<E = unknown>(
  error: ApiError<E>,
  meta: ApiMeta,
): ApiFailure<E> {
  return { ok: false, error, meta }
}
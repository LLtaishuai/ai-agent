import { BizCode } from "./bizCode"

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
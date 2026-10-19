import { PingRequestSchema, buildSuccess } from '@repo/contracts'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'

import { getApiEnv, type ApiBindings } from '../../env'
import { createMeta, onJsonValidationError } from '../../lib/http'

const pingRoute = new Hono<{ Bindings: ApiBindings }>().post(
  '/',
  zValidator('json', PingRequestSchema, onJsonValidationError),
  (c) => {
    const env = getApiEnv(c.env)
    const payload = c.req.valid('json')
    const successMsg = { service: 'api', message: `pong, ${payload.name}`, env: env.APP_ENV }
    const res = buildSuccess(successMsg, createMeta())
    return c.json(res)
  },
)

export default pingRoute

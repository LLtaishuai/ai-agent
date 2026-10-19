import { buildSuccess } from '@repo/contracts'
import { Hono } from 'hono'

import { getApiEnv, type ApiBindings } from '../../env'
import { createMeta } from '../../lib/http'

const healthRoute = new Hono<{ Bindings: ApiBindings }>().get('/', (c) => {
  const env = getApiEnv(c.env)
  const res = buildSuccess({ service: 'api', env: env.APP_ENV }, createMeta())
  return c.json(res)
})

export default healthRoute

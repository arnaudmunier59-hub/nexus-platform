import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'

/**
 * Middleware to add request ID to each request
 */
export async function requestId(fastify: any) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = request.headers['x-request-id'] as string || uuidv4()
    request.id = id
    reply.header('x-request-id', id)
  })
}

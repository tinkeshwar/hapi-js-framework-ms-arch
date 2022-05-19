'use strict'

import Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import documentor from './documentor'
import routes from '../libs/configs/route'
import logger from '../libs/configs/logger'
import Joi from 'joi'

const { SERVER_PORT, SERVER_HOST, JWT_TOKEN } = process.env

const serverPoint = {
  host: SERVER_HOST,
  port: SERVER_PORT,
  routes: {
    cors: {
      origin: ['*'],
      credentials: true,
      headers: ['Accept', 'Content-Type', 'Authorization'],
      additionalHeaders: ['X-localization']
    },
    validate: {
      failAction: async (err: Error) => {
        throw Boom.badRequest(err.message)
      }
    }
  }
} as Record<string, unknown>
  
if (process.env.NODE_ENV === 'development') {
  serverPoint.debug = { request: ['error'] }
}
  
export const server = new Hapi.Server(serverPoint)

let prepared = false

const prepare = async (): Promise<void> => {
  if (prepared) {
    return
  }
  server.ext('onPreResponse', (request) => {
    const response = request.response as {
            isBoom: boolean;
            isServer: boolean;
            error?: string;
            message: string;
            output: { payload: Record<string, unknown>; };
            data: Record<string, unknown>;
        }

    if (response.isBoom && process.env.NODE_ENV === 'test') {
      logger.error(response)
    }

    if (response.isBoom && response.output && response.output.payload) {
      response.output.payload.status_code = response.output.payload.statusCode
      delete response.output.payload.statusCode
    }

    if (response && response.isBoom && response.isServer) {
      const error = response.error || response.message
      if (!response.data || !response.data.skipLogs) {
        server.log('error', error)
      }
    }

    return response
  })
  await server.register(documentor as [])
  server.auth.strategy('token', 'jwt', {
    key: JWT_TOKEN,
    validate: ()=> {return true} // AuthService.verify
  })
  server.validator(Joi)
  server.route(routes)
  prepared = true
}

export const start = async (): Promise<Hapi.Server> => {
  await prepare()
  await server.start()
  logger.info(`Server started on port: ${SERVER_PORT}`)
  logger.info(`Explorer is available at: http://${SERVER_HOST}:${SERVER_PORT}/explorer`)
  return server
}

export const init = async (): Promise<Hapi.Server> => {
  await prepare()
  await server.initialize()
  return server
}

export const stop = async (): Promise<void> => {
  await server.stop()
}
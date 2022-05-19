'use strict'

import { compact } from 'lodash'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import HapiSwagger from 'hapi-swagger'
import HapiAuthJwt from 'hapi-auth-jwt2'

const {
  NODE_ENV,
  SERVER_SSL
} = process.env
  
export default compact([
  {
    plugin: HapiSwagger,
    options: {
      schemes: [SERVER_SSL === 'true' ? 'https' : 'http'],
      info: {
        title: process.env.npm_package_name !== undefined ? process.env.npm_package_name.toUpperCase() : 'NA',
        description: process.env.npm_package_description !== undefined ? process.env.npm_package_description : 'NA',
        version: process.env.npm_package_version !== undefined ? process.env.npm_package_version : 'NA'
      },
      expanded: 'none',
      basePath: '/api/a/v1/',
      pathPrefixSize: 5,
      pathReplacements: [],
      documentationPage: NODE_ENV === 'development',
      documentationPath: '/explorer',
      securityDefinitions: {
        token: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          'x-keyPrefix': 'Bearer '
        }
      },
      security: [{ token: [] }]
    }
  },
  Inert,
  Vision,
  HapiAuthJwt
])
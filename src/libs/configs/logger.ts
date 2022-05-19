'use strict'

import winston from 'winston'

const devLogger = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf((info) => {
    const {  timestamp, level, message, ...args } = info
    const ts = timestamp.slice(0, 19).replace('T', ' ')
    return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`
  })
)
  
const prodLogger = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
)
export default winston.createLogger({
  level: (process.env.NODE_ENV === 'development') ? 'debug' : 'info',
  format: (process.env.NODE_ENV === 'development') ? devLogger : prodLogger,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' })
  ]
})
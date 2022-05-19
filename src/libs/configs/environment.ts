'use strict'

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import dotenv from 'dotenv'
import logger from './logger'

const requiredVars: string[] = []

dotenv.config({ path: path.join(__dirname, '.env') })

export const config = () => {
  const readFileLine = readline.createInterface({
    input: fs.createReadStream(path.join(__dirname, '../../../.env.example'))
  })

  readFileLine.on('line', (line) => {
    if (!line) {
      return
    }

    if (line.charAt(0) === '#') {
      return
    }

    const [variableName] = line.split('=')

    if (!variableName) {
      return
    }
    requiredVars.push(variableName)
  })

  readFileLine.on('close', () => {
    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        logger.error(`Variable ${variable} is empty.`)
      }
    }
  })
}
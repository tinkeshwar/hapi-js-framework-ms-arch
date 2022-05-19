import * as Hapi from '@hapi/hapi'
import Boom from '@hapi/boom'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import Busboy from 'busboy'
import path from 'path'
import os from 'os'

interface IFileUploadInterface {
    file: string,
    ext: string
}

interface IUploadOptionsInterface {
  type: string[],
  size: number,
  file: number,
  field: number 
}

class UploadService {
  public static async upload (request: Hapi.Request, options: IUploadOptionsInterface):Promise<IFileUploadInterface|Error> {
    let uploadError: undefined
    return new Promise((resolve, reject) => {
      try {
        const uploadResponse: IFileUploadInterface = {
          file: '',
          ext: ''
        }
        const busboy = Busboy({
          headers: request.raw.req.headers,
          limits: {
            files: options.file,
            fields: options.field,
            parts: 10000,
            fileSize: options.size
          }
        })
        busboy.on('file', async (fieldname: string, file: any, info: any) => {
          const { mimeType, filename } = info
          if (!options.type.includes(mimeType)) {
            uploadError = Boom.forbidden(
              `MIME type is not allowed. Allowed MIME types: ${options.type.join(', ')}.`
            ) as any
            return file.resume()
          }
          uploadResponse.file = path.join(os.tmpdir(), `${path.basename(fieldname)}-${uuidv4()}`)
          uploadResponse.ext = path.extname(filename).toLowerCase()
          const fileStream = fs.createWriteStream(uploadResponse.file)
          file.once('limit', () => {
            uploadError = Boom.entityTooLarge('File size larger than allowed.') as any
            file.resume()
          })
          file.pipe(fileStream)
        })
        busboy.once('finish', async () => {
          if (uploadError) {
            return reject(uploadError)
          }
          return resolve(uploadResponse)
        })
        busboy.once('error', reject)
        request.raw.req.pipe(busboy)
      } catch (error: any) {
        return error
      }
    })
  }
}

export default UploadService

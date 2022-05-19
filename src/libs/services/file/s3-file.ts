import AWS from 'aws-sdk'
import path from 'path'
import stream from 'stream'
import urljoin from 'url-join'
import IFileDescription from './interface-file'
import IFileSystemConnector from './interface-file-service'

const {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
  AWS_S3_REGION,
  AWS_S3_ACCESS
} = process.env

const s3 = new AWS.S3({
  apiVersion: 'latest',
  region: AWS_S3_REGION,
  accessKeyId: AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: AWS_S3_SECRET_ACCESS_KEY
})

const handleFileNotFoundError = (error: Error & { code: string; }, message?: string) => {
  if (['NotFound', 'NoSuchKey'].includes((error as Error & { code: string; }).code)) {
    throw new Error(message || 'File not found')
  }
}

class S3FSConnector implements IFileSystemConnector {
  public readonly publicUrl: string
  private readonly bucketName: string

  public constructor (bucketName: string) {
    this.bucketName = bucketName
    this.publicUrl = `https://${bucketName}.s3.amazonaws.com`
  }

  public async fileExists (filepath: string): Promise<boolean> {
    try {
      await s3.headObject({
        Bucket: this.bucketName,
        Key: this.normalizePath(filepath)
      }).promise()
    } catch (error) {
      if ((error as Error & { code: string; }).code !== 'NotFound') {
        throw error
      }
      return false
    }
    return true
  }

  public async createFile (filepath: string, data: string | Buffer, rewrite = false): Promise<IFileDescription> {
    if (!rewrite && (await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} already exists`)
    }
    await s3.putObject({
      Bucket: this.bucketName,
      Key: this.normalizePath(filepath),
      Body: data,
      ACL: AWS_S3_ACCESS
    }).promise()
    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    return {
      filepath: normalizedPath,
      filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
      ext: parsedNormalizedPath.ext,
      dir: parsedNormalizedPath.dir,
      publicUrl: urljoin(this.publicUrl, normalizedPath)
    }
  }

  public async createFileUploadStream (
    filepath: string,
    rewrite = false
  ): Promise<{ uploadStream: stream.Writable; promise: Promise<IFileDescription>; }> {
    if (!rewrite && (await this.fileExists(filepath))) {
      throw new Error('File already exists')
    }
    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    const uploadStream = new stream.PassThrough()
    const promise = s3.upload({
      Bucket: this.bucketName,
      Key: this.normalizePath(filepath),
      Body: uploadStream,
      ACL: AWS_S3_ACCESS
    }).promise().then(() => ({
      filepath: normalizedPath,
      filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
      ext: parsedNormalizedPath.ext,
      dir: parsedNormalizedPath.dir,
      publicUrl: urljoin(this.publicUrl, normalizedPath)
    }))
    return { uploadStream, promise }
  }

  public async updateFile (filepath: string, data: string | Buffer): Promise<IFileDescription> {
    await s3.putObject({
      Bucket: this.bucketName,
      Key: this.normalizePath(filepath),
      Body: data,
      ACL: AWS_S3_ACCESS
    }).promise()
    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    return {
      filepath: normalizedPath,
      filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
      ext: parsedNormalizedPath.ext,
      dir: parsedNormalizedPath.dir,
      publicUrl: urljoin(this.publicUrl, normalizedPath)
    }
  }

  public async getFile (filepath: string): Promise<{ file: IFileDescription; data: string | Buffer; }> {
    try {
      const { Body } = await s3.getObject({
        Bucket: this.bucketName,
        Key: this.normalizePath(filepath)
      }).promise()
      const data = Body as Buffer
      const normalizedPath = this.normalizePath(filepath)
      const parsedNormalizedPath = path.parse(normalizedPath)
      return {
        file: {
          filepath: normalizedPath,
          filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
          ext: parsedNormalizedPath.ext,
          dir: parsedNormalizedPath.dir,
          publicUrl: urljoin(this.publicUrl, normalizedPath)
        },
        data
      }
    } catch (error: any) {
      handleFileNotFoundError(error, `File ${filepath} not found`)
      throw error
    }
  }

  public async createFileDownloadStream (
    filepath: string
  ): Promise<{ downloadStream: stream.Readable; promise: Promise<IFileDescription>; }> {
    const getObject = s3.getObject({
      Bucket: this.bucketName,
      Key: this.normalizePath(filepath)
    })
    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    const downloadStream = getObject.createReadStream()
    const promise = new Promise((resolve, reject) => {
      downloadStream.on('error', reject)
      downloadStream.on('end', () => resolve({
        filepath: normalizedPath,
        filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
        ext: parsedNormalizedPath.ext,
        dir: parsedNormalizedPath.dir,
        publicUrl: urljoin(this.publicUrl, normalizedPath)
      }))
    }).catch((error) => {
      handleFileNotFoundError(error, `File ${filepath} not found`)
      throw error
    }) as Promise<IFileDescription>
    return Promise.resolve({ downloadStream, promise })
  }

  public async copyFile (srcFilepath: string, destFilepath: string): Promise<IFileDescription> {
    const normalizedSrcPath = this.normalizePath(srcFilepath)
    const normalizedDestPath = this.normalizePath(destFilepath)
    try {
      await s3.copyObject({
        Bucket: this.bucketName,
        CopySource: path.join(`/${this.bucketName}`, normalizedSrcPath),
        Key: this.normalizePath(normalizedDestPath)
      }).promise()
      return (await this.getFile(destFilepath)).file
    } catch (error) {
      if (['NotFound', 'NoSuchKey'].includes((error as Error & { code: string; }).code)) {
        throw new Error(`File ${normalizedSrcPath} not found`)
      }
      throw error
    }
  }

  public async listFiles (dirpath: string): Promise<IFileDescription[]> {
    const prefix = this.normalizePath(dirpath)
    const dirLevel = prefix.split('/').length
    try {
      const { Contents } = await s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: this.normalizePath(dirpath)
      }).promise()
      if (!Contents) {
        return []
      }
      return Contents
        .filter((item) => ((item.Key as string).split('/').length === (dirLevel + 1)))
        .map((item) => {
          const normalizedPath = this.normalizePath(item.Key as string)
          const parsedNormalizedPath = path.parse(normalizedPath)
          return {
            filepath: normalizedPath,
            filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
            ext: parsedNormalizedPath.ext,
            dir: parsedNormalizedPath.dir,
            publicUrl: urljoin(this.publicUrl, normalizedPath)
          }
        })
        .filter((item) => item.ext)
    } catch (error:any) {
      handleFileNotFoundError(error, `Directory ${dirpath} not found`)
      throw error
    }
  }

  public async deleteFile (filepath: string): Promise<IFileDescription> {
    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} not found`)
    }
    try {
      await s3.deleteObject({
        Bucket: this.bucketName,
        Key: this.normalizePath(filepath)
      }).promise()
      const normalizedPath = this.normalizePath(filepath)
      const parsedNormalizedPath = path.parse(normalizedPath)
      return {
        filepath: normalizedPath,
        filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
        ext: parsedNormalizedPath.ext,
        dir: parsedNormalizedPath.dir,
        publicUrl: urljoin(this.publicUrl, normalizedPath)
      }
    } catch (error: any) {
      handleFileNotFoundError(error, `File ${filepath} not found`)
      throw error
    }
  }

  private normalizePath (filepath: string) {
    return path.normalize(filepath).replace(/^(\.\.(\/|\\|$))+/, '')
  }
}

export default S3FSConnector

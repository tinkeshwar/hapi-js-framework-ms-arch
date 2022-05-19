import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import urljoin from 'url-join'
import IFileDescription from './interface-file'
import IFileSystemConnector from './interface-file-service'

class OSFileConnector implements IFileSystemConnector {
  public readonly publicUrl: string
  private basepath: string

  public constructor (fsPath = './static') {
    this.basepath = path.resolve(fsPath)
    this.publicUrl = urljoin(process.env.SERVER_HOST_URL as string, this.normalizePath(fsPath))
  }

  public async fileExists (filepath: string): Promise<boolean> {
    return fs.existsSync(this.resolvePath(filepath))
  }

  public async createFile (
    filepath: string,
    data: string | Buffer,
    rewrite = false
  ): Promise<{ filepath: string; filename: string; ext: string; dir: string; publicUrl: string; }> {
    const fullpath = this.resolvePath(filepath)
    const parsedFullpath = path.parse(fullpath)

    await mkdirp(parsedFullpath.dir)
    if (!rewrite && (await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} already exists`)
    }
    await fs.promises.writeFile(fullpath, data, { flag: (rewrite) ? 'w' : 'wx' })
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
  ): Promise<{ uploadStream: fs.WriteStream; promise: Promise<IFileDescription>; }> {
    const fullpath = this.resolvePath(filepath)
    const parsedFullpath = path.parse(fullpath)
    await mkdirp(parsedFullpath.dir)
    if (!rewrite && (await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} already exists`)
    }

    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    const uploadStream = fs.createWriteStream(fullpath, { flags: (rewrite) ? 'w' : 'wx' })
    const promise: Promise<IFileDescription> = new Promise((resolve, reject) => {
      uploadStream.once('close', () => resolve({
        filepath: normalizedPath,
        filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
        ext: parsedNormalizedPath.ext,
        dir: parsedNormalizedPath.dir,
        publicUrl: urljoin(this.publicUrl, normalizedPath)
      }))
      uploadStream.once('error', reject)
    })
    return { uploadStream, promise }
  }

  public async updateFile (
    filepath: string,
    data: string | Buffer
  ): Promise<{ filepath: string; filename: string; ext: string; dir: string; publicUrl: string; }> {
    const fullpath = this.resolvePath(filepath)
    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} not found`)
    }
    await fs.promises.writeFile(fullpath, data)
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

  public async getFile (filepath: string): Promise<{
    file: {filepath: string; filename: string; ext: string; dir: string; publicUrl: string;};
    data: Buffer;
  }> {
    const fullpath = this.resolvePath(filepath)

    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} not found`)
    }
    const data = await fs.promises.readFile(fullpath)
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
  }

  public async createFileDownloadStream (filepath: string): Promise<{
    downloadStream: fs.ReadStream;
    promise: Promise<IFileDescription>;
  }> {
    const fullpath = this.resolvePath(filepath)

    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} not found`)
    }

    const normalizedPath = this.normalizePath(filepath)
    const parsedNormalizedPath = path.parse(normalizedPath)
    const downloadStream = fs.createReadStream(fullpath)
    const promise: Promise<IFileDescription> = new Promise((resolve, reject) => {
      downloadStream.once('close', () => resolve({
        filepath: normalizedPath,
        filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
        ext: parsedNormalizedPath.ext,
        dir: parsedNormalizedPath.dir,
        publicUrl: urljoin(this.publicUrl, normalizedPath)
      }))
      downloadStream.once('error', reject)
    })

    return { downloadStream, promise }
  }

  public async copyFile (srcFilepath: string, destFilepath: string): Promise<{
    filepath: string;
    filename: string;
    ext: string;
    dir: string;
    publicUrl: string;
  }> {
    const srcFullpath = this.resolvePath(srcFilepath)
    const destFullpath = this.resolvePath(destFilepath)
    const parsedDestFullpath = path.parse(destFullpath)

    await mkdirp(parsedDestFullpath.dir)
    if (!(await this.fileExists(srcFilepath))) {
      throw new Error(`File ${srcFilepath} not found`)
    }
    await fs.promises.copyFile(srcFullpath, destFullpath)
    return (await this.getFile(destFilepath)).file
  }

  public async deleteFile (filepath: string): Promise<{
    filepath: string;
    filename: string;
    ext: string;
    dir: string;
    publicUrl: string;
  }> {
    const fullpath = this.resolvePath(filepath)

    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${filepath} not found`)
    }
    await fs.promises.unlink(fullpath)

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

  public async listFiles (dirpath: string): Promise<IFileDescription[]> {
    const fullpath = this.resolvePath(dirpath)
    const items = await fs.promises.readdir(fullpath)

    return items.map((filepath: string): IFileDescription => {
      const normalizedPath = this.normalizePath(path.join(dirpath, filepath))
      const parsedNormalizedPath = path.parse(normalizedPath)

      return {
        filepath: normalizedPath,
        filename: `${parsedNormalizedPath.name}${parsedNormalizedPath.ext}`,
        ext: parsedNormalizedPath.ext,
        dir: parsedNormalizedPath.dir,
        publicUrl: urljoin(this.publicUrl, normalizedPath)
      }
    }).filter((file) => (file.ext))
  }

  private normalizePath (filepath: string): string {
    return path.normalize(filepath).replace(/^(\.\.(\/|\\|$))+/, '')
  }

  private resolvePath (filepath: string) {
    return path.join(this.basepath, this.normalizePath(filepath))
  }
}

export default OSFileConnector

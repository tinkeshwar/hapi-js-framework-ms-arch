import { Readable, Writable } from 'stream'
import IFileDescription from './interface-file'

interface IUploadStreamCreationResult {
  uploadStream: Writable;
  promise: Promise<IFileDescription>;
}

interface IDownloadStreamCreationResult {
  downloadStream: Readable;
  promise: Promise<IFileDescription>;
}

interface IFileSystemConnector {
  publicUrl: string;
  fileExists(filepath: string): Promise<boolean>;
  createFile(filepath: string, data: string | Buffer, rewrite?: boolean): Promise<IFileDescription>;
  createFileUploadStream(filepath: string, rewrite?: boolean): Promise<IUploadStreamCreationResult>;
  getFile(filepath: string): Promise<{ file: IFileDescription; data: string | Buffer; }>;
  createFileDownloadStream(filepath: string): Promise<IDownloadStreamCreationResult>;
  updateFile(filepath: string, data: string | Buffer): Promise<IFileDescription>;
  copyFile(srcFilepath: string, destFilepath: string): Promise<IFileDescription>;
  deleteFile(filepath: string): Promise<IFileDescription>;
  listFiles(dirpath: string): Promise<IFileDescription[]>;
}

export default IFileSystemConnector

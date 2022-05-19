import { JobOptions } from 'bull'
import toSnakeCase from 'to-snake-case'
import { Job } from '../../models'

export interface IJobData {
  [key: string]: any;
}

export interface IJobDescription {
  id?: number;
  data: IJobData;
}

export interface IJobManager {
  jobName: string;
  jobRecordName: string;
  // eslint-disable-next-line no-use-before-define
  new (jobManager: IJobDescription, jobRecord: any): JobManager;
  schedule(...args: any[]): Promise<{ data: IJobData; opts?: JobOptions; }>;
  init(jobManager: IJobDescription): Promise<any>;
  // eslint-disable-next-line no-use-before-define
  create(jobManager: IJobDescription): Promise<JobManager>;
}

abstract class JobManager {
  protected static jobName?: string
  public readonly jobManager: IJobDescription
  private jobRecord: Job

  public constructor (jobManger: IJobDescription, jobRecord: Job) {
    this.jobManager = jobManger
    this.jobRecord = jobRecord
  }

  public static get jobRecordName (): string {
    return toSnakeCase(this.jobName || '').toUpperCase()
  }

  public static async init (jobManager: IJobDescription): Promise<Job> {
    const jobRecord = await Job.create({
      jobName: this.jobRecordName,
      jobData: jobManager.data,
      history: JSON.stringify({ status: 'QUEUED', updated_at: new Date() })
    })
    await jobRecord.update({ jobId: jobRecord.id })

    return jobRecord
  }

  public static async create (this: IJobManager, jobManager: IJobDescription): Promise<JobManager> {
    const jobRecord = await Job.findOne({
      where: {
        jobName: this.jobRecordName,
        jobId: jobManager.id as number
      }
    })

    if (!jobRecord) {
      throw new Error('Job not found')
    }

    return new this(jobManager, jobRecord)
  }

  public async update (status: string): Promise<void> {
    await this.jobRecord.updateStatus(status)
  }

  public abstract process(data: IJobData): Promise<any>;
}

export default JobManager

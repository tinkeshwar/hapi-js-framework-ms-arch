import ses from 'node-ses'
import logger from '../../configs/logger'
import IEnvelope from './interface-envelope'
import IMailService from './interface-mail-service'

const {
  AMAZON_MAIL_KEY,
  AMAZON_MAIL_SECRET,
  AMAZON_MAIL_REGION,
  MAIL_FROM,
  MAIL_SEND_TITLE_PREFIX,
  NODE_ENV
} = process.env

if(NODE_ENV === 'production' && (!AMAZON_MAIL_KEY || !AMAZON_MAIL_SECRET || !AMAZON_MAIL_REGION)){
  throw new Error('AWS SES credentials not configured.')
}

const aws = ses.createClient({ 
  key: AMAZON_MAIL_KEY || '', 
  secret: AMAZON_MAIL_SECRET || '',
  amazon: `https://email.${AMAZON_MAIL_REGION}.amazonaws.com`
})

if(NODE_ENV === 'development'){
  process.env.DEBUG = 'node-ses'
}

class AmazonMailService implements IMailService {
  public async sendToEmail (email: string, data: IEnvelope): Promise<void> {
    const mailData = {
      to: email,
      from: `${MAIL_SEND_TITLE_PREFIX || ''} <${MAIL_FROM || ''}>`,
      subject: data.subject,
      message: data.html || '',
      altText: data.text || ''
    }

    await new Promise<void>((resolve, reject) => {
      aws.sendEmail(mailData, (err) => {
        if (err) {
          logger.error(err)
          return reject(err)
        }
        return resolve()
      })
    })
  }
}

export default AmazonMailService
import mailgunFactory from 'mailgun-js'
import logger from '../../configs/logger'
import IEnvelope from './interface-envelope'
import IMailService from './interface-mail-service'

const {
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  MAIL_FROM,
  MAIL_SEND_TITLE_PREFIX,
  NODE_ENV
} = process.env

const mailgun = mailgunFactory({
  apiKey: MAILGUN_API_KEY as string,
  domain: MAILGUN_DOMAIN as string,
  testMode: (NODE_ENV === 'development'),
  testModeLogger: (options, payload) => {
    logger.info(JSON.stringify(payload))
    logger.info(options)
  }
})

class MailGunService implements IMailService {
  public async sendToEmail (email:string, data: IEnvelope): Promise<void> {
    const mailData = {
      from: `${MAIL_SEND_TITLE_PREFIX || ''} <${MAIL_FROM || ''}>`,
      to: email,
      subject: data.subject,
      text: data.text,
      html: data.html
    }

    await new Promise<void>((resolve, reject) => {
      mailgun.messages().send(mailData, (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }
}

export default MailGunService

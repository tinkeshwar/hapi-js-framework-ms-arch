import AmazonMailService from './amazon-mail'
import IEnvelope from './interface-envelope'
import IMailService from './interface-mail-service'
import MailGunService from './mailgun-mail'


class MailService {
  private static connected: IMailService
  private static get connector () {
    if (!this.connected) {
      this.init()
    }
    return this.connected
  }

  private static init () {
    switch (process.env.MAIL_TYPE) {
    case 'amazon':
      this.connected = new AmazonMailService(); break
    case 'mailgun':
      this.connected = new MailGunService(); break
    default:
      throw new Error('No payment service assigned.')
    }
  }
  
  public static async sendToEmail (email: string, data: IEnvelope):Promise<void> {
    return this.connector.sendToEmail(email, data)
  }

  public async sendToEmail (email: string, data: IEnvelope): Promise<void> {
    return MailService.sendToEmail(email, data)
  }
}

export default MailService

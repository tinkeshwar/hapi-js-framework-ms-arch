import IEnvelope from './interface-envelope'

interface IMailService {
    sendToEmail(email: string, data: IEnvelope): Promise<void>;
}

export default IMailService
export default interface IEnvelope {
  subject: string;
  text?: string;
  html?: string;
  attachment?: any;
}
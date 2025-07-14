export interface IMessageInterface {
  recipient_name: string;
  message: string;
  support_email: string;
}

export interface MailInterface {
  from?: string;

  to: string;

  subject?: string;

  text?: string;

  context?: any;

  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
    encoding?: string;
  }>;

  [key: string]: any;
}

export interface ArticleInterface {
  title: string;
  description: string;
  link: string;
}

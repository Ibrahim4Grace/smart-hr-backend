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

  [key: string]: any;
}

export interface ArticleInterface {
  title: string;
  description: string;
  link: string;
}

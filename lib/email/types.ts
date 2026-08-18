export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType?: string;
  }
  
  export interface SendEmailParams {
    to: string[];
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
  }
  
  export interface SendEmailResult {
    messageId: string;
  }
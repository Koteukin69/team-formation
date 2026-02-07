import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

export async function send(email: string, subject: string, html: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email, 
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }
    
    return true
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

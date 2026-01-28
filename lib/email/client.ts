import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

export async function sendAuthCode(email: string, code: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Код подтверждения - Team Formation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                    padding: 20px; background: #f4f4f5; border-radius: 8px; margin: 24px 0; }
            .footer { color: #71717a; font-size: 14px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Вход в Team Formation</h1>
            <p>Используйте этот код для входа в систему:</p>
            <div class="code">${code}</div>
            <p>Код действителен 10 минут.</p>
            <p class="footer">
              Если вы не запрашивали этот код, просто проигнорируйте это письмо.
            </p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

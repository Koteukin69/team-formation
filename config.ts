import { template, TemplateExecutor } from 'lodash';

interface RateLimitConfig {
  window: number,
  max: number,
}

interface IConfig {
  name: string,
  briefDescription: string,
  description: string,
  email: string,
  authCodeTtlMs: number,
  emailSubject: TemplateExecutor,
  emailHtml: TemplateExecutor,
  rateLimits: {
    email: RateLimitConfig,
    ipPerMinute: RateLimitConfig,
    ipPerHour: RateLimitConfig,
  },
}

const Config:IConfig = {
  name: "Team Formation",
  briefDescription: "Продвинутая система формирования команд для марафонов/хаккатонов по модели рекрутинговых платформ.",
  description: `
Продвинутая система формирования команд для марафонов/хаккатонов по модели рекрутинговых платформ, где команда - работодатель, а участник марафона - соискатель.
Автор Koteukin69 - https://github.com/koteukin69/
`,
  email: "tf@llland.ru",
  authCodeTtlMs: 10 * 60 * 1000,
  rateLimits: {
    email: { window: 60 * 60 * 1000, max: 5 },
    ipPerMinute: { window: 60 * 1000, max: 2 },
    ipPerHour: { window: 60 * 60 * 1000, max: 7 },
  },
  emailSubject: template("Вход в <%= name %>"),
  emailHtml: template(`
<!DOCTYPE html>
<html lang="ru">
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
    <h1>Вход в <%= name %></h1>
    <p>Используйте этот код для входа в систему:</p>
    <div class="code"><%= code %></div>
    <p>Код действителен 10 минут.</p>
    <p class="footer">
      Если вы не запрашивали этот код, просто проигнорируйте это письмо.
    </p>
  </div>
</body>
</html>
  `),
};

export default Config;


import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly brevoUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      this.logger.error('BREVO_API_KEY não configurada no .env');
      return;
    }
    this.logger.log('Brevo (HTTP) inicializado com sucesso.');
  }

  async sendOtpEmail(
    to: string,
    code: string,
    nomeCompleto: string,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const fromEmail =
      this.configService.get<string>('BREVO_FROM_EMAIL') ||
      'everton.lbrito@souunit.com.br';
    const fromName =
      this.configService.get<string>('BREVO_FROM_NAME') || 'MilaTec';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'BREVO_API_KEY precisa estar configurada no .env para envio do código por e-mail.',
      );
    }

    const firstName = nomeCompleto?.split(' ')[0] || 'usuário';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f7f9fc;">
        <div style="background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f5;">
          <h2 style="color: #050866; margin: 0 0 8px;">Olá, ${firstName}!</h2>
          <p style="color: #4a5672; line-height: 1.6;">
            Use o código abaixo para acessar a plataforma MilaTec:
          </p>
          <div style="background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%); padding: 28px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px solid #dbe5f4;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #050866;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7ea7; font-size: 14px; line-height: 1.6;">
            Este código expira em 10 minutos. Se você não solicitou este acesso, ignore este e-mail.
          </p>
        </div>
        <p style="text-align: center; color: #9aa5b8; font-size: 12px; margin-top: 16px;">
          © MilaTec — Portal do Cliente
        </p>
      </div>
    `;

    const payload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject: 'Seu código de acesso - MilaTec',
      htmlContent: html,
    };

    try {
      const response = await fetch(this.brevoUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseBody: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          responseBody?.message || responseBody?.code || `HTTP ${response.status}`;
        this.logger.error(
          `Brevo retornou erro (${response.status}) para ${to}: ${JSON.stringify(responseBody)}`,
        );
        throw new InternalServerErrorException(
          `Falha ao enviar e-mail: ${message}`,
        );
      }

      this.logger.log(
        `OTP enviado para ${to} (messageId: ${responseBody?.messageId || 'sem id'})`,
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error(`Erro ao enviar e-mail para ${to}: ${error.message}`);
      throw new InternalServerErrorException(
        `Falha ao enviar e-mail: ${error.message || 'erro desconhecido'}`,
      );
    }
  }
}
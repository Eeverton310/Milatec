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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px 16px; background: #eef2f9;">
        <div style="background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f5; box-shadow: 0 8px 30px rgba(7,17,40,0.08);">

          <!-- Cabeçalho com a marca MilaTec -->
          <div style="background: linear-gradient(135deg, #050866 0%, #004ae8 100%); padding: 32px 32px 26px; text-align: center;">
            <div style="display: inline-block; background: #ffffff; border-radius: 14px; padding: 10px 20px;">
              <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #050866;">Mila</span><span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #00a34a;">Tec</span>
            </div>
            <p style="margin: 14px 0 0; color: rgba(255,255,255,0.82); font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600;">
              Portal do Cliente
            </p>
          </div>

          <!-- Corpo -->
          <div style="padding: 32px;">
            <h2 style="color: #050866; margin: 0 0 10px; font-size: 22px;">Olá, ${firstName}!</h2>
            <p style="color: #4a5672; line-height: 1.6; margin: 0;">
              Use o código abaixo para acessar o portal da MilaTec:
            </p>

            <!-- Código -->
            <div style="background: linear-gradient(180deg, #f7faff 0%, #eef4ff 100%); padding: 26px; text-align: center; border-radius: 14px; margin: 26px 0; border: 1px solid #dbe5f4;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #004ae8;">${code}</span>
            </div>

            <p style="color: #6b7ea7; font-size: 14px; line-height: 1.6; margin: 0;">
              Este código expira em <strong style="color:#4a5672;">10 minutos</strong>. Se você não solicitou este acesso, pode ignorar este e-mail com segurança.
            </p>
          </div>

          <!-- Rodapé -->
          <div style="background: #f7f9fc; padding: 18px 32px; border-top: 1px solid #eef2f9; text-align: center;">
            <p style="margin: 0; color: #9aa5b8; font-size: 12px;">
              © ${new Date().getFullYear()} MilaTec — Estruturas metálicas
            </p>
          </div>

        </div>
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
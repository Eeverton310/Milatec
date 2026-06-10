import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AirtableService } from '../airtable/airtable.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /* Armazenamento temporário de códigos OTP em memória */ 
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private readonly airtableService: AirtableService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  /* Gera um código numérico de 6 dígitos. */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /* POST /auth/login
     Recebe e-mail, valida contra o Airtable e envia OTP por e-mail. */
  async login(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    /* Verifica se o e-mail existe no Airtable */ 
    const contact = await this.airtableService.findContactByEmail(
      normalizedEmail,
    );

    if (!contact) {
      throw new UnauthorizedException(
        'Acesso não autorizado. E-mail não cadastrado na base MilaTec.',
      );
    }

    /* Gera OTP e salva em memória (expira em 10 min)*/ 
    const code = this.generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.otpStore.set(normalizedEmail, { code, expiresAt });

    /* Envia por e-mail */
    await this.mailService.sendOtpEmail(
      normalizedEmail,
      code,
      contact.nomeCompleto,
    );

    this.logger.log(`OTP gerado e enviado para ${normalizedEmail}`);

    return { message: 'Código enviado para o e-mail informado.' };
  }

  /* POST /auth/verify
     Valida o código OTP e retorna JWT. */
  async verify(
    email: string,
    code: string,
    requestedRole?: string,
  ): Promise<{ access_token: string; email: string; role: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = this.otpStore.get(normalizedEmail);

    if (!entry) {
      throw new UnauthorizedException(
        'Nenhum código ativo para este e-mail. Solicite um novo.',
      );
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(normalizedEmail);
      throw new UnauthorizedException('Código expirado. Solicite um novo.');
    }

    if (entry.code !== code) {
      throw new UnauthorizedException('Código inválido.');
    }

    /* Código validado — remove da memória */
    this.otpStore.delete(normalizedEmail);

    const contact = await this.airtableService.findContactByEmail(
      normalizedEmail,
    );

    if (!contact) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    /*
      Regra de perfil:
      - se o Airtable tiver campo de perfil/admin, ele prevalece;
      - se ainda não houver esse campo na base, usamos o perfil escolhido no frontend.
      Isso mantém o MVP funcionando e não quebra a área administrativa.
    */
    const selectedRole = requestedRole === 'admin' ? 'admin' : 'client';
    const role = contact.role === 'admin' ? 'admin' : selectedRole;

    /* Gera JWT com permissões e empresa */
    const payload = {
      email: normalizedEmail,
      role,
      companyId: contact.companyId || null,
    };
    const access_token = this.jwtService.sign(payload);

    this.logger.log(`Autenticação realizada para ${normalizedEmail}`);

    return {
      access_token,
      email: normalizedEmail,
      role,
    };
  }
}
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O código é obrigatório.' })
  @Length(6, 6, { message: 'O código deve ter 6 dígitos.' })
  code: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'client', 'company'], { message: 'Perfil inválido.' })
  role?: string;
}
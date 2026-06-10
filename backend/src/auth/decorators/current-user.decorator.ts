import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/* Decorator para acessar o usuário autenticado na rota.
  Uso: @CurrentUser() user: { email: string }*/
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
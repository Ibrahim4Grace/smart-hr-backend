import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserPayload } from '@modules/user/interface/user.interface';

// This works if AuthGuard attaches user object to request
export const GetUser = createParamDecorator((data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (!user) throw new UnauthorizedException('No user found in request');

  return data ? user?.[data] : user;
});

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// This works if AuthGuard attaches user object to request
export const GetUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
